"""LangGraph pipeline orchestration.

Defines the state machine that wires agents together:
ingestion → extraction → enrichment → validation → explainability,
with branching to needs_review when confidence is below threshold.
"""
