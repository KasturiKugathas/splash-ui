# ADR-0001: Monorepo with Next.js Frontend and FastAPI Backend

- Status: Accepted
- Date: 2026-03-09
- Deciders: Splash-UI project owner
- Technical Story: SPL-P0-015

## Context
Splash-UI needs a local-first architecture that supports a React-based web UI, Python backend APIs, and future worker/infrastructure components. The project should stay simple for a single developer while remaining scalable for cloud deployment.

## Decision
Adopt a monorepo structure with a Next.js (TypeScript) frontend in `apps/web`, a FastAPI backend in `apps/api`, and a dedicated async worker in `apps/worker`. Shared contracts and parser specifications live in `packages`, while environment setup and deployment assets live in `infrastructure`.

## Options Considered
1. Separate repositories for frontend and backend
2. Monorepo with Next.js + FastAPI + worker
3. Full-stack framework with embedded backend only

## Consequences
- Positive:
  - Easier local development and coordinated changes
  - Unified issue tracking, CI, and release workflow
  - Clear separation of runtime services while keeping one codebase
- Negative:
  - CI can become slower as the repo grows
  - Requires discipline to keep boundaries between apps/packages
- Neutral:
  - Future migration to polyrepo remains possible if team size changes

## Implementation Notes
- Add CI skeleton workflow (`.github/workflows/ci.yml`).
- Add `.env.example` and Docker Compose for local setup.
- Introduce per-app lint/test jobs in subsequent tickets.

## References
- Ticket: SPL-P0-013
- Ticket: SPL-P0-014
- Ticket: SPL-P0-015
