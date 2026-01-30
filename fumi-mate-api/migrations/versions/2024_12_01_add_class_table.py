"""add_class_table

Revision ID: add_class_table
Revises: eb805cd9bb68
Create Date: 2024-12-01

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_class_table'
down_revision = 'eb805cd9bb68'
branch_labels = None
depends_on = None


def upgrade():
    # Create class table
    op.create_table(
        'class',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Add class_id column to student_profile
    op.add_column('student_profile', sa.Column('class_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_student_profile_class_id',
        'student_profile', 'class',
        ['class_id'], ['id']
    )
    
    # Add class_id column to task
    op.add_column('task', sa.Column('class_id', sa.Integer(), nullable=False, server_default='1'))
    op.create_foreign_key(
        'fk_task_class_id',
        'task', 'class',
        ['class_id'], ['id']
    )
    
    # Remove teacher_id from task if exists
    if hasattr(op.get_bind(), 'dialect'):
        try:
            op.drop_column('task', 'teacher_id')
        except:
            pass  # Column may not exist
    
    # Update question_bank table schema
    # Rename columns and add new ones
    op.add_column('question_bank', sa.Column('question_text', sa.Text(), nullable=False))
    op.add_column('question_bank', sa.Column('question_type', sa.String(50), nullable=False))
    op.add_column('question_bank', sa.Column('hint', sa.Text(), nullable=True))
    op.add_column('question_bank', sa.Column('sample_answer', sa.Text(), nullable=True))
    op.add_column('question_bank', sa.Column('difficulty', sa.String(20), default='N5'))
    op.add_column('question_bank', sa.Column('created_at', sa.DateTime(), nullable=True))
    
    # Drop old columns from question_bank if they exist
    try:
        op.drop_column('question_bank', 'required_points')
    except:
        pass
    try:
        op.drop_column('question_bank', 'similarity_hash')
    except:
        pass
    try:
        op.drop_column('question_bank', 'level')
    except:
        pass
    try:
        op.drop_column('question_bank', 'genre')
    except:
        pass
    try:
        op.drop_column('question_bank', 'topic')
    except:
        pass
    try:
        op.drop_column('question_bank', 'content')
    except:
        pass
    
    # Drop old enums if they exist
    try:
        op.execute('DROP TYPE IF EXISTS genre_enum')
        op.execute('DROP TYPE IF EXISTS level_enum')
    except:
        pass


def downgrade():
    # Add old columns back to question_bank
    op.add_column('question_bank', sa.Column('genre', sa.String(50)))
    op.add_column('question_bank', sa.Column('topic', sa.String(255)))
    op.add_column('question_bank', sa.Column('content', sa.Text()))
    op.add_column('question_bank', sa.Column('level', sa.String(20)))
    op.add_column('question_bank', sa.Column('required_points', sa.Text()))
    op.add_column('question_bank', sa.Column('similarity_hash', sa.String(64)))
    
    # Remove new columns
    try:
        op.drop_column('question_bank', 'question_text')
        op.drop_column('question_bank', 'question_type')
        op.drop_column('question_bank', 'hint')
        op.drop_column('question_bank', 'sample_answer')
        op.drop_column('question_bank', 'difficulty')
        op.drop_column('question_bank', 'created_at')
    except:
        pass
    
    # Remove foreign key and column from task
    op.drop_constraint('fk_task_class_id', 'task', type_='foreignkey')
    op.drop_column('task', 'class_id')
    
    # Remove foreign key and column from student_profile
    op.drop_constraint('fk_student_profile_class_id', 'student_profile', type_='foreignkey')
    op.drop_column('student_profile', 'class_id')
    
    # Drop class table
    op.drop_table('class')

