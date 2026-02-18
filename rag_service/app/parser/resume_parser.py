import json
import re
from pypdf import PdfReader
from docx import Document
from openai import OpenAI
from ..config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

# ---------- PDF / DOCX Extraction ----------

def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def extract_text_from_docx(file_path: str) -> str:
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])


def parse_resume(file_path: str) -> str:
    extension = file_path.split(".")[-1].lower()
    if extension == "pdf":
        return extract_text_from_pdf(file_path)
    elif extension == "docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError("Unsupported file type")

# ---------- AI Structured Parser ----------

def structure_resume(resume_text: str) -> dict:
    """
    Uses AI to extract structured resume data.
    Returns a dict with:
    name, email, phone, skills (list), experience (numeric years), education, location
    """

    prompt = f"""
    Extract structured data in STRICT JSON format with this schema:

    {{
        "name": string,
        "email": string,
        "phone": string,
        "skills": list of strings,
        "experience": int,       # total years of experience
        "education": string,
        "location": string       # city
    }}

    Instructions:
    - Calculate total professional experience in years and return as an integer.
    - Extract location as a single clean string (city).
    - Return JSON ONLY. Do not include any extra text.

    Resume:
    {resume_text}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0
    )

    content = response.choices[0].message.content
    
    try:
        structured_data = json.loads(content)
    except json.JSONDecodeError:
        structured_data = {}

    # Flatten skills to string (for Chroma metadata)
    structured_data["skills"] = structured_data.get("skills", [])

    return structured_data
