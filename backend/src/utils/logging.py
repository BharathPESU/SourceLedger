"""Structured logging for agent pipeline steps.

Every agent step logs its input, output, and duration — required
both for debugging and for demonstrating the active-learning
"improves with use" narrative if built.
"""

import logging
import time
from contextlib import contextmanager
from typing import Any, Generator


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger for the given module name."""
    logger = logging.getLogger(f"sourceledger.{name}")
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s | %(name)s | %(levelname)s | %(message)s",
            datefmt="%H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


@contextmanager
def log_agent_step(
    logger: logging.Logger,
    agent_name: str,
    step_description: str,
) -> Generator[dict[str, Any], None, None]:
    """Context manager that logs the start, duration, and outcome of an agent step.

    Usage:
        with log_agent_step(logger, "ExtractionAgent", "extracting fields") as ctx:
            result = do_extraction(...)
            ctx["output_summary"] = f"{len(result.fields)} fields extracted"

    The context dict can be populated with output metadata during the step.
    Duration is logged automatically on exit.
    """
    ctx: dict[str, Any] = {"agent": agent_name, "step": step_description}
    logger.info("▶ %s: %s", agent_name, step_description)
    start = time.monotonic()
    try:
        yield ctx
        elapsed = time.monotonic() - start
        output_summary = ctx.get("output_summary", "done")
        logger.info(
            "✓ %s: %s — %s (%.2fs)",
            agent_name,
            step_description,
            output_summary,
            elapsed,
        )
    except Exception:
        elapsed = time.monotonic() - start
        logger.exception(
            "✗ %s: %s — failed after %.2fs",
            agent_name,
            step_description,
            elapsed,
        )
        raise
