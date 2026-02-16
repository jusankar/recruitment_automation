from pypdf import PdfReader
from docx import Document
from openai import OpenAI
from ..config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)


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


def structure_resume(resume_text: str) -> str:
    """
    Use AI to extract structured resume data.
    """

    prompt = f"""
    Extract structured data in JSON format:
    - name
    - email
    - phone
    - skills (list)
    - experience (summary)
    - education

    Resume:
    {resume_text}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content
