import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import interview_routes
from app.core.database import Base, engine

app = FastAPI(title="InterviewAIx Enterprise")

Base.metadata.create_all(bind=engine)

app.include_router(interview_routes.router)


def _get_allowed_origins() -> list[str]:
    default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    raw = os.getenv("INTERVIEW_CORS_ORIGINS", "")
    if not raw.strip():
        return default_origins

    origins = []
    for part in raw.split(","):
        origin = part.strip().rstrip("/")
        if origin and origin not in origins:
            origins.append(origin)

    if not origins or "*" in origins:
        return default_origins
    return origins


# Allow HireMatrixUI (and other frontends) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "InterviewAIx running"}
