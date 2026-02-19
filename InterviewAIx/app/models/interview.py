from sqlalchemy import Column, String, Float, Text, DateTime, Integer
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON
from app.core.database import Base
import uuid

# Max questions per interview (configurable)
MAX_QUESTIONS = 3


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    candidate_name = Column(String, nullable=False)
    job_id = Column(String, nullable=True)

    jd_score = Column(Float)
    strengths = Column(JSON)
    gaps = Column(JSON)

    # Transcript grows: "Q: ... A: ..." for each turn
    transcript = Column(Text, default="")
    # Last question asked (so we know what the next answer refers to)
    current_question = Column(Text, nullable=True)
    question_count = Column(Integer, default=0)

    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    evaluation_summary = Column(Text, nullable=True)

    risk_level = Column(String, nullable=True)

    status = Column(String, default="ongoing")  # ongoing / completed

    created_at = Column(DateTime(timezone=True), server_default=func.now())
