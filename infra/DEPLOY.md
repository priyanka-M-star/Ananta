# Ananta — Deployment

How to take this code from `git clone` to live at `ananta.app`.

Everything fits inside the **Oracle Cloud Always-Free ARM VM** (4 OCPU, 24 GB RAM,
Mumbai region) plus **Cloudflare Tunnel** for the front door. Day-1 cost: ₹900/year
for the domain.

---

## Architecture

```
   Browser
      │
      ▼
   Cloudflare CDN (free)
      │
      ▼
   Cloudflare Tunnel (cloudflared)
      │
      ▼
┌──────────────────────────────────────────────────┐
│  Oracle ARM VM (4 vCPU, 24 GB)                   │
│  ┌────────┐  ┌────────┐  ┌─────────────────┐    │
│  │  web   │  │  api   │  │  ai-worker      │    │
│  │ Next   │  │ Nest   │  │ FastAPI+Celery  │    │
│  └────────┘  └────────┘  └─────────────────┘    │
│       │           │              │              │
│       └─────┬─────┴──────────────┘              │
│             ▼                                   │
│       ┌──────────┐  ┌────────┐  ┌─────────┐    │
│       │ Postgres │  │ Redis  │  │ LiveKit │    │
│       │ +pgvector│  │        │  │ (WebRTC)│    │
│       └──────────┘  └────────┘  └─────────┘    │
└──────────────────────────────────────────────────┘
```

`web` and `api` are never exposed publicly — Cloudflare Tunnel reaches them on the
private Docker network. The only public ports on the VM are SSH (22) and LiveKit's
UDP range (50000-60000) for WebRTC.

---

## One-time setup (~45 minutes)

### 1. Provision the Oracle VM

In the Oracle Cloud console:

1. **Compute → Instances → Create instance**
2. **Image:** Canonical Ubuntu 22.04 (Aarch64)
3. **Shape:** `VM.Standard.A1.Flex`, **4 OCPU, 24 GB RAM**
4. **Region:** `ap-mumbai-1` (lowest latency to Karnataka students)
5. **Boot volume:** 100 GB
6. **VCN:** default; add an SSH key
7. Open the **Security List** to allow inbound:
   - TCP 22 from `0.0.0.0/0` (SSH)
   - UDP 50000-60000 from `0.0.0.0/0` (LiveKit)

That's it. Don't open 80/443 — Cloudflare Tunnel handles HTTP.

### 2. Run the setup script

```bash
ssh ubuntu@<vm-ip>
sudo curl -fsSL https://raw.githubusercontent.com/<you>/ananta/main/infra/oracle/setup.sh | sudo bash
```

This installs Docker, creates the `ananta` user, configures firewall + fail2ban,
sets up swap, and writes a 30-min cron ping (Oracle reclaims idle free-tier VMs;
this keeps it busy).

### 3. Set up Cloudflare Tunnel

1. Buy `ananta.app` (Namecheap, ~₹900/yr). Transfer DNS to Cloudflare (free).
2. In Cloudflare dashboard → **Zero Trust → Networks → Tunnels → Create tunnel**.
3. Name it `ananta-prod`. Copy the **token** — you'll paste it into `prod.env`.
4. Under **Public Hostnames**, add:
   - `ananta.app` → `http://web:3000`
   - `api.ananta.app` → `http://api:4000`
   - `livekit.ananta.app` → `http://localhost:7880`

### 4. Configure secrets

```bash
sudo su - ananta
git clone https://github.com/<you>/ananta.git ~/app
cd ~/app
cp infra/prod.env.example infra/prod.env
$EDITOR infra/prod.env       # fill in everything; see comments in the file
```

Generate the secrets that don't come from external services:

```bash
openssl rand -base64 32     # → POSTGRES_PASSWORD
openssl rand -base64 48     # → JWT_SECRET
openssl rand -base64 32     # → INTERNAL_SHARED_SECRET
```

### 5. Set GitHub Actions secrets

