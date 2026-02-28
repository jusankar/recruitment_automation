import os
import sys
from pathlib import Path

os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("EMBEDDING_MODEL", "text-embedding-3-small")
os.environ.setdefault("LLM_MODEL", "gpt-4o-mini")
os.environ.setdefault("CHROMA_PERSIST_DIR", "./.test_chroma")
os.environ.setdefault("COLLECTION_NAME", "test_resumes")
os.environ.setdefault("UPLOAD_DIR", "./uploads")

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
