from app.models import JobQuery
from app import retriever


class FakeCollection:
    def query(self, query_embeddings, n_results, where):
        assert query_embeddings == [[0.01, 0.02]]
        assert n_results == 10  # top_k(2) * 5
        assert where == {"$and": [{"experience": {"$gte": 3}}, {"location": {"$eq": "Bengaluru"}}]}
        return {
            "documents": [[
                "chunk-A-1",
                "chunk-B-1",
                "chunk-A-2",
            ]],
            "metadatas": [[
                {"resume_id": "A", "candidate_name": "Asha"},
                {"resume_id": "B", "candidate_name": "Ben"},
                {"resume_id": "A", "candidate_name": "Asha"},
            ]],
            "distances": [[
                0.20,  # A
                0.10,  # B (best)
                0.30,  # A second chunk
            ]],
        }


def test_retrieve_candidates_groups_chunks_and_respects_top_k(monkeypatch):
    monkeypatch.setattr(retriever, "get_embedding", lambda _text: [0.01, 0.02])
    monkeypatch.setattr(retriever, "collection", FakeCollection())

    query = JobQuery(
        job_description="Backend engineer with APIs",
        min_experience=3,
        location="Bengaluru",
        top_k=2,
    )

    results = retriever.retrieve_candidates(query)

    assert len(results) == 2
    assert results[0]["resume_id"] == "B"
    assert results[1]["resume_id"] == "A"
    assert results[0]["score"] > results[1]["score"]
