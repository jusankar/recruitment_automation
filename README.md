Here is your **production-ready `README.md`** for your commercial Resume Intelligence RAG system.

You can copy this directly into `README.md`.

---

# Resume Intelligence API

Enterprise Resume Screening using **LLM + RAG + ChromaDB**

---

## 🚀 Overview

Resume Intelligence API is a production-ready Retrieval-Augmented Generation (RAG) microservice built using:

* **FastAPI** – API Layer
* **ChromaDB** – Vector Database (Persistent)
* **OpenAI Embeddings + LLM** – Semantic Matching & Ranking
* **HNSW Cosine Similarity** – Fast vector search
* **Batch Ingestion** – Supports 10,000+ resumes

This system enables:

* Bulk resume ingestion
* Semantic search against Job Descriptions
* AI-based candidate ranking
* Commercial-grade extensibility

---

# 🏗 Architecture

```
                +--------------------+
                |   FastAPI Layer    |
                +--------------------+
                     |        |
                     |        |
            +--------+        +---------+
            |                           |
   +------------------+        +------------------+
   |  Ingestion Flow  |        |  Search Flow     |
   +------------------+        +------------------+
            |                           |
     +--------------+           +--------------+
     |  OpenAI      |           |  OpenAI      |
     |  Embeddings  |           |  LLM Ranking |
     +--------------+           +--------------+
            |                           |
            +-------------+-------------+
                          |
                   +--------------+
                   |  ChromaDB    |
                   | (Persistent) |
                   +--------------+
```

---

# 📂 Project Structure

```
rag_service/
│
├── app/
│   ├── main.py
│   ├── config.py
│   ├── models.py
│   ├── embeddings.py
│   ├── ingestion.py
│   ├── retriever.py
│   └── vectorstore.py
│
├── .env
├── requirements.txt
└── README.md
```

---

# ⚙️ Setup Instructions

## 1️⃣ Create Virtual Environment

```bash
py -3.11 -m venv .venv
.venv\Scripts\activate
```

> ⚠ Use Python 3.11 (Recommended for Chroma stability)

---

## 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 3️⃣ Configure `.env`

Create `.env` file:

```env
# Application
APP_NAME=Resume Intelligence API
ENVIRONMENT=production
LOG_LEVEL=INFO

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_db
COLLECTION_NAME=resumes
CHROMA_TELEMETRY=false

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=60

# Search Tuning
TOP_K=15
SIMILARITY_THRESHOLD=0.70

# Performance
MAX_BATCH_SIZE=100
MAX_RESUME_LENGTH=20000
```

---

## 4️⃣ Run Server

```bash
uvicorn app.main:app --reload
```

API Docs:

```
http://127.0.0.1:8000/docs
```

---

# 📌 API Endpoints

---

## 1️⃣ Add Resumes (Bulk Ingestion)

**POST**

```
http://127.0.0.1:8000/add-resumes
```

### Request Body

```json
{
  "resumes": [
    {
      "resume_text": "10 years .NET Core developer with Azure experience...",
      "metadata": {
        "candidate_id": "C001",
        "name": "John Doe",
        "experience": 10
      }
    },
    {
      "resume_text": "React developer with Node.js and AWS...",
      "metadata": {
        "candidate_id": "C002",
        "name": "Jane Smith",
        "experience": 5
      }
    }
  ]
}
```

### Response

```json
{
  "status": "Ingestion started"
}
```

---

## 2️⃣ Search Candidates

**POST**

```
http://127.0.0.1:8000/search
```

### Request Body

```json
{
  "job_description": ".NET Core developer with Azure experience",
  "min_experience": 5
}
```

### Response

```json
{
  "retrieved_count": 10,
  "results": [
    {
      "candidate_id": "C001",
      "score": 0.92,
      "strengths": "Strong Azure DevOps and microservices experience",
      "gaps": "Limited front-end exposure"
    }
  ]
}
```

---

# 💾 Where Is the Database?

ChromaDB stores vectors in:

```
./chroma_db/
```

It is automatically created on first ingestion.

Persistent across restarts.

---

# 📊 Performance Capabilities

| Feature                  | Supported |
| ------------------------ | --------- |
| 10,000+ resumes          | ✅         |
| Batch ingestion          | ✅         |
| Cosine similarity search | ✅         |
| LLM ranking              | ✅         |
| Production persistence   | ✅         |

---

# 🔒 Production Considerations

For commercial deployment:

* Add authentication (JWT / API Key)
* Add rate limiting
* Use Redis for caching
* Move Chroma to external server if scaling
* Add structured logging
* Add monitoring (Prometheus / Grafana)
* Add async ingestion queue (Celery / Kafka)

---

# 🧠 Scaling Strategy

For 100K+ resumes:

* Separate ingestion worker service
* Use Chroma server mode
* Use GPU embedding service
* Add re-ranking layer
* Add PostgreSQL for metadata filtering

---

# 🛠 Recommended Production Stack

* FastAPI
* ChromaDB Server
* OpenAI Embeddings
* Redis Cache
* PostgreSQL (metadata)
* Docker
* NGINX
* Kubernetes (optional)

---

# 📈 Future Enhancements

* Resume parsing (PDF → structured JSON)
* Skill normalization
* Experience extraction AI
* Multi-tenant support
* Analytics dashboard
* Feedback loop learning
* Bias detection layer

---

# 👨‍💻 Author

Udayasankar J
25+ Years Experience
AI-driven Resume Intelligence Platform

---

