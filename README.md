# Splash-UI

Splash-UI is a developer tool that provides a safe graphical interface for editing configuration files (`JSON`, `YAML`, `XML`) in GitHub repositories, with approval workflows before changes are merged.

## Why Splash-UI

Teams often edit config files manually, which is error-prone and hard to govern. Splash-UI reduces risk by combining structured editing, change visibility, and pull-request based approvals.

## Core Features

1. **Authentication**
   - Email sign-in
   - GitHub OAuth sign-in

2. **Repository Reader**
   - Connect GitHub account
   - Browse accessible repositories and folders
   - Open JSON, YAML, and XML files

3. **Configuration Editor**
   - Structured UI for config editing
   - Change detection
   - Diff preview before save

4. **Approval + Pull Request Workflow**
   - Create branch from edited config
   - Commit changes automatically
   - Open GitHub Pull Request
   - Track approval workflow before merge

## Tech Stack

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Integrations:** GitHub API + OAuth
- **Config Parsing:** JSON, YAML, XML parsers
- **Infra:** Local-first with Docker, cloud-ready for AWS/Azure

## Project Goal

Enable developers and platform teams to manage repository configuration changes through a governed UI workflow, instead of manual file edits, while preserving GitHub-native review and merge practices.

## Offline development

Use Node.js 22 and Python 3.12. The web app and API run directly on your machine without Docker. Install dependencies once from the repository root:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r apps/api/requirements.txt
(cd apps/web && npm ci --no-audit --no-fund)
```

Start the offline API in one terminal:

```sh
cd apps/api
../../.venv/bin/python -m app.offline
```

Start the web app in another terminal:

```sh
cd apps/web
NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --hostname 127.0.0.1
```

Open [the repository browser](http://127.0.0.1:3000/repositories), select **inventory-service**, and open `config/service.json` or `config/worker.yaml`. Edit a value and choose **Save draft**. Drafts are held in memory until the API restarts. The sample files stay intact and GitHub pull requests are disabled.

The offline API is a separate loopback-only entry point. It uses committed fixture data, ignores GitHub credentials, and has no network fallback. The normal API command, `python -m uvicorn app.main:app` from `apps/api`, always uses live GitHub for repository operations and requires `GITHUB_TOKEN`. Keep that token in the API process environment with only the GitHub permissions needed for your work. `.env.example` documents the settings. Export those settings in the appropriate shell or pass them through your process manager.

### Install without an internet connection

On a connected machine using the same OS, architecture, Node version, and Python version as the offline machine, stage the dependencies:

```sh
.venv/bin/python -m pip download --only-binary=:all: --dest wheelhouse -r apps/api/requirements.txt
(cd apps/web && npm ci --cache ../../.npm --no-audit --no-fund)
```

Copy the wheelhouse and npm cache to the offline checkout, then create the environment and install:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install --no-index --find-links wheelhouse -r apps/api/requirements.txt
(cd apps/web && npm ci --cache ../../.npm --offline --no-audit --no-fund)
```

A cold cache cannot install missing packages. Next.js and some Python packages use platform-specific binaries, so prepare bundles for each target platform. Once installed, the offline development workflow needs only loopback connectivity.

### Verify

```sh
(cd apps/api && ../../.venv/bin/python -m unittest discover -s tests -v)
(cd apps/web && npm test && npm run typecheck && NEXT_TELEMETRY_DISABLED=1 npm run build)
```