In `Settings → Secrets and variables → Actions`, add:

| Name                | Value |
|---------------------|-------|
| `ORACLE_HOST`       | Public IP of the VM |
| `ORACLE_SSH_KEY`    | Private SSH key matching the `ananta` user |
| `GH_PACKAGES_PAT`   | A Personal Access Token with `read:packages` |

Now every push to `main` automatically:
1. Builds the three Docker images for `linux/arm64`
2. Pushes them to GHCR (`ghcr.io/<you>/ananta-{api,web,ai-worker}:<sha>`)
3. SSHes into the VM, pulls the new images, `docker compose up -d`, prunes old ones

### 6. First deploy (manual, then GitHub takes over)

```bash
# on the VM, as ananta
cd ~/app
echo $GH_PACKAGES_PAT | docker login ghcr.io -u <gh-user> --password-stdin
docker compose -f infra/docker-compose.prod.yml --env-file infra/prod.env pull
docker compose -f infra/docker-compose.prod.yml --env-file infra/prod.env up -d
```

Wait ~2 minutes (the AI worker downloads the embedding model on first start),
then visit `https://ananta.app`. The launch-gate pill should say "0 of 10".

### 7. Run database migrations + seed

```bash
# on the VM, exec into the api container
docker compose -f infra/docker-compose.prod.yml --env-file infra/prod.env \
  exec api node -e "require('child_process').execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: 'packages/db' })"

# seed subjects, plans, launch-gate config, achievements
docker compose -f infra/docker-compose.prod.yml --env-file infra/prod.env \
  exec api node packages/db/prisma/seed.ts
```

### 8. Verify

```bash
# from any machine
API_URL=https://api.ananta.app/v1 ./infra/smoke-test.sh
```

All 10 steps should print green checks.

---

## Day-to-day deploys

Just push to `main`. The GitHub Actions workflow handles everything.

Manual rollback:

```bash
# on the VM
cd ~/app
git log --oneline -10               # find the SHA you want
IMAGE_TAG=<sha> docker compose -f infra/docker-compose.prod.yml \
  --env-file infra/prod.env up -d
```

---

## When to upgrade beyond the free tier

| Trigger | Upgrade |
|--------|---------|
| Sustained CPU > 70% for 3+ days | Add a second Oracle ARM VM (still free) + put nginx in front |
| Postgres > 12 GB | Move to Hetzner CCX13 (€10/mo) |
| AI worker queue depth > 100 jobs | Add a Hetzner GPU box (~₹15-20k/mo) and run only the worker there |
| LiveKit concurrent rooms > 50 | Switch to LiveKit Cloud or shard across multiple VMs |

The trigger ladder is in `Ananta_Stack_Decisions.html` and `Ananta_Bootstrap_Plan.html`.

---

## Backups

Cron job on the VM (`crontab -e` as ananta):

```cron
# Nightly Postgres backup → R2
0 1 * * * docker exec ananta-prod-postgres-1 pg_dump -U ananta ananta | \
          gzip | aws --endpoint-url https://<account>.r2.cloudflarestorage.com \
          s3 cp - s3://ananta-backups/postgres-$(date +\%F).sql.gz

# Weekly retention prune (keep 28 days)
0 2 * * 0 aws --endpoint-url https://<account>.r2.cloudflarestorage.com \
          s3 ls s3://ananta-backups/ | awk '{print $4}' | \
          xargs -I{} aws s3api head-object --bucket ananta-backups --key {} | ...
```

(R2 storage is ~free at this scale; one Postgres dump is ~50-200 MB.)

---

## Common operations

```bash
# tail all logs
docker compose -f infra/docker-compose.prod.yml --env-file infra/prod.env logs -f

# restart one service
docker compose -f infra/docker-compose.prod.yml --env-file infra/prod.env restart api

# psql into the database
docker compose -f infra/docker-compose.prod.yml --env-file infra/prod.env \
  exec postgres psql -U ananta -d ananta

# free disk
docker system prune -af --volumes
```
