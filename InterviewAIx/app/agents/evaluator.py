from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def evaluator_node(state: dict) -> dict:
    """Evaluate the candidate's latest answer (and optionally full transcript)."""
    transcript = state.get("transcript", "")
    if not transcript.strip():
        state["evaluation"] = "No answer provided yet."
        return state

    prompt = f"""Evaluate this candidate's interview exchange:

{transcript}

Provide a short evaluation (2–4 sentences) and then exactly these three lines:
Technical Score: <0-100>
Communication Score: <0-100>
Confidence Score: <0-100>"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    state["evaluation"] = (response.choices[0].message.content or "").strip()
    return state
