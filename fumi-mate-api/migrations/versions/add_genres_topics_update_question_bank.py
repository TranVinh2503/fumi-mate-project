"""Add genres/topics tables and update question_bank

Revision ID: add_genres_topics_update_question_bank
Revises: 394db04d31d2
Create Date: 2024-12-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_genres_topics_update_question_bank'
down_revision = '394db04d31d2'
branch_labels = None
depends_on = None

MAIN_GENRES = [
    (1, 0, '手紙', 'Thư'),
    (2, 0, 'スピーチ', 'Bài phát biểu'),
    (3, 0, '意見・感想', 'Ý kiến - Cảm nhận')
]

MAIN_TOPICS = [
    (1, 0, 'Host Family', 'Gia đình chủ nhà'),
    (2, 0, 'Student Stress', 'Căng thẳng học sinh')
]

def upgrade():
    # Drop old enums if exist
    op.execute('DROP TYPE IF EXISTS genre_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS level_enum CASCADE')

    # Create new tables
    op.create_table('genres',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=False, default=0),
    sa.Column('name_jp', sa.String(length=255), nullable=False),
    sa.Column('name_vn', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('topics',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=False, default=0),
    sa.Column('name_jp', sa.String(length=255), nullable=False),
    sa.Column('name_vn', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )

    # Add new columns to question_bank
    op.add_column('question_bank', sa.Column('sub_genre_id', sa.Integer(), nullable=True))
    op.add_column('question_bank', sa.Column('sub_topic_id', sa.Integer(), nullable=True))
    op.add_column('question_bank', sa.Column('new_level', sa.Integer(), nullable=True))

    # Populate genres and topics (hardcoded from seed data)
    conn = op.get_bind()
    for genre_id, parent_id, name_jp, name_vn in MAIN_GENRES:
        conn.execute(sa.text("INSERT INTO genres (id, parent_id, name_jp, name_vn) VALUES (:id, :parent, :jp, :vn)"), 
                     {'id': genre_id, 'parent': parent_id, 'jp': name_jp, 'vn': name_vn})
    
    for topic_id, parent_id, name_jp, name_vn in MAIN_TOPICS:
        conn.execute(sa.text("INSERT INTO topics (id, parent_id, name_jp, name_vn) VALUES (:id, :parent, :jp, :vn)"), 
                     {'id': topic_id, 'parent': parent_id, 'jp': name_jp, 'vn': name_vn})

    # Migrate data for existing question_bank entries
    conn.execute(sa.text("""
        UPDATE question_bank 
        SET sub_genre_id = CASE 
            WHEN genre = '手紙' THEN 1 
            WHEN genre = '意見・感想' THEN 3 
            WHEN genre = 'スピーチ' THEN 2 
            ELSE 1 END,
        sub_topic_id = CASE 
            WHEN topic = 'Host Family' THEN 1
            WHEN topic = 'Student Stress' THEN 2
            ELSE 1 END,
        new_level = CASE 
            WHEN level = 'N3' THEN 3
            WHEN level = 'N2' THEN 2
            ELSE 3 END
    """))

    # Drop old columns
    op.drop_column('question_bank', 'topic')
    op.drop_column('question_bank', 'genre')
    op.alter_column('question_bank', 'new_level', new_column_name='level')
    op.alter_column('question_bank', 'sub_genre_id', nullable=False)
    op.alter_column('question_bank', 'sub_topic_id', nullable=False)

    # Add FK constraints
    op.create_foreign_key('fk_question_bank_sub_genre', 'question_bank', 'genres', ['sub_genre_id'], ['id'])
    op.create_foreign_key('fk_question_bank_sub_topic', 'question_bank', 'topics', ['sub_topic_id'], ['id'])

    # Drop old enums
    op.execute('DROP TYPE IF EXISTS genre_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS level_enum CASCADE')

def downgrade():
    # Recreate old columns and enums
    op.add_column('question_bank', sa.Column('genre', sa.Enum('手紙', 'スピーチ', '意見・感想', name='genre_enum'), nullable=False))
    op.add_column('question_bank', sa.Column('topic', sa.String(255), nullable=False))
    op.add_column('question_bank', sa.Column('old_level', sa.Enum('N3', 'N2', name='level_enum'), nullable=False))

    # Migrate back data (reverse)
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE question_bank 
        SET genre = CASE sub_genre_id 
            WHEN 1 THEN '手紙'
            WHEN 3 THEN '意見・感想'
            WHEN 2 THEN 'スピーチ'
            ELSE '手紙' END,
        topic = CASE sub_topic_id 
            WHEN 1 THEN 'Host Family'
            WHEN 2 THEN 'Student Stress'
            ELSE 'Host Family' END,
        old_level = CASE level 
            WHEN 2 THEN 'N2'
            WHEN 3 THEN 'N3'
            ELSE 'N3' END
    """))

    op.drop_constraint('fk_question_bank_sub_topic', 'question_bank', type_='foreignkey')
    op.drop_constraint('fk_question_bank_sub_genre', 'question_bank', type_='foreignkey')
    op.alter_column('question_bank', 'old_level', new_column_name='level')
    op.drop_column('question_bank', 'sub_topic_id')
    op.drop_column('question_bank', 'sub_genre_id')
    op.drop_column('question_bank', 'level')

    op.drop_table('topics')
    op.drop_table('genres')

