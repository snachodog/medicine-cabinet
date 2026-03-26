"""add website and practice_name to contacts

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-26

"""
from alembic import op
import sqlalchemy as sa

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("providers", sa.Column("practice_name", sa.String(), nullable=True))
    op.add_column("providers", sa.Column("website", sa.String(), nullable=True))
    op.add_column("pharmacies", sa.Column("website", sa.String(), nullable=True))


def downgrade():
    op.drop_column("providers", "practice_name")
    op.drop_column("providers", "website")
    op.drop_column("pharmacies", "website")
