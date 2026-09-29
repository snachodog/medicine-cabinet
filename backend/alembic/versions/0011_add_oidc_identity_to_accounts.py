"""add oidc identity columns to accounts

Revision ID: 0011
Revises: 0010
Create Date: 2026-09-29

"""
from alembic import op
import sqlalchemy as sa

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("accounts", sa.Column("oidc_issuer", sa.String(), nullable=True))
    op.add_column("accounts", sa.Column("oidc_subject", sa.String(), nullable=True))
    op.create_unique_constraint(
        "uq_accounts_oidc_identity", "accounts", ["oidc_issuer", "oidc_subject"]
    )


def downgrade():
    op.drop_constraint("uq_accounts_oidc_identity", "accounts", type_="unique")
    op.drop_column("accounts", "oidc_subject")
    op.drop_column("accounts", "oidc_issuer")
