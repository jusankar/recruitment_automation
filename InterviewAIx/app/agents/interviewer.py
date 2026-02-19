from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def interviewer_node(state: dict) -> dict:
    """Generate the next interview question. Uses transcript so far for follow-ups."""
    transcript = state.get("transcript") or ""
    is_first = not transcript.strip()

    if is_first:
        prompt = f"""You are an interviewer. Candidate: {state['candidate_name']}.
JD fit score: {state['jd_score']}. Strengths: {state.get('strengths', [])}. Gaps: {state.get('gaps', [])}.

Ask exactly ONE clear technical or behavioral question, focusing on their gaps. Output only the question, no preamble."""
    else:
        prompt = f"""You are an interviewer. Candidate: {state['candidate_name']}.
So far:
{transcript}

Ask exactly ONE follow-up technical or behavioral question. Do not repeat previous questions. Output only the question, no preamble."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    state["question"] = (response.choices[0].message.content or "").strip()
    return state
