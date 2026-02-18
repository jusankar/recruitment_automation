from pydantic import BaseModel
from typing import List, Dict, Optional

class ResumeInput(BaseModel):
    resume_text: str
    metadata: Dict

class BulkResumeInput(BaseModel):
    resumes: List[ResumeInput]

class JobQuery(BaseModel):
    job_description: str
    min_experience: Optional[int] = 0
    location: Optional[str] = None
    top_k: Optional[int] = 20

class ResumeFetchResponse(BaseModel):
    count: int
    resumes: List[str]