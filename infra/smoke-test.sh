#!/usr/bin/env bash
#
# End-to-end smoke test.
# Usage:
#   ./infra/smoke-test.sh                   # against http://localhost:4000/v1
#   API_URL=https://api.ananta.app/v1 ./infra/smoke-test.sh
#
# Exits non-zero on first failure, prints a green check on success.

set -euo pipefail

API_URL="${API_URL:-http://localhost:4000/v1}"
AI_URL="${AI_URL:-http://localhost:5000}"
PHONE="${PHONE:-9876543210}"

green() { printf "\033[32m✓\033[0m %s\n" "$*"; }
red()   { printf "\033[31m✗\033[0m %s\n" "$*"; }
step()  { printf "\n\033[1m→ %s\033[0m\n" "$*"; }

check_http() {
  local url="$1" code expect="${2:-200}"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" = "$expect" ]; then green "$url -> $code"; else red "$url -> $code (expected $expect)"; exit 1; fi
}

#-----------------------------------------------------
step "1. API liveness"
check_http "$API_URL/health"

step "2. API readiness (database reachable)"
ready=$(curl -s "$API_URL/health/ready")
echo "$ready" | grep -q '"status":"ready"' && green "DB up" || { red "DB unreachable: $ready"; exit 1; }

step "3. AI worker liveness"
check_http "$AI_URL/health"

step "4. Launch gate endpoint"
gate=$(curl -s "$API_URL/launch-gate")
echo "$gate" | grep -q '"reservations"' && green "Gate responding" || { red "Gate failed: $gate"; exit 1; }

step "5. OTP request"
otp_resp=$(curl -s -X POST "$API_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"purpose\":\"signup\"}")
code=$(echo "$otp_resp" | grep -o '"debug":"[0-9]\{6\}"' | grep -o '[0-9]\{6\}' || true)
if [ -z "$code" ]; then red "OTP request didn't return a debug code (is NODE_ENV=development?): $otp_resp"; exit 1; fi
green "OTP issued: $code"

step "6. OTP verify"
verify_resp=$(curl -s -X POST "$API_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"code\":\"$code\",\"purpose\":\"signup\"}")
token=$(echo "$verify_resp" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$token" ]; then red "Verify failed: $verify_resp"; exit 1; fi
green "Token issued (length ${#token})"

step "7. Onboard"
onboard_resp=$(curl -s -X POST "$API_URL/students/onboard" \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Smoke Test","grade":"GRADE_10","medium":"ENGLISH"}')
echo "$onboard_resp" | grep -q '"fullName"' && green "Student onboarded" || { red "Onboard failed: $onboard_resp"; exit 1; }

step "8. Get me"
me_resp=$(curl -s -H "Authorization: Bearer $token" "$API_URL/students/me")
echo "$me_resp" | grep -q '"fullName":"Smoke Test"' && green "Me returns student" || { red "Me failed: $me_resp"; exit 1; }

step "9. Get progress"
prog_resp=$(curl -s -H "Authorization: Bearer $token" "$API_URL/students/me/progress")
echo "$prog_resp" | grep -q '"memoryDeck"' && green "Progress returns" || { red "Progress failed: $prog_resp"; exit 1; }

step "10. Cleanup — login with same phone (should succeed)"
otp2=$(curl -s -X POST "$API_URL/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"purpose\":\"login\"}")
code2=$(echo "$otp2" | grep -o '"debug":"[0-9]\{6\}"' | grep -o '[0-9]\{6\}')
verify2=$(curl -s -X POST "$API_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"code\":\"$code2\",\"purpose\":\"login\"}")
echo "$verify2" | grep -q '"token"' && green "Re-login works" || { red "Re-login failed: $verify2"; exit 1; }

echo ""
printf "\033[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
printf "All smoke tests passed.\n"
printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n"
