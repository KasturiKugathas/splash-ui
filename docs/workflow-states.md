# Change Request Workflow States

| State | Meaning |
| --- | --- |
| `draft` | Edited config tree has been captured by the API but no GitHub write has happened. |
| `branch_created` | A branch was created from the repository default branch. |
| `committed` | The serialized JSON/YAML file was committed to the change branch. |
| `pr_opened` | A pull request was opened against the repository default branch. |
| `approved` | Approval transition was recorded by the API. |
| `changes_requested` | Request-changes transition was recorded by the API. |
| `failed` | A GitHub or serialization step failed and the event is recorded in the timeline. |

XML files are currently read-only for writeback because the parser does not preserve enough original XML structure for safe serialization.
