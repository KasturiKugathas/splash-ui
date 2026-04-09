# GitHub OAuth Scopes (Phase 2)

Splash-UI needs the minimum scopes required to read repositories and open pull requests on behalf of the signed-in user.

## Required Scopes

| Scope | Why Splash-UI needs it |
| --- | --- |
| `read:user` | Resolve the signed-in GitHub identity and associate it with a Splash-UI account. |
| `repo` | Read private repository metadata and contents, create branches, commit changes, and open pull requests. |

## Scope Notes

- Use `repo` only when private repositories must be supported.
- If Splash-UI is later limited to public repositories, replace `repo` with narrower public-read scopes.
- Avoid requesting admin, delete, webhook, or organization scopes until those workflows are implemented.

## Local Development

The preferred local flow now uses GitHub OAuth through a GitHub OAuth App. Configure these variables before starting the API:

```bash
export GITHUB_OAUTH_CLIENT_ID=your_github_oauth_app_client_id
export GITHUB_OAUTH_CLIENT_SECRET=your_github_oauth_app_client_secret
export SPLASH_UI_SESSION_SECRET=replace_with_a_long_random_string
export SPLASH_UI_API_BASE_URL=http://localhost:8000
export SPLASH_UI_WEB_BASE_URL=http://localhost:3000
uvicorn app.main:app --reload
```

Use `localhost` for both apps in local development so the auth session cookie can be shared across the web app and API.
