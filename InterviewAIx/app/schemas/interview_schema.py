from pydantic import BaseModel
from typing import List, Optional

class TalentMatchInput(BaseModel):
    name: str
    score: float
    strengths: List[str]
    gaps: List[str]


class StartInterviewResponse(BaseModel):
    interview_id: str
    question: str
    message: str = "Answer this question, then POST your answer to /interview/{interview_id}/answer"


class SubmitAnswerInput(BaseModel):
    answer: str


class SubmitAnswerResponse(BaseModel):
    evaluation: str
    risk: str
    next_question: Optional[str] = None
    interview_complete: bool = False
