"""add email notifications support

Revision ID: 0009
Revises: 0008
Create Date: 2026-03-26

"""
from alembic import op
import sqlalchemy as sa

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("accounts", sa.Column("email", sa.String(), nullable=True))
    op.add_column("prescriptions", sa.Column("expiration_date", sa.Date(), nullable=True))
    op.add_column(
        "notification_preferences",
        sa.Column("email_enabled", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade():
    op.drop_column("accounts", "email")
    op.drop_column("prescriptions", "expiration_date")
    op.drop_column("notification_preferences", "email_enabled")
