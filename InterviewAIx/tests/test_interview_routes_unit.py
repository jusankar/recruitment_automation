from app.api.interview_routes import _state_from_interview
from app.models.interview import Interview


def test_state_from_interview_uses_safe_defaults():
    interview = Interview(
        candidate_name="Alex",
        jd_score=82.5,
        strengths=None,
        gaps=None,
        transcript=None,
        current_question=None,
    )

    state = _state_from_interview(interview)

    assert state["candidate_name"] == "Alex"
    assert state["jd_score"] == 82.5
    assert state["strengths"] == []
    assert state["gaps"] == []
    assert state["transcript"] == ""
    assert state["question"] == ""
    assert state["evaluation"] == ""
    assert state["risk"] == ""
