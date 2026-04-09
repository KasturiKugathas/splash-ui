from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.change_request import ChangeRequest, WorkflowEvent
from app.services.auth import AuthSession, require_auth_session
from app.services.config_parser import serialize_config_tree
from app.services.config_types import ConfigNode
from app.services.github_client import (
    GitHubClientError,
    commit_file,
    create_branch,
    create_pull_request,
    get_default_branch,
    get_file_content,
)

router = APIRouter(tags=["change-requests"])
CHANGE_REQUESTS: dict[str, ChangeRequest] = {}


class ChangeRequestPayload(BaseModel):
    repository: str
    path: str
    tree: ConfigNode


def _to_response(change_request: ChangeRequest) -> dict[str, object]:
    return asdict(change_request)


@router.post("/change-requests")
def create_change_request(
    payload: ChangeRequestPayload,
    _session: AuthSession = Depends(require_auth_session),
) -> dict[str, object]:
    change_request = ChangeRequest(
        repository=payload.repository,
        path=payload.path,
        tree=payload.tree,
        events=[
            WorkflowEvent(
                label="Draft created",
                detail="Local editor state was captured by the API.",
            )
        ],
    )
    CHANGE_REQUESTS[change_request.id] = change_request
    return _to_response(change_request)


@router.post("/change-requests/{change_request_id}/open-pr")
def open_pull_request(
    change_request_id: str,
    session: AuthSession = Depends(require_auth_session),
) -> dict[str, object]:
    change_request = CHANGE_REQUESTS.get(change_request_id)
    if change_request is None:
        raise HTTPException(status_code=404, detail="Change request not found.")

    try:
        original_file = get_file_content(
            change_request.repository,
            change_request.path,
            token=session.access_token,
        )
        serialized_content = serialize_config_tree(
            change_request.path,
            change_request.tree,
            original_content=original_file["content"],
        )
        base_branch = get_default_branch(change_request.repository, token=session.access_token)
        branch_name = f"splash-ui/{change_request.id}"

        create_branch(change_request.repository, branch_name, base_branch, token=session.access_token)
        change_request.state = "branch_created"
        change_request.branch = branch_name
        change_request.events.append(
            WorkflowEvent(label="Branch created", detail=f"Created `{branch_name}` from `{base_branch}`.")
        )

        commit_result = commit_file(
            repo_full_name=change_request.repository,
            path=change_request.path,
            branch_name=branch_name,
            content=serialized_content,
            message=f"Splash-UI update {change_request.path}",
            token=session.access_token,
        )
        change_request.state = "committed"
        change_request.events.append(
            WorkflowEvent(
                label="File committed",
                detail=f"Committed `{change_request.path}` at `{commit_result['commit_sha']}`.",
            )
        )

        pr = create_pull_request(
            repo_full_name=change_request.repository,
            branch_name=branch_name,
            base_branch=base_branch,
            title=f"Update {change_request.path}",
            body=f"Created by Splash-UI for change request `{change_request.id}`.",
            token=session.access_token,
        )
        change_request.state = "pr_opened"
        change_request.pull_request_url = pr["url"]
        change_request.pull_request_number = pr["number"]
        change_request.events.append(
            WorkflowEvent(label="Pull request opened", detail=f"PR #{pr['number']}: {pr['url']}")
        )
        return _to_response(change_request)
    except GitHubClientError as exc:
        change_request.state = "failed"
        change_request.events.append(WorkflowEvent(label="Workflow failed", detail=str(exc)))
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/change-requests/{change_request_id}/approve")
def approve_change_request(
    change_request_id: str,
    _session: AuthSession = Depends(require_auth_session),
) -> dict[str, object]:
    change_request = CHANGE_REQUESTS.get(change_request_id)
    if change_request is None:
        raise HTTPException(status_code=404, detail="Change request not found.")

    change_request.state = "approved"
    change_request.events.append(
        WorkflowEvent(label="Approved", detail="Approval transition recorded in local workflow state.")
    )
    return _to_response(change_request)


@router.post("/change-requests/{change_request_id}/request-changes")
def request_change_request_changes(
    change_request_id: str,
    _session: AuthSession = Depends(require_auth_session),
) -> dict[str, object]:
    change_request = CHANGE_REQUESTS.get(change_request_id)
    if change_request is None:
        raise HTTPException(status_code=404, detail="Change request not found.")

    change_request.state = "changes_requested"
    change_request.events.append(
        WorkflowEvent(label="Changes requested", detail="Request-changes transition recorded in local workflow state.")
    )
    return _to_response(change_request)
