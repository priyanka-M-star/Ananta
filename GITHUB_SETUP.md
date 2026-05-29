# GitHub Setup — One-time, ~15 minutes

This guide gets your Ananta code on GitHub and ready for daily push. Follow it once.

You'll need:
- A GitHub account (free is fine — go to https://github.com/signup)
- Git installed on Windows (https://git-scm.com/download/win — accept all defaults)

---

## Step 1 — Open a terminal in your project folder

Press <kbd>Win</kbd> + <kbd>R</kbd> → type `powershell` → Enter.

Navigate to the project:

```powershell
cd "C:\Users\priya\OneDrive\Documents\Claude\Projects\Ananta"
```

Verify you're in the right place:

```powershell
ls
```

You should see `README.md`, `LICENSE`, `.gitignore`, the HTML files, etc.

---

## Step 2 — Configure git (one-time)

Tell git who you are. Use the **same email you used on GitHub**.

```powershell
git config --global user.name "priyanka"
git config --global user.email "priyankauru5@gmail.com"
git config --global init.defaultBranch main
```

---

## Step 3 — Initialise the repo

```powershell
git init
git add .
git status
```

`git status` should list every file in green (staged). If it lists `node_modules/` or `.env`, STOP and tell me — `.gitignore` isn't working.

Now make the first commit:

```powershell
git commit -m "chore: initial commit — architecture, stack decisions, prototypes"
```

---

## Step 4 — Create the repo on GitHub

1. Go to https://github.com/new
2. **Repository name:** `ananta`
3. **Description:** `AI tutoring platform for Karnataka State Board · Pre-launch build`
4. **Visibility:** **Private** (do this — your code shouldn't be public until you're ready)
5. **DO NOT** check "Add a README" or "Add .gitignore" or "Choose a license" — we already have those
6. Click **Create repository**

GitHub shows you a page with "…or push an existing repository". Copy the HTTPS URL — it looks like:

```
https://github.com/<your-username>/ananta.git
```

---

## Step 5 — Connect local → GitHub and push

Back in PowerShell:

```powershell
git remote add origin https://github.com/<your-username>/ananta.git
git branch -M main
git push -u origin main
```

The first push will pop up a GitHub login window. Sign in with your browser.

✅ Done. Refresh GitHub — all your files should appear.

---

## Step 6 — Set up SSH (recommended, makes push faster)

HTTPS works but asks for login often. SSH is set-once-forget-forever.

```powershell
# Generate a key (press Enter at every prompt to accept defaults)
ssh-keygen -t ed25519 -C "priyankauru5@gmail.com"

# Show your public key (copy the whole line that appears)
cat ~/.ssh/id_ed25519.pub
```

Add the key to GitHub:
1. https://github.com/settings/keys
2. Click **New SSH key**
3. **Title:** `priyanka-laptop` (or whatever names your laptop)
4. **Key:** paste the line from `cat`
5. Click **Add SSH key**

Now switch your local repo from HTTPS to SSH:

```powershell
git remote set-url origin git@github.com:<your-username>/ananta.git
```

Test:

```powershell
ssh -T git@github.com
```

If you see `Hi <your-username>! You've successfully authenticated`, you're done.

---

## Step 7 — Invite your teammate

1. Go to your repo on GitHub
2. **Settings** → **Collaborators** → **Add people**
3. Enter their GitHub username/email
4. They'll get an email invitation

Once they accept, they can clone:

```bash
git clone git@github.com:<your-username>/ananta.git
cd ananta
```

---

## Step 8 — Protect the `main` branch (1 minute, saves disasters)

1. Repo → **Settings** → **Branches**
2. Click **Add branch ruleset** (or **Add classic branch protection rule**)
3. **Branch name pattern:** `main`
4. Check:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging (we'll add CI later)
5. Save

Now nobody (including you) can accidentally push broken code straight to `main`. All changes go through a Pull Request.

---

## Daily workflow — what I'll tell you to run

After every working session, I'll give you a commit message and you'll run:

```powershell
cd "C:\Users\priya\OneDrive\Documents\Claude\Projects\Ananta"

# See what changed
git status

# Stage everything
git add .

# Commit with the message I gave you
git commit -m "feat(api): add quiz grading endpoint"

# Push to GitHub
git push
```

That's it. Three commands. Your teammate will see the changes within seconds.

---

## If your teammate makes changes too

Before you start work each day:

```powershell
git checkout main
git pull origin main
```

Then create your branch and work as described in `CONTRIBUTING.md`.

---

## Common situations

**"I made changes but `git status` shows nothing"**
You're in the wrong folder. Run `pwd` (in PowerShell: `Get-Location`). Should end in `\Ananta`.

**"Permission denied (publickey)"**
SSH key not set up. Repeat Step 6, or fall back to HTTPS by:
`git remote set-url origin https://github.com/<your-username>/ananta.git`

**"I committed a file I shouldn't have (e.g. `.env`)"**
Tell me — there's a careful cleanup procedure (`git filter-repo`) but DO NOT just delete and re-commit; the secret is still in history.

**"git push rejected, non-fast-forward"**
Your teammate pushed something. Run `git pull --rebase origin main` first, then push again.

**"I lost track of what's on GitHub vs local"**
```powershell
git fetch origin
git log --oneline --all --graph -20
```

---

## You're done

Your code is on GitHub. Your teammate can see it. We can push daily.

Tomorrow when you open this project, I'll continue building — and at the end of the session, I'll give you the exact `git add / commit / push` commands.

Questions? Just ask in chat.
