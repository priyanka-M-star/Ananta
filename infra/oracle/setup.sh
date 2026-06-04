#!/usr/bin/env bash
#
# One-time Oracle Cloud ARM VM (Always-Free A1.Flex) setup.
#
# Provision the VM in Oracle's console:
#   - Shape: VM.Standard.A1.Flex, 4 OCPU, 24 GB RAM
#   - Image: Canonical Ubuntu 22.04 (ARM)
#   - Region: Mumbai (ap-mumbai-1) for low Karnataka latency
#   - Boot volume: 100 GB
#   - VCN with default 0.0.0.0/0 ingress on 22 (SSH only; rest goes via Cloudflare Tunnel)
#
# Then SSH in and run:
#   curl -fsSL https://raw.githubusercontent.com/<you>/ananta/main/infra/oracle/setup.sh | sudo bash

set -euo pipefail

echo "==> Updating apt"
apt-get update
apt-get -y upgrade
apt-get -y install ca-certificates curl gnupg lsb-release ufw fail2ban git unattended-upgrades

echo "==> Setting up unattended security updates"
dpkg-reconfigure --priority=low unattended-upgrades

echo "==> Installing Docker Engine"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "==> Adding ananta user"
if ! id ananta >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash --groups docker ananta
fi
mkdir -p /home/ananta/app
chown -R ananta:ananta /home/ananta

echo "==> Firewall (Oracle's security list still applies; this is a second layer)"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
# LiveKit needs UDP — but only if you're not routing it through Cloudflare Tunnel
ufw allow 50000:60000/udp
ufw --force enable

echo "==> Fail2ban"
systemctl enable --now fail2ban

echo "==> Keep-alive ping (Oracle reclaims idle VMs)"
cat > /etc/cron.d/ananta-ping <<'EOF'
*/30 * * * * root curl --silent --max-time 5 https://api.ananta.app/v1/health > /dev/null || true
EOF
chmod 644 /etc/cron.d/ananta-ping

echo "==> Swap (24 GB RAM is plenty, but a small swap helps spikes)"
if ! swapon --show | grep -q swapfile; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Docker daemon settings (cap container log size globally)"
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "5" }
}
EOF
systemctl restart docker

echo ""
echo "==> Done. Next steps:"
echo "    1. su - ananta"
echo "    2. git clone <repo-url> ~/app && cd ~/app"
echo "    3. cp infra/prod.env.example infra/prod.env  (fill in real values)"
echo "    4. echo \$GHCR_PAT | docker login ghcr.io -u <gh-user> --password-stdin"
echo "    5. docker compose -f infra/docker-compose.prod.yml --env-file infra/prod.env pull"
echo "    6. docker compose -f infra/docker-compose.prod.yml --env-file infra/prod.env up -d"
echo "    7. tail logs: docker compose -f infra/docker-compose.prod.yml logs -f"
