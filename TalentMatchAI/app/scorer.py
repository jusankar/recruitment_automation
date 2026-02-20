import json
from openai import OpenAI
from .config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

def score_candidates(candidates, job_description: str) -> dict:
    prompt = f"""
    Evaluate the following candidates against the job description.
    score you can obtain directly from the candidates
    Return STRICT JSON with this schema:
    
    {{
        "retrieved_count": int,
        "scored_results": [
            {{
                "name": string,
                "score": int,
                "strengths": list of strings,
                "gaps": list of strings
            }}
        ]
    }}

    Job Description:
    {job_description}

    Candidates:
    {json.dumps(candidates, indent=2)}

    Return JSON ONLY. No markdown. No explanation.
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "retrieved_count": 0,
            "scored_results": []
        }