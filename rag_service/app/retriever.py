from .vectorstore import collection
from .embeddings import get_embedding

def retrieve_candidates(job_query):

    query_embedding = get_embedding(job_query.job_description)

    filters = {}
    if job_query.location:
        filters["location"] = job_query.location

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=job_query.top_k,
        where=filters if filters else None
    )

    candidates = []

    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        candidates.append({
            "resume_excerpt": doc,
            "metadata": meta
        })

    return candidates
