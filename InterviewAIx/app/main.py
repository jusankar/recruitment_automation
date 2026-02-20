from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import interview_routes
from app.core.database import Base, engine

app = FastAPI(title="InterviewAIx Enterprise")

Base.metadata.create_all(bind=engine)

app.include_router(interview_routes.router)

# Allow HireMatrixUI (and other frontends) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def health():
    return {"status": "InterviewAIx running"}
