from fastapi import FastAPI, BackgroundTasks, UploadFile, File
from .models import BulkResumeInput, JobQuery
from .ingestion import ingest_bulk_resumes
from .retriever import retrieve_candidates
from .scorer import score_candidates
from app.intake.file_storage import save_file
from app.parser.resume_parser import parse_resume, structure_resume

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

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...)):
    file_bytes = await file.read()

    file_path = save_file(file_bytes, file.filename)

    resume_text = parse_resume(file_path)
    structured_data = structure_resume(resume_text)

    return {
        "file_path": file_path,
        "structured_data": structured_data
    }

@app.get("/")
def root():
    return {"message": "Commercial Recruitment RAG Running"}

