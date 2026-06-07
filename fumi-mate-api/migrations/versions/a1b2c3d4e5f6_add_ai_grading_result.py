"""add ai grading result

Revision ID: a1b2c3d4e5f6
Revises: caaca549d689
Create Date: 2026-06-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'caaca549d689'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'ai_grading_result',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(length=30), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=True),
        sa.Column('prompt_version', sa.String(length=50), nullable=True),
        sa.Column('rubric_version', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('total_score', sa.Float(), nullable=True),
        sa.Column('feedback_json', sa.Text(), nullable=True),
        sa.Column('raw_response', sa.Text(), nullable=True),
        sa.Column('error_reason', sa.Text(), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('is_selected', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['submission_id'], ['submission.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ai_grading_result_submission_id', 'ai_grading_result', ['submission_id'])
    op.create_index('ix_ai_grading_result_provider_submission', 'ai_grading_result', ['submission_id', 'provider'])


def downgrade():
    op.drop_index('ix_ai_grading_result_provider_submission', table_name='ai_grading_result')
    op.drop_index('ix_ai_grading_result_submission_id', table_name='ai_grading_result')
    op.drop_table('ai_grading_result')
