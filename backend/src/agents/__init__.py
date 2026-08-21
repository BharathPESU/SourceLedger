"""Pipeline agents — one module per agent, matching architecture.md names.

Each agent is a pure function over (input, context) → output wherever
possible, so it can be unit-tested without hitting a live LLM.
"""
