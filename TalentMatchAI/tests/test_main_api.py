import sys
import types

from fastapi.testclient import TestClient

if "pypdf" not in sys.modules:
    pypdf_stub = types.ModuleType("pypdf")
    pypdf_stub.PdfReader = object
    sys.modules["pypdf"] = pypdf_stub

if "docx" not in sys.modules:
    docx_stub = types.ModuleType("docx")
    docx_stub.Document = object
    sys.modules["docx"] = docx_stub

if "app.intake.gmail_fetcher" not in sys.modules:
    gmail_stub = types.ModuleType("app.intake.gmail_fetcher")
    gmail_stub.fetch_resume_emails = lambda: []
    sys.modules["app.intake.gmail_fetcher"] = gmail_stub

from app import main
from app.main import app


client = TestClient(app)


def test_search_returns_empty_payload_when_no_candidates(monkeypatch):
    monkeypatch.setattr(main, "retrieve_candidates", lambda _job_query: [])

    response = client.post(
        "/search",
        json={
            "job_description": "Python developer",
            "min_experience": 2,
            "top_k": 5,
        },
    )

    assert response.status_code == 200
    assert response.json() == {"retrieved_count": 0, "scored_results": []}


def test_search_returns_scored_results_when_candidates_found(monkeypatch):
    fake_candidates = [
        {"resume_id": "r1", "score": 0.91, "metadata": {"candidate_name": "Anya"}},
        {"resume_id": "r2", "score": 0.88, "metadata": {"candidate_name": "Ravi"}},
    ]
    fake_scored = {
        "retrieved_count": 2,
        "scored_results": [
            {"name": "Anya", "email": "anya@x.com", "score": 90, "strengths": [], "gaps": []},
            {"name": "Ravi", "email": "ravi@x.com", "score": 85, "strengths": [], "gaps": []},
        ],
    }

    monkeypatch.setattr(main, "retrieve_candidates", lambda _job_query: fake_candidates)
    monkeypatch.setattr(main, "score_candidates", lambda _jd, _cands: fake_scored)

    response = client.post(
        "/search",
        json={
            "job_description": "Platform engineer",
            "min_experience": 1,
            "top_k": 10,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["retrieved_count"] == 2
    assert body["scored_results"] == fake_scored
