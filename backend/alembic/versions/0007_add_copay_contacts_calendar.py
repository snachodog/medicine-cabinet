"""add co_pay to prescriptions, providers, pharmacies tables, and calendar_token to notification_preferences

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-26
"""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    # ── prescriptions: add co_pay ─────────────────────────────────────────────
    op.add_column(
        "prescriptions",
        sa.Column("co_pay", sa.Numeric(8, 2), nullable=True),
    )

    # ── providers table ───────────────────────────────────────────────────────
    op.create_table(
        "providers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("specialty", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_providers_id", "providers", ["id"])
    op.create_index("ix_providers_account_id", "providers", ["account_id"])

    # ── pharmacies table ──────────────────────────────────────────────────────
    op.create_table(
        "pharmacies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pharmacies_id", "pharmacies", ["id"])
    op.create_index("ix_pharmacies_account_id", "pharmacies", ["account_id"])

    # ── notification_preferences: add calendar_token ──────────────────────────
    op.add_column(
        "notification_preferences",
        sa.Column("calendar_token", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_notification_preferences_calendar_token",
        "notification_preferences",
        ["calendar_token"],
    )


def downgrade():
    op.drop_index("ix_notification_preferences_calendar_token", "notification_preferences")
    op.drop_column("notification_preferences", "calendar_token")

    op.drop_index("ix_pharmacies_account_id", "pharmacies")
    op.drop_index("ix_pharmacies_id", "pharmacies")
    op.drop_table("pharmacies")

    op.drop_index("ix_providers_account_id", "providers")
    op.drop_index("ix_providers_id", "providers")
    op.drop_table("providers")

    op.drop_column("prescriptions", "co_pay")
