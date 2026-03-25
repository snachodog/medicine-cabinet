"""Add accounts table, rename users to persons

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create accounts table
    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("username", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
    )

    # Drop FK constraint on prescriptions.user_id before renaming.
    # Use raw SQL with IF EXISTS to handle auto-generated constraint names safely.
    op.execute("""
        DO $$
        DECLARE r RECORD;
        BEGIN
            SELECT tc.constraint_name INTO r
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'prescriptions'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'user_id'
            LIMIT 1;
            IF FOUND THEN
                EXECUTE 'ALTER TABLE prescriptions DROP CONSTRAINT ' || r.constraint_name;
            END IF;
        END $$;
    """)

    # Rename users table to persons
    op.rename_table("users", "persons")

    # Rename user_id column to person_id in prescriptions
    op.alter_column("prescriptions", "user_id", new_column_name="person_id")

    # Re-add FK constraint pointing to persons.id
    op.create_foreign_key(
        "prescriptions_person_id_fkey",
        "prescriptions", "persons",
        ["person_id"], ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("prescriptions_person_id_fkey", "prescriptions", type_="foreignkey")
    op.alter_column("prescriptions", "person_id", new_column_name="user_id")
    op.rename_table("persons", "users")
    op.create_foreign_key(
        "prescriptions_user_id_fkey",
        "prescriptions", "users",
        ["user_id"], ["id"],
    )
    op.drop_table("accounts")
