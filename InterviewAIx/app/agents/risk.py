from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def risk_node(state: dict) -> dict:
    """Classify hiring risk from the evaluation."""
    evaluation = state.get("evaluation") or "No evaluation."
    prompt = f"""Based on this evaluation:

{evaluation}

Reply with exactly one word: Low, Medium, or High (hiring risk)."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    state["risk"] = (response.choices[0].message.content or "Medium").strip()
    return state
