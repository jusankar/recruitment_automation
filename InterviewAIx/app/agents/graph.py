"""
Interview flow: ask question → (client answers) → evaluate → risk → next question.

The API does NOT invoke this graph in one go (that caused looping).
Routes call nodes step-by-step: /start → interviewer only; /answer → evaluator → risk → interviewer.
This module keeps the graph for reference or future single-run use (e.g. batch).
"""
from langgraph.graph import StateGraph
from app.agents.interviewer import interviewer_node
from app.agents.evaluator import evaluator_node
from app.agents.risk import risk_node


def build_graph():
    graph = StateGraph(dict)
    graph.add_node("interviewer", interviewer_node)
    graph.add_node("evaluator", evaluator_node)
    graph.add_node("risk", risk_node)

    graph.set_entry_point("interviewer")
    graph.add_edge("interviewer", "evaluator")
    graph.add_edge("evaluator", "risk")
    return graph.compile()
