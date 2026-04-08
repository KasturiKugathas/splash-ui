from __future__ import annotations

from app.routes.change_requests import open_pull_request


def open_pr_from_change_request(change_request_id: str) -> dict[str, object]:
    return open_pull_request(change_request_id)
