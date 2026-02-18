from collections import defaultdict
from .vectorstore import collection
from .embeddings import get_embedding

def retrieve_candidates(job_query):
    """
    Retrieves and scores candidates based on:
    - job description (semantic similarity)
    - min_experience (numeric)
    - location (flexible match by parts)
    """

    # 1️⃣ Embed the job description
    query_embedding = get_embedding(job_query.job_description)

    # 2️⃣ Build filters
    filters = []

    # Experience filter
    if job_query.min_experience is not None:
        filters.append({"experience": {"$gte": job_query.min_experience}})

    # Location filter
    if job_query.location:
        # Split location by comma and strip spaces
        filters.append({"location": {"$eq": job_query.location}})

    # Construct the final 'where' clause
    if len(filters) == 0:
        where = None
    elif len(filters) == 1:
        where = filters[0]
    else:
        where = {"$and": filters}

    # 3️⃣ Query the vector store
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=job_query.top_k * 5,  # fetch extra chunks to allow grouping
        where=where
    )

    # 4️⃣ Group chunks by resume_id
    grouped = defaultdict(list)
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    for doc, meta, dist in zip(documents, metadatas, distances):
        resume_id = meta.get("resume_id")
        grouped[resume_id].append({
            "resume_excerpt": doc,
            "metadata": meta,
            "distance": dist
        })

    # 5️⃣ Score resumes by best chunk (lowest distance)
    scored_resumes = []
    for resume_id, chunks in grouped.items():
        best_chunk = min(chunks, key=lambda x: x["distance"])
        scored_resumes.append({
            "resume_id": resume_id,
            "score": 1 - best_chunk["distance"],  # convert distance → similarity
            "metadata": best_chunk["metadata"],
            "resume_excerpt": best_chunk["resume_excerpt"]
        })

    # 6️⃣ Sort by score descending
    scored_resumes.sort(key=lambda x: x["score"], reverse=True)

    return scored_resumes[:job_query.top_k]
