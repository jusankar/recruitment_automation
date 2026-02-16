import uuid
from tqdm import tqdm
from .vectorstore import collection
from .utils import chunk_text
from .embeddings import get_embedding

BATCH_SIZE = 100

def ingest_bulk_resumes(resumes):

    documents = []
    metadatas = []
    embeddings = []
    ids = []

    for resume in tqdm(resumes):

        chunks = chunk_text(resume.resume_text)

        for chunk in chunks:
            emb = get_embedding(chunk)

            documents.append(chunk)
            metadatas.append(resume.metadata)
            embeddings.append(emb)
            ids.append(str(uuid.uuid4()))

            if len(documents) >= BATCH_SIZE:
                collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    embeddings=embeddings,
                    ids=ids
                )
                documents, metadatas, embeddings, ids = [], [], [], []

    if documents:
        collection.add(
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings,
            ids=ids
        )
