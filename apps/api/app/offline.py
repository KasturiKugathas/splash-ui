"""Start the credential-free development API on loopback."""

import uvicorn
from fastapi import FastAPI
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.main import create_app
from app.services.github_client import github_fixture
from app.services.offline_github import fixture_response


def create_offline_app() -> FastAPI:
    app = create_app(offline=True)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])

    @app.middleware("http")
    async def use_fixtures(request, call_next):
        token = github_fixture.set(fixture_response)
        try:
            return await call_next(request)
        finally:
            github_fixture.reset(token)

    return app


def main() -> None:
    uvicorn.run(create_offline_app(), host="127.0.0.1", port=8000, proxy_headers=False)


if __name__ == "__main__":
    main()
