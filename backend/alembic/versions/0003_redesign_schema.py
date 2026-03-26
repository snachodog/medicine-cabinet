"""Redesign schema: replace CRUD entities with dose-tracking model

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old tables in FK dependency order
    op.drop_table("consumables")
    op.drop_table("prescriptions")
    op.drop_table("medications")

    # Drop and recreate persons with simplified schema
    op.drop_table("persons")
    op.create_table(
        "persons",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    # account_person_access: who can log on behalf of whom
    op.create_table(
        "account_person_access",
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), primary_key=True),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("persons.id"), primary_key=True),
    )

    # medication_catalog: seed list for quick selection
    op.create_table(
        "medication_catalog",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=False, index=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("default_dose_amount", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    # medications: a person's specific medication
    op.create_table(
        "medications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("persons.id"), nullable=False),
        sa.Column("catalog_id", sa.Integer(), sa.ForeignKey("medication_catalog.id"), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("dose_amount", sa.String(), nullable=True),
        sa.Column("schedule", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    # prescriptions: fill tracking for Rx / Schedule II meds
    op.create_table(
        "prescriptions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("medication_id", sa.Integer(), sa.ForeignKey("medications.id"),
                  unique=True, nullable=False),
        sa.Column("prescriber", sa.String(), nullable=True),
        sa.Column("pharmacy", sa.String(), nullable=True),
        sa.Column("days_supply", sa.Integer(), server_default="30", nullable=False),
        sa.Column("scripts_remaining", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_fill_date", sa.Date(), nullable=True),
        sa.Column("next_eligible_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    # fills: individual pharmacy pickups
    op.create_table(
        "fills",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("prescription_id", sa.Integer(), sa.ForeignKey("prescriptions.id"), nullable=False),
        sa.Column("fill_date", sa.Date(), nullable=False),
        sa.Column("pharmacy", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("logged_by_account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=True),
    )

    # dose_logs: each time a person takes a medication
    op.create_table(
        "dose_logs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("medication_id", sa.Integer(), sa.ForeignKey("medications.id"), nullable=False),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("persons.id"), nullable=False),
        sa.Column("logged_by_account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("taken_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    # notification_preferences: per-account ntfy / email config
    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"),
                  unique=True, nullable=False),
        sa.Column("ntfy_url", sa.String(), nullable=True),
        sa.Column("ntfy_token", sa.String(), nullable=True),
        sa.Column("refill_reminder_days", sa.Integer(), server_default="7", nullable=False),
        sa.Column("scripts_low_threshold", sa.Integer(), server_default="2", nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notification_preferences")
    op.drop_table("dose_logs")
    op.drop_table("fills")
    op.drop_table("prescriptions")
    op.drop_table("medications")
    op.drop_table("medication_catalog")
    op.drop_table("account_person_access")
    op.drop_table("persons")

    # Restore old persons table
    op.create_table(
        "persons",
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
        "prescriptions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("medication_id", sa.Integer(), sa.ForeignKey("medications.id")),
        sa.Column("person_id", sa.Integer(), sa.ForeignKey("persons.id")),
        sa.Column("date_prescribed", sa.Date()),
        sa.Column("date_filled", sa.Date()),
        sa.Column("refills_remaining", sa.Integer()),
        sa.Column("expiration_date", sa.Date()),
        sa.Column("status", sa.String(), server_default="active"),
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
