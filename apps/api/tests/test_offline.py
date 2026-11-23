import json
import os
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch
from urllib.parse import urlsplit

from app.main import app as production_app
from app.offline import create_offline_app, main
from app.services.github_client import GitHubClientError
from app.services.offline_github import fixture_response


async def request(app, url, method="GET", payload=None, host="localhost"):
    target = urlsplit(url)
    body = json.dumps(payload).encode() if payload is not None else b""
    messages = []
    scope = {
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.4"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": target.path,
        "query_string": target.query.encode(),
        "headers": [(b"host", host.encode()), (b"content-type", b"application/json")],
    }

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message):
        messages.append(message)

    await app(scope, receive, send)
    content = b"".join(message.get("body", b"") for message in messages[1:])
    return messages[0]["status"], content


class OfflineTests(IsolatedAsyncioTestCase):
    def setUp(self):
        self.offline = create_offline_app()
        self.enterContext(patch.dict(os.environ, {"GITHUB_TOKEN": "", "GITHUB_API_BASE_URL": "https://fixture.invalid"}))
        self.urlopen = self.enterContext(
            patch("app.services.github_client.request.urlopen", side_effect=AssertionError("Unexpected network call"))
        )

    async def test_starts_without_credentials_and_requires_local_host(self):
        self.assertEqual(await request(self.offline, "/health"), (200, b'{"status":"ok","mode":"offline"}'))
        self.assertEqual((await request(self.offline, "/health", host="remote.example"))[0], 400)
        with patch("app.offline.uvicorn.run") as run:
            main()
        self.assertEqual(run.call_args.kwargs, {"host": "127.0.0.1", "port": 8000, "proxy_headers": False})
        self.urlopen.assert_not_called()

    async def test_browse_edit_and_save_json_and_yaml(self):
        status, body = await request(self.offline, "/repos")
        self.assertEqual(status, 200)
        repo = json.loads(body)[0]["full_name"]
        self.assertEqual(repo, "splash-demo/inventory-service")

        status, body = await request(self.offline, f"/tree?repo={repo}")
        self.assertEqual(status, 200)
        paths = [entry["path"] for entry in json.loads(body)[0]["children"]]
        self.assertEqual(paths, ["config/service.json", "config/worker.yaml"])

        for path in paths:
            with self.subTest(path=path):
                query = f"?repo={repo}&path={path}"
                status, source = await request(self.offline, f"/file{query}")
                self.assertEqual(status, 200)
                self.assertTrue(json.loads(source)["content"])
                status, body = await request(self.offline, f"/config-tree{query}")
                self.assertEqual(status, 200)
                config = json.loads(body)
                self.assertTrue(config["offline"])
                tree = config["tree"]
                field = tree["children"][0]
                if path.endswith(".yaml"):
                    field = field["children"][0]
                self.assertEqual(field["kind"], "string")
                field["value"] = "inventory-edited"
                status, body = await request(self.offline, "/change-requests", "POST", {
                    "repository": repo, "path": path, "tree": tree,
                })
                self.assertEqual(status, 200)
                draft = json.loads(body)
                self.assertEqual(draft["state"], "draft")
                self.assertEqual(draft["tree"], tree)
                status, body = await request(self.offline, f"/change-requests/{draft['id']}/open-pr", "POST")
                self.assertEqual(status, 403)
                self.assertIn(b"unavailable in offline", body)
        self.urlopen.assert_not_called()

    async def test_unknown_resources_and_writes_never_fall_through(self):
        with patch.dict(os.environ, {"GITHUB_TOKEN": "unused-test-token"}):
            for path in (
                "/tree?repo=other/repo",
                "/file?repo=splash-demo/inventory-service&path=missing.json",
                "/file?repo=splash-demo/inventory-service&path=../config/service.json",
            ):
                self.assertEqual((await request(self.offline, path))[0], 404)
        with self.assertRaises(GitHubClientError) as blocked:
            fixture_response("/repos/splash-demo/inventory-service/git/refs", "POST")
        self.assertEqual(blocked.exception.status_code, 403)
        self.urlopen.assert_not_called()

    async def test_normal_entry_point_keeps_credentials_and_live_transport(self):
        with patch.dict(os.environ, {"SPLASH_UI_OFFLINE": "1"}):
            self.assertEqual(await request(production_app, "/health"), (200, b'{"status":"ok"}'))
            status, body = await request(production_app, "/repos")
        self.assertEqual(status, 500)
        self.assertIn(b"Set GITHUB_TOKEN", body)
        self.urlopen.assert_not_called()
        with patch.dict(os.environ, {"GITHUB_TOKEN": "test-token"}):
            self.urlopen.side_effect = None
            self.urlopen.return_value.__enter__.return_value.read.return_value = b"[]"
            self.assertEqual(await request(production_app, "/repos"), (200, b"[]"))
            outbound = self.urlopen.call_args.args[0]
            self.assertEqual(outbound.get_header("Authorization"), "Bearer test-token")
            self.assertEqual(urlsplit(outbound.full_url).hostname, "fixture.invalid")
