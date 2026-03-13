from __future__ import annotations

from typing import TypedDict


class Repository(TypedDict):
    id: str
    name: str
    owner: str
    full_name: str
    default_branch: str
    visibility: str
    description: str


class TreeNode(TypedDict):
    id: str
    name: str
    path: str
    type: str
    children: list["TreeNode"]


class FileContent(TypedDict):
    repository: str
    path: str
    encoding: str
    language: str
    content: str


MOCK_REPOSITORIES: list[Repository] = [
    {
        "id": "repo-splash-ui",
        "name": "splash-ui",
        "owner": "KasturiKugathas",
        "full_name": "KasturiKugathas/splash-ui",
        "default_branch": "main",
        "visibility": "private",
        "description": "Governed configuration editing for GitHub repositories.",
    },
    {
        "id": "repo-platform-config",
        "name": "platform-config",
        "owner": "KasturiKugathas",
        "full_name": "KasturiKugathas/platform-config",
        "default_branch": "main",
        "visibility": "private",
        "description": "Application and infrastructure settings managed through pull requests.",
    },
    {
        "id": "repo-observability-config",
        "name": "observability-config",
        "owner": "KasturiKugathas",
        "full_name": "KasturiKugathas/observability-config",
        "default_branch": "main",
        "visibility": "public",
        "description": "Monitoring rules, alerting routes, and shared dashboard metadata.",
    },
]

MOCK_TREE_BY_REPOSITORY: dict[str, list[TreeNode]] = {
    "KasturiKugathas/splash-ui": [
        {
            "id": "apps",
            "name": "apps",
            "path": "apps",
            "type": "dir",
            "children": [
                {
                    "id": "apps-web",
                    "name": "web",
                    "path": "apps/web",
                    "type": "dir",
                    "children": [
                        {
                            "id": "apps-web-env",
                            "name": "app.config.json",
                            "path": "apps/web/app.config.json",
                            "type": "file",
                            "children": [],
                        }
                    ],
                }
            ],
        },
        {
            "id": "infra",
            "name": "infra",
            "path": "infra",
            "type": "dir",
            "children": [
                {
                    "id": "infra-monitoring",
                    "name": "monitoring.yaml",
                    "path": "infra/monitoring.yaml",
                    "type": "file",
                    "children": [],
                },
                {
                    "id": "infra-policies",
                    "name": "policies.xml",
                    "path": "infra/policies.xml",
                    "type": "file",
                    "children": [],
                },
            ],
        },
    ],
    "KasturiKugathas/platform-config": [
        {
            "id": "clusters",
            "name": "clusters",
            "path": "clusters",
            "type": "dir",
            "children": [
                {
                    "id": "clusters-prod",
                    "name": "prod",
                    "path": "clusters/prod",
                    "type": "dir",
                    "children": [
                        {
                            "id": "clusters-prod-values",
                            "name": "values.yaml",
                            "path": "clusters/prod/values.yaml",
                            "type": "file",
                            "children": [],
                        },
                        {
                            "id": "clusters-prod-feature-flags",
                            "name": "feature-flags.json",
                            "path": "clusters/prod/feature-flags.json",
                            "type": "file",
                            "children": [],
                        },
                    ],
                }
            ],
        }
    ],
    "KasturiKugathas/observability-config": [
        {
            "id": "grafana",
            "name": "grafana",
            "path": "grafana",
            "type": "dir",
            "children": [
                {
                    "id": "grafana-dashboards",
                    "name": "dashboards",
                    "path": "grafana/dashboards",
                    "type": "dir",
                    "children": [
                        {
                            "id": "grafana-main-dashboard",
                            "name": "home-dashboard.json",
                            "path": "grafana/dashboards/home-dashboard.json",
                            "type": "file",
                            "children": [],
                        }
                    ],
                }
            ],
        }
    ],
}

MOCK_FILE_CONTENT: dict[tuple[str, str], FileContent] = {
    (
        "KasturiKugathas/splash-ui",
        "apps/web/app.config.json",
    ): {
        "repository": "KasturiKugathas/splash-ui",
        "path": "apps/web/app.config.json",
        "encoding": "utf-8",
        "language": "json",
        "content": '{\n  "name": "Splash-UI",\n  "featureFlags": {\n    "repoBrowser": true,\n    "diffPreview": false\n  }\n}',
    },
    (
        "KasturiKugathas/splash-ui",
        "infra/monitoring.yaml",
    ): {
        "repository": "KasturiKugathas/splash-ui",
        "path": "infra/monitoring.yaml",
        "encoding": "utf-8",
        "language": "yaml",
        "content": "alerts:\n  enabled: true\n  destination: pagerduty\n",
    },
    (
        "KasturiKugathas/splash-ui",
        "infra/policies.xml",
    ): {
        "repository": "KasturiKugathas/splash-ui",
        "path": "infra/policies.xml",
        "encoding": "utf-8",
        "language": "xml",
        "content": "<policies>\n  <policy name=\"require-review\" enabled=\"true\" />\n</policies>\n",
    },
    (
        "KasturiKugathas/platform-config",
        "clusters/prod/values.yaml",
    ): {
        "repository": "KasturiKugathas/platform-config",
        "path": "clusters/prod/values.yaml",
        "encoding": "utf-8",
        "language": "yaml",
        "content": "replicaCount: 3\nimage:\n  tag: stable\n",
    },
    (
        "KasturiKugathas/platform-config",
        "clusters/prod/feature-flags.json",
    ): {
        "repository": "KasturiKugathas/platform-config",
        "path": "clusters/prod/feature-flags.json",
        "encoding": "utf-8",
        "language": "json",
        "content": '{\n  "newSidebar": true,\n  "approvalGate": "required"\n}',
    },
    (
        "KasturiKugathas/observability-config",
        "grafana/dashboards/home-dashboard.json",
    ): {
        "repository": "KasturiKugathas/observability-config",
        "path": "grafana/dashboards/home-dashboard.json",
        "encoding": "utf-8",
        "language": "json",
        "content": '{\n  "title": "Platform Home",\n  "refresh": "30s"\n}',
    },
}


def list_repos() -> list[Repository]:
    return MOCK_REPOSITORIES


def get_repo_tree(repo_full_name: str) -> list[TreeNode]:
    return MOCK_TREE_BY_REPOSITORY.get(repo_full_name, [])


def get_file_content(repo_full_name: str, path: str) -> FileContent:
    content = MOCK_FILE_CONTENT.get((repo_full_name, path))
    if content:
        return content

    return {
        "repository": repo_full_name,
        "path": path,
        "encoding": "utf-8",
        "language": "text",
        "content": "Mock file content unavailable for the requested path.",
    }
