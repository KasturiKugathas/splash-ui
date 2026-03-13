# GitHub OAuth Scopes (Phase 2)

Splash-UI only needs the minimum scopes required to read repositories and open pull requests on behalf of the signed-in user.

## Required Scopes

| Scope | Why Splash-UI needs it |
| --- | --- |
| `read:user` | Resolve the signed-in GitHub identity and associate it with a Splash-UI account. |
| `repo` | Read private repository metadata and contents, create branches, commit changes, and open pull requests. |

## Scope Notes

- Use `repo` only when private repositories must be supported.
- If Splash-UI is later limited to public repositories, replace `repo` with narrower public-read scopes.
- Avoid requesting admin, delete, webhook, or organization scopes until those workflows are implemented.
