from openai import OpenAI
from .config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

def score_candidates(job_description, candidates):

    prompt = f"""
You are an expert technical recruiter.

Job Description:
{job_description}

Candidates:
{candidates}

For each candidate:
- Give score (0-100)
- Strengths
- Gaps

Return JSON list.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    return response.choices[0].message.content
