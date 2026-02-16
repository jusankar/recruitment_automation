from fastapi import FastAPI, BackgroundTasks
from .models import BulkResumeInput, JobQuery
from .ingestion import ingest_bulk_resumes
from .retriever import retrieve_candidates
from .scorer import score_candidates

app = FastAPI(
    title="Commercial Recruitment RAG Service",
    version="1.0"
)

@app.post("/add-resumes")
def add_resumes(request: BulkResumeInput, background_tasks: BackgroundTasks):
    background_tasks.add_task(ingest_bulk_resumes, request.resumes)
    return {"status": "Bulk resume ingestion started"}

@app.post("/search")
def search(job_query: JobQuery):

    candidates = retrieve_candidates(job_query)

    scored = score_candidates(
        job_query.job_description,
        candidates
    )

    return {
        "retrieved_count": len(candidates),
        "scored_results": scored
    }

@app.get("/")
def root():
    return {"message": "Commercial Recruitment RAG Running"}
