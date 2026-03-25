"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), unique=True, index=True),
        sa.Column("allergies", sa.Text()),
        sa.Column("medical_conditions", sa.Text()),
        sa.Column("emergency_contact", sa.String()),
    )

    op.create_table(
        "medications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("brand_name", sa.String()),
        sa.Column("form", sa.String()),
        sa.Column("dosage", sa.String()),
        sa.Column("instructions", sa.Text()),
        sa.Column("category", sa.String()),
        sa.Column("notes", sa.Text()),
    )

    op.create_table(
        "consumables",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category", sa.String()),
        sa.Column("quantity", sa.Integer(), server_default="0"),
        sa.Column("reorder_threshold", sa.Integer(), server_default="0"),
        sa.Column("storage_location", sa.String()),
        sa.Column("notes", sa.Text()),
    )

    op.create_table(
        "prescriptions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("medication_id", sa.Integer(), sa.ForeignKey("medications.id")),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("date_prescribed", sa.Date()),
        sa.Column("date_filled", sa.Date()),
        sa.Column("refills_remaining", sa.Integer()),
        sa.Column("expiration_date", sa.Date()),
        sa.Column("status", sa.String(), server_default="active"),
        sa.Column("notes", sa.Text()),
    )


def downgrade() -> None:
    op.drop_table("prescriptions")
    op.drop_table("consumables")
    op.drop_table("medications")
    op.drop_table("users")
