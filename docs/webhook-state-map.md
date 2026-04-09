# GitHub Webhook State Map

| GitHub event | Action | Intended transition |
| --- | --- | --- |
| `pull_request` | `opened` | Confirm `pr_opened` and attach PR metadata. |
| `pull_request` | `closed` with `merged: true` | Mark change request as merged. |
| `pull_request` | `closed` with `merged: false` | Mark change request as closed without merge. |
| `pull_request_review` | `approved` | Mark approval received. |
| `pull_request_review` | `changes_requested` | Mark changes requested. |

The Phase 4 webhook endpoint accepts payloads and returns the event/action pair. Persistent state updates are reserved for the database-backed workflow phase.
