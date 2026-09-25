# Vestigo — Ubuntu Setup Guide

Full setup from a clean Ubuntu machine to a running Vestigo (backend + frontend), for demo purposes.

## 0. Prerequisites

```bash
sudo apt update
sudo apt install -y git curl build-essential
```

Node.js (v18+ required, project tested on v22 via nvm):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc   # or ~/.zshrc
nvm install 22
```

Python 3.9+ (Ubuntu ships 3.12, fine as-is) — check:
```bash
python3 --version
```

Docker (used by `Dockerfile` / `Containerfile` if you containerize; not required to just run backend/frontend locally):
```bash
sudo apt install -y docker.io
sudo usermod -aG docker $USER   # log out/in after this
```

## 1. Clone

```bash
git clone <your-fork-or-repo-url> vestigo
cd vestigo
```
(You already have this at `/home/prajwal/Documents/vestigo`, skip if so.)

## 2. Run the automated installer

```bash
./setup.sh
```

This installs the Python venv + all deps, Ghidra, Qiling, cross-compiler toolchains, etc. It's heavy (~10GB, can take a long time). For a quick demo of just the web app (backend + frontend), you can skip the analysis tooling:

```bash
./setup.sh --minimal
```

Flags: `--skip-ghidra` `--skip-containers` `--skip-cross` `--skip-ml` `--minimal` `--dry-run`

Then activate the environment (do this in every new terminal you use for backend work):
```bash
source activate_vestigo.sh
```

## 3. Database (PostgreSQL)

Pick one:

**Local (simplest for an offline demo):**
```bash
sudo apt install -y postgresql
sudo -u postgres createdb vestigo
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```
Connection string: `postgresql://postgres:postgres@localhost:5432/vestigo`

**Cloud (Neon, no local install):**
Create a free DB at https://neon.tech and copy the connection string.

## 4. Configure `.env`

```bash
cp .env.example .env   # skip — .env already exists and is filled in
```
Edit `.env` and set at minimum:
- `DATABASE_URL` — from step 3
- `OPENAI_API_KEY` — from https://platform.openai.com/api-keys (needed for LLM-assisted analysis features)
- `GHIDRA_HOME` — leave as `/opt/ghidra` if `setup.sh` installed it there

Your `.env` already has these filled in — just verify `DATABASE_URL` matches whatever DB you set up in step 3.

## 5. Initialize the database schema

```bash
cd backend
npm install          # installs prisma CLI (backend/package.json has no deps listed yet — see note below)
npx prisma db push
npx prisma generate
cd ..
```

> Note: `backend/package.json` currently has no `prisma` dependency listed. If `npx prisma` fails, install it once: `cd backend && npm install prisma @prisma/client && cd ..`

## 6. Frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## 7. Run it

Two terminals, both after `source activate_vestigo.sh` in the backend one:

```bash
# Terminal 1 — backend
source activate_vestigo.sh
cd backend
uvicorn main:app --reload
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
```

Frontend will print a local URL (Vite default `http://localhost:5173`); backend serves the API (default `http://localhost:8000`).

## Troubleshooting

| Issue | Fix |
|---|---|
| Venv not found | `./setup.sh` |
| Python import errors | `pip install -r requirements.txt -r backend/requirements.txt` |
| Qiling rootfs missing | `git clone --depth 1 https://github.com/qilingframework/rootfs.git qiling_analysis/rootfs` |
| Ghidra not found | `export GHIDRA_HOME=/opt/ghidra` |
| DB errors | check `DATABASE_URL` in `.env`, rerun `npx prisma generate` |
| Frontend won't start | `cd frontend && rm -rf node_modules && npm install` |

## System requirements

- RAM: 8GB min, 16GB recommended
- Disk: ~10GB (more if running full analysis pipeline)
- Ports: 8000 (backend), 5173 (frontend), 5432 (postgres if local)
