import uuid
import json
from typing import List, Dict
from tqdm import tqdm
from .vectorstore import collection
from .utils import chunk_text
from .embeddings import get_embedding

BATCH_SIZE = 100


def sanitize_metadata(metadata: Dict) -> Dict:
    """
    Convert unsupported metadata types (list, dict)
    into string format for Chroma compatibility.
    """
    cleaned = {}

    for key, value in metadata.items():
        if isinstance(value, (str, int, float, bool)):
            cleaned[key] = value
        elif isinstance(value, list):
            cleaned[key] = ", ".join(map(str, value))
        else:
            cleaned[key] = json.dumps(value)

    return cleaned


def ingest_bulk_resumes(resume_texts: List[str], metadatas: List[Dict]):

    documents = []
    metadata_batch = []
    embeddings = []
    ids = []

    for resume_text, metadata in tqdm(zip(resume_texts, metadatas)):

        resume_id = str(uuid.uuid4())  # ONE ID per resume
        chunks = chunk_text(resume_text)

        for chunk in chunks:
            emb = get_embedding(chunk)

            # Copy metadata and attach resume_id
            metadata_with_id = metadata.copy()
            metadata_with_id["resume_id"] = resume_id

            # 🔥 SANITIZE BEFORE STORING
            metadata_cleaned = sanitize_metadata(metadata_with_id)

            documents.append(chunk)
            metadata_batch.append(metadata_cleaned)
            embeddings.append(emb)
            ids.append(str(uuid.uuid4()))  # unique chunk id

            if len(documents) >= BATCH_SIZE:
                collection.add(
                    documents=documents,
                    metadatas=metadata_batch,
                    embeddings=embeddings,
                    ids=ids
                )
                documents, metadata_batch, embeddings, ids = [], [], [], []

    # Add remaining batch
    if documents:
        collection.add(
            documents=documents,
            metadatas=metadata_batch,
            embeddings=embeddings,
            ids=ids
        )
