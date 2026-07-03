"""
SentinelAI — Alembic Migration Environment

Configures async migrations using SQLAlchemy's asyncio pattern.
The database URL is pulled from Settings so no secrets are in alembic.ini.

All models are imported here to ensure Base.metadata is fully populated
before autogenerate inspects the schema.

To generate a migration:
    docker compose exec backend alembic revision --autogenerate -m "description"

To apply migrations:
    docker compose exec backend alembic upgrade head

To roll back one step:
    docker compose exec backend alembic downgrade -1
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ── Import Settings ──────────────────────────────────────────────────────────
from app.core.config import get_settings

settings = get_settings()

# ── Import ALL models to populate Base.metadata ──────────────────────────────
# This is critical — if a model is not imported here, autogenerate will not
# detect its table and will try to DROP it in the next migration.
from app.db.base import Base
import app.models  # Imports all 8 models via models/__init__.py

# ── Alembic Config Object ────────────────────────────────────────────────────
config = context.config

# Configure Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Inject our real database URL — overrides the placeholder in alembic.ini
config.set_main_option("sqlalchemy.url", settings.database_url)

# The metadata object that autogenerate will compare against
target_metadata = Base.metadata


# ── Offline Migrations ───────────────────────────────────────────────────────
# Generates SQL script without connecting to the database.
# Useful for reviewing migrations before applying them.

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Render UUIDs and other PG types correctly
        render_as_batch=False,
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online Migrations (Async) ────────────────────────────────────────────────
# Connects to the running database and applies migrations.

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,       # Detect column type changes
        compare_server_default=True,  # Detect server default changes
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations using an async engine with NullPool (no connection reuse)."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # Don't pool — migration is a one-shot operation
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ── Entry Point ──────────────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
