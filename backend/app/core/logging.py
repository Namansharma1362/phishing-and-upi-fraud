"""
SentinelAI — Structured Logging Configuration

Uses structlog for structured, context-aware logging.
- Development: pretty colored console output
- Production:  JSON output (ingested by CloudWatch, Datadog, etc.)

Usage:
    from app.core.logging import get_logger
    logger = get_logger(__name__)
    logger.info("event_name", key="value", user_id=123)
"""

import logging
import sys
import structlog
from app.core.config import get_settings

settings = get_settings()


def configure_logging() -> None:
    """
    Configure structlog and stdlib logging.
    Must be called once at application startup (in lifespan).
    """
    shared_processors: list = [
        # Inject context vars (request_id, user_id set per-request via middleware)
        structlog.contextvars.merge_contextvars,
        # Add log level and logger name to every log record
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        # ISO 8601 timestamps
        structlog.processors.TimeStamper(fmt="iso"),
        # Render exception tracebacks as strings
        structlog.processors.StackInfoRenderer(),
        structlog.processors.ExceptionRenderer(),
    ]

    if settings.ENVIRONMENT == "development":
        # Human-readable, colored console output for local dev
        renderer = structlog.dev.ConsoleRenderer(colors=True)
    else:
        # Machine-readable JSON for production log aggregation
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Route stdlib logging (e.g., uvicorn, sqlalchemy) through structlog
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Suppress noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    Get a named, pre-configured structlog logger.

    Args:
        name: Typically __name__ of the calling module.

    Returns:
        A bound structlog logger instance.
    """
    return structlog.get_logger(name)
