from fastapi import FastAPI
from app.api import interview_routes
from app.core.database import Base, engine

app = FastAPI(title="InterviewAIx Enterprise")

Base.metadata.create_all(bind=engine)

app.include_router(interview_routes.router)

@app.get("/")
def health():
    return {"status": "InterviewAIx running"}
