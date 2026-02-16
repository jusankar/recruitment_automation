import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = os.getenv("APP_NAME")
ENVIRONMENT = os.getenv("ENVIRONMENT")
LOG_LEVEL = os.getenv("LOG_LEVEL")

# Chroma
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
LLM_MODEL = os.getenv("LLM_MODEL")
OPENAI_TIMEOUT = int(os.getenv("OPENAI_TIMEOUT", 60))

# Search tuning
TOP_K = int(os.getenv("TOP_K", 10))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", 0.7))

# Performance
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", 100))
MAX_RESUME_LENGTH = int(os.getenv("MAX_RESUME_LENGTH", 20000))
