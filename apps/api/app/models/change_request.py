from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from app.services.config_types import ConfigNode

ChangeRequestState = Literal[
    "draft",
    "branch_created",
    "committed",
    "pr_opened",
    "approved",
    "changes_requested",
    "failed",
]


@dataclass
class WorkflowEvent:
    label: str
    detail: str
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


@dataclass
class ChangeRequest:
    repository: str
    path: str
    tree: ConfigNode
    id: str = field(default_factory=lambda: uuid4().hex[:12])
    state: ChangeRequestState = "draft"
    branch: str | None = None
    pull_request_url: str | None = None
    pull_request_number: str | None = None
    events: list[WorkflowEvent] = field(default_factory=list)
