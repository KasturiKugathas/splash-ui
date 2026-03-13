# Data Model (Phase 1)

## User
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | UUID | Yes | Primary key |
| email | string | Yes | Unique, normalized lowercase |
| email_verified | boolean | Yes | True after email link verification |
| display_name | string | No | Optional profile name |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

## Session
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | UUID | Yes | Primary key |
| user_id | UUID | Yes | FK to User |
| session_token_hash | string | Yes | Hash of session token |
| expires_at | datetime | Yes | Session expiration |
| ip_address | string | No | Request metadata |
| user_agent | string | No | Request metadata |
| created_at | datetime | Yes | Creation timestamp |
| revoked_at | datetime | No | Set when logout/revoked |

## OAuthConnection
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| id | UUID | Yes | Primary key |
| user_id | UUID | Yes | FK to User |
| provider | enum | Yes | `github` |
| provider_user_id | string | Yes | GitHub account id |
| provider_login | string | No | GitHub username/login |
| access_token_encrypted | string | Yes | Encrypted OAuth token |
| scope | string | No | Granted scopes |
| connected_at | datetime | Yes | First connected time |
| last_used_at | datetime | No | Last API usage |
