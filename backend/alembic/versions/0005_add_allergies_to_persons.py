"""Add allergies field to persons

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("persons", sa.Column("allergies", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("persons", "allergies")
