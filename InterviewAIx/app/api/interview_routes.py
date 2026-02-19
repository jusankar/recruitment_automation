from fastapi import APIRouter, HTTPException
from app.agents.interviewer import interviewer_node
from app.agents.evaluator import evaluator_node
from app.agents.risk import risk_node
from app.schemas.interview_schema import (
    TalentMatchInput,
    StartInterviewResponse,
    SubmitAnswerInput,
    SubmitAnswerResponse,
)
from app.models.interview import Interview, MAX_QUESTIONS
from app.core.database import SessionLocal

router = APIRouter(prefix="/interview", tags=["Interview"])


def _state_from_interview(interview: Interview) -> dict:
    return {
        "candidate_name": interview.candidate_name,
        "jd_score": interview.jd_score,
        "strengths": interview.strengths or [],
        "gaps": interview.gaps or [],
        "transcript": interview.transcript or "",
        "question": interview.current_question or "",
        "evaluation": "",
        "risk": "",
    }


@router.post("/start", response_model=StartInterviewResponse)
def start_interview(payload: TalentMatchInput):
    """Start a new interview. Returns the first question only. No evaluation yet."""
    db = SessionLocal()
    try:
        interview = Interview(
            candidate_name=payload.name,
            jd_score=float(payload.score),
            strengths=payload.strengths,
            gaps=payload.gaps,
            transcript="",
            question_count=0,
            status="ongoing",
        )
        db.add(interview)
        db.commit()
        db.refresh(interview)

        state = _state_from_interview(interview)
        state = interviewer_node(state)

        interview.current_question = state["question"]
        db.commit()

        return StartInterviewResponse(
            interview_id=interview.id,
            question=state["question"],
        )
    finally:
        db.close()


@router.post("/{interview_id}/answer", response_model=SubmitAnswerResponse)
def submit_answer(interview_id: str, payload: SubmitAnswerInput):
    """Submit the candidate's answer. Evaluates it, computes risk, returns next question or completes."""
    db = SessionLocal()
    try:
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview.status == "completed":
            raise HTTPException(status_code=400, detail="Interview already completed")

        # Append this Q&A to transcript
        q = interview.current_question or "Question"
        new_block = f"Q: {q}\nA: {payload.answer.strip()}\n\n"
        interview.transcript = (interview.transcript or "") + new_block
        interview.question_count = (interview.question_count or 0) + 1

        # Evaluate and risk (no looping – run once)
        state = _state_from_interview(interview)
        state["transcript"] = interview.transcript
        state = evaluator_node(state)
        state = risk_node(state)

        interview.evaluation_summary = state.get("evaluation")
        interview.risk_level = state.get("risk")

        next_question = None
        interview_complete = interview.question_count >= MAX_QUESTIONS
        if interview_complete:
            interview.status = "completed"
        else:
            # Generate next question
            state = interviewer_node(state)
            next_question = state.get("question")
            interview.current_question = next_question

        db.commit()

        return SubmitAnswerResponse(
            evaluation=state.get("evaluation", ""),
            risk=state.get("risk", ""),
            next_question=next_question,
            interview_complete=interview_complete,
        )
    finally:
        db.close()
