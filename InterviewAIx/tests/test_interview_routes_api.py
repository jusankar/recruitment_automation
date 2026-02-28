import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import interview_routes
from app.models.interview import MAX_QUESTIONS


class FakeQuery:
    def __init__(self, session):
        self.session = session
        self.lookup_id = None

    def filter(self, expression):
        # Handles expressions like Interview.id == interview_id
        right = getattr(expression, "right", None)
        self.lookup_id = getattr(right, "value", None)
        return self

    def first(self):
        return self.session.records.get(self.lookup_id)


class FakeSession:
    def __init__(self):
        self.records = {}

    def add(self, interview):
        if not interview.id:
            interview.id = str(uuid.uuid4())
        self.records[interview.id] = interview

    def commit(self):
        return None

    def refresh(self, _interview):
        return None

    def query(self, _model):
        return FakeQuery(self)

    def close(self):
        return None


def _build_client(monkeypatch):
    fake_db = FakeSession()

    def interviewer_stub(state: dict) -> dict:
        if state.get("transcript", "").strip():
            state["question"] = "Follow-up question?"
        else:
            state["question"] = "First question?"
        return state

    def evaluator_stub(state: dict) -> dict:
        state["evaluation"] = (
            "Good response.\n"
            "Technical Score: 78\n"
            "Communication Score: 80\n"
            "Confidence Score: 74"
        )
        return state

    def risk_stub(state: dict) -> dict:
        state["risk"] = "Low"
        return state

    monkeypatch.setattr(interview_routes, "SessionLocal", lambda: fake_db)
    monkeypatch.setattr(interview_routes, "interviewer_node", interviewer_stub)
    monkeypatch.setattr(interview_routes, "evaluator_node", evaluator_stub)
    monkeypatch.setattr(interview_routes, "risk_node", risk_stub)

    app = FastAPI()
    app.include_router(interview_routes.router)
    return TestClient(app), fake_db


def test_start_interview_returns_first_question(monkeypatch):
    client, fake_db = _build_client(monkeypatch)

    response = client.post(
        "/interview/start",
        json={
            "name": "Jordan",
            "score": 84,
            "strengths": ["Python"],
            "gaps": ["System design"],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["question"] == "First question?"
    assert payload["interview_id"] in fake_db.records

    saved = fake_db.records[payload["interview_id"]]
    assert saved.status == "ongoing"
    assert saved.question_count == 0
    assert saved.current_question == "First question?"


def test_answer_progression_locks_after_completion(monkeypatch):
    client, fake_db = _build_client(monkeypatch)

    start = client.post(
        "/interview/start",
        json={
            "name": "Casey",
            "score": 76,
            "strengths": ["APIs"],
            "gaps": ["Testing"],
        },
    )
    interview_id = start.json()["interview_id"]

    for turn in range(MAX_QUESTIONS):
        response = client.post(
            f"/interview/{interview_id}/answer",
            json={"answer": f"answer-{turn + 1}"},
        )
        assert response.status_code == 200
        data = response.json()

        if turn < MAX_QUESTIONS - 1:
            assert data["interview_complete"] is False
            assert data["next_question"] == "Follow-up question?"
        else:
            assert data["interview_complete"] is True
            assert data["next_question"] is None

    locked = client.post(
        f"/interview/{interview_id}/answer",
        json={"answer": "extra-answer"},
    )
    assert locked.status_code == 400
    assert locked.json()["detail"] == "Interview already completed"

    saved = fake_db.records[interview_id]
    assert saved.status == "completed"
    assert saved.question_count == MAX_QUESTIONS
    assert "answer-1" in saved.transcript
    assert "answer-2" in saved.transcript
    assert "answer-3" in saved.transcript
