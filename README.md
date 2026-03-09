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
