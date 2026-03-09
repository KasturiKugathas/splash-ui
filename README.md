# Splash-UI

Splash-UI is a developer and business governance tool for safely managing configuration changes in GitHub repositories through a structured web UI.

It allows teams to edit configuration files (`JSON`, `YAML`, `XML`) without manual file editing, while enforcing approval workflows before changes are merged.

## Why Splash-UI

Manual config edits are risky, difficult to audit, and hard to scale across teams. Splash-UI helps engineering and business stakeholders collaborate with clear controls, visibility, and traceability.

### Business Value

- Reduces production risk from manual configuration changes
- Improves compliance with approval and audit trails
- Speeds up change turnaround with standardized workflows
- Enables non-developer stakeholders to participate safely in governed updates

## Core Features

1. **Authentication**
   - Email sign-in
   - GitHub OAuth sign-in

2. **Repository Reader**
   - Connect GitHub account
   - Browse accessible repositories and folders
   - Open JSON, YAML, and XML files

3. **Configuration Editor**
   - Structured UI for editing config values
   - Change detection and validation
   - Diff preview before saving

4. **Approval Flow + Pull Request**
   - Create branch for each change
   - Commit updates automatically
   - Open GitHub Pull Request
   - Enforce approval before merge

## Tech Stack

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Integrations:** GitHub API, OAuth
- **Parsing:** JSON, YAML, XML libraries
- **Infrastructure:** Docker for local development, cloud-ready for AWS/Azure

## Product Goal

Provide a secure, auditable, and scalable configuration management workflow that supports both engineering execution and business governance.
