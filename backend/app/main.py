"""
SentinelAI — FastAPI Application Factory

Follows the application factory pattern:
  - create_application() builds and returns the configured FastAPI instance
  - The module-level `app` variable is the ASGI entry point for uvicorn

Design decisions:
  - Lifespan context manager (not deprecated @app.on_event) for startup/shutdown
  - Docs disabled in production (security — no API exploration for attackers)
  - Global exception handler returns safe, generic error messages (no stack traces)
  - CORS middleware locked to explicit origins from config
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.db.session import engine
from app.api.v1 import health as health_router

settings = get_settings()

# Configure logging before anything else so all startup logs are captured
configure_logging()
logger = get_logger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle events.

    Startup:  log service info (DB pool is created lazily on first use)
    Shutdown: gracefully dispose the connection pool so Postgres
              doesn't hold zombie connections.
    """
    logger.info(
        "sentinelai_starting",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        debug=settings.DEBUG,
    )
    yield
    # Graceful shutdown — closes all open DB connections in the pool
    await engine.dispose()
    logger.info("sentinelai_shutdown_complete")


# ── Application Factory ────────────────────────────────────────────────────

def create_application() -> FastAPI:
    """
    Build and return a fully configured FastAPI instance.

    Separating construction from the module-level `app` assignment
    makes this testable — tests can call create_application() directly.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "SentinelAI — AI-powered Phishing URL and UPI Fraud Detection Platform. "
            "Built with FastAPI, PostgreSQL, Redis, and scikit-learn."
        ),
        # Disable interactive docs in production to reduce attack surface
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── Middleware (order matters — registered in reverse execution order) ──

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )

    # ── Global Exception Handlers ───────────────────────────────────────────

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """
        Catch-all handler for unhandled exceptions.

        Security: never expose internal error details (stack traces, DB errors)
        to the client. Log full details server-side only.
        """
        logger.error(
            "unhandled_exception",
            path=str(request.url.path),
            method=request.method,
            error_type=type(exc).__name__,
            error=str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "internal_server_error",
                "message": "An unexpected error occurred. Please try again later.",
            },
        )

    # ── Routers ─────────────────────────────────────────────────────────────

    # Health check at root level (no /api/v1 prefix — standard convention)
    app.include_router(health_router.router)

    # Future routers (added in later phases):
    # app.include_router(auth_router.router,      prefix="/api/v1", tags=["Auth"])
    # app.include_router(detection_router.router, prefix="/api/v1", tags=["Detection"])
    # app.include_router(history_router.router,   prefix="/api/v1", tags=["History"])

    return app


# ── ASGI Entry Point ────────────────────────────────────────────────────────
# uvicorn targets this: `uvicorn app.main:app`

app = create_application()
