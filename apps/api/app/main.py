from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.config import router as config_router
from app.routes.repos import router as repos_router

app = FastAPI(title="Splash-UI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(config_router)
app.include_router(repos_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
