import os

# Keep imports deterministic in tests without requiring local .env values.
os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
