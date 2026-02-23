import json
from openai import OpenAI
from .config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

def score_candidates(job_description: str, candidates) -> dict:
    prompt = f"""
    Evaluate the following candidates against the job description.
    Score should be based only on available candidate data.
    Return STRICT JSON with this schema:
    
    {{
        "retrieved_count": int,
        "scored_results": [
            {{
                "name": string,
                "email": string,
                "score": int,
                "strengths": list of strings,
                "gaps": list of strings
            }}
        ]
    }}

    Strengths and gaps writing rules:
    - "strengths" must be AI-generated sentence-style points (not raw skill names).
    - Each strength should be a complete, specific statement tied to JD relevance.
    - Do not output plain keyword items like "Python", ".NET", "AWS".
    - Keep strengths concise and professional.
    - "gaps" can remain concise observations.

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
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return {
            "retrieved_count": 0,
            "scored_results": []
        }

    # Attach email from candidate metadata if missing in model output
    email_by_name = {}
    for c in candidates:
        meta = c.get("metadata", {}) if isinstance(c, dict) else {}
        name = str(meta.get("candidate_name", "")).strip()
        email = str(meta.get("candidate_email", "")).strip()
        if name and email and name not in email_by_name:
            email_by_name[name] = email

    scored_list = parsed.get("scored_results", []) if isinstance(parsed, dict) else []
    if isinstance(scored_list, list):
        for item in scored_list:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()
            if not item.get("email") and name in email_by_name:
                item["email"] = email_by_name[name]

    return parsed
