"""
SentinelAI — SQLAlchemy Declarative Base

All ORM models inherit from Base.
The naming_convention dict ensures Alembic generates deterministic,
readable constraint names across all migrations.
"""

from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData

# Constraint naming convention — required for Alembic auto-migrations
# to generate correct ALTER TABLE statements on schema changes.
NAMING_CONVENTION: dict[str, str] = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """
    Shared declarative base for all SentinelAI ORM models.
    Import this in every model file instead of creating a new Base.
    """

    metadata = MetaData(naming_convention=NAMING_CONVENTION)
