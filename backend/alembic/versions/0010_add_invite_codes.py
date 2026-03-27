"""add invite codes table

Revision ID: 0010
Revises: 0009
Create Date: 2026-03-26

"""
from alembic import op
import sqlalchemy as sa

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "invite_codes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("created_by_account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("used_by_account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=True),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_table("invite_codes")
