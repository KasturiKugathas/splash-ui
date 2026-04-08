from fastapi import APIRouter, Request

router = APIRouter(tags=["webhooks"])


@router.post("/webhooks/github")
async def github_webhook(request: Request) -> dict[str, object]:
    payload = await request.json()
    return {
        "received": True,
        "event": request.headers.get("x-github-event", "unknown"),
        "action": payload.get("action"),
    }
