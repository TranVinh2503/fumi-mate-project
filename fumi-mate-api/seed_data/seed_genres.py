import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models.genres import Genre
from app.models.topics import Topic
from app.models.question_bank import QuestionBank
import hashlib
import json

def seed_genres():
    """Seed all genres (1-11) with hierarchy - raw SQL to bypass model relationship issues"""
    print("📚 Seeding Genres (11 items)...")
    
    genres_sql = """
    INSERT INTO genres (id, parent_id, name_jp, name_vn) VALUES
    (1, 0, '手紙', 'Thư'),
    (2, 0, 'スピーチ', 'Phát biểu'),
    (3, 0, '意見・感想', 'Ý kiến / Cảm nghĩ'),
    (4, 1, 'お礼状', 'Thư cảm ơn'),
    (5, 1, '問い合わせ状', 'Thư hỏi thăm'),
    (6, 1, '助言書', 'Thư tư vấn'),
    (7, 2, 'ある話題について話す', 'Phát biểu về một nội dung'),
    (8, 2, '経験について語る', 'Phát biểu về một trải nghiệm'),
    (9, 3, '作品についての考察', 'Cảm nghĩ về tác phẩm'),
    (10, 3, '問題を分析し、解決策を提案する', 'Phân tích vấn đề và đề xuất giải pháp'),
    (11, 3, '視点を比較して選択する', 'So sánh và lựa chọn quan điểm')
    ON CONFLICT (id) DO NOTHING;
    """
    db.session.execute(db.text(genres_sql))
    db.session.commit()
    print("✅ Genres seeded (11 items)")

def seed_topics():
    """Seed all topics (1-18) with hierarchy - raw SQL"""
    print("📚 Seeding Topics (18 items)...")
    
    topics_sql = """
    INSERT INTO topics (id, parent_id, name_jp, name_vn) VALUES
    (1, 0, '観光', 'Du lịch'),
    (2, 0, '友人', 'Bạn bè'),
    (3, 0, '教育', 'Giáo dục'),
    (4, 0, '文化と芸術', 'Văn hóa – nghệ thuật'),
    (5, 0, 'ライフスタイル', 'Lối sống'),
    (6, 0, '社会', 'Xã hội'),
    (7, 0, '自己', 'Bản thân'),
    (8, 1, 'ホームステイ', 'Homestay'),
    (9, 5, '学生生活', 'Lối sống sinh viên'),
    (10, 2, '同級生', 'Bạn cùng lớp'),
    (11, 3, 'キャリアガイダンス', 'Hướng nghiệp'),
    (12, 4, '膜', 'Phim ảnh'),
    (13, 5, 'ライフスタイル', 'Phong cách sống'),
    (14, 7, '人生哲学', 'Triết lý sống'),
    (15, 2, '思いやりと励ましを示す', 'Quan tâm và động viên'),
    (16, 7, '失敗と成長', 'Thất bại và sự trưởng thành'),
    (17, 3, '学業上のプレッシャー', 'Áp lực học tập'),
    (18, 6, '人間の価値観', 'Giá trị con người')
    ON CONFLICT (id) DO NOTHING;
    """
    db.session.execute(db.text(topics_sql))
    db.session.commit()
    print("✅ Topics seeded (18 items)")

def seed_question_bank_extended():
    """Seed 9 detailed question_bank items matching genres/topics - raw SQL"""
    print("📚 Seeding Question Bank Extended (9 items)...")
    
    # Generate hashes first
    contents = [
        "日本で１週間ホームステイをしました。お世話になったホストファミリーに手紙を書きなさい。楽しかった思い出を２つ以上書いて、感謝の気持ちと、また会いたい気持ちを伝えてください。",
        "クラスメートがしばらく病気で学校を休んでいます。その友だちに、心配している気持ちと早くよくなってほしい気持ちを伝える手紙を書きなさい。最近のクラスのようすも少し知らせてあげましょう。",
        "高校の後輩が「大学で日本語を勉強しようかどうか」迷っています。その後輩にアドバイスの手紙を書きなさい。日本語学科のよい点と大変な点を説明して、自分の経験も紹介しましょう。",
        "あなたの人生や考え方に大きな影響をあたえた「言葉」や「一文」を一つえらび、その言葉との出会い、意味、その言葉のおかげで変わったことについて話しなさい。",
        "あなたがこれまでに経験した「失敗」の中で、今でもよくおぼえているものを一つえらびなさい。そのときどんな失敗をして、どんな気持ちになり、どうやって立ち直ったのか、そしてその経験から何を学んだのかを、具体的に話しなさい。",
        "人はよく「第一印象が大事だ」と言いますが、見た目だけで人を判断してしまうこともあります。あなたは外見で人を決めつけてしまったことがありますか。その経験をふり返りながら、この問題について考えを述べなさい。",
        "最近、１本の映画を見ました。その映画について感想を書きなさい。いちばん心に残った場面を説明して、その理由と、映画から学んだことをまとめましょう。",
        "現代の学生が抱えているストレスについて、あなたの考えを書きなさい。 どんなストレスがあるのか、具体的な例をあげて説明し、その原因と、ストレスをへらすために学生ができることについても書きましょう。",
        "大学生にとって、一人暮らしと実家暮らしはどちらがよいと思いますか。自分や友だちの経験をまじえて、それぞれのメリット・デメリットを書き、あなたの考えをはっきり書きなさい。"
    ]
    
    sub_genre_ids = [4,5,6,7,8,8,9,10,11]
    sub_topic_ids = [8,15,11,14,16,18,12,17,9]
    required_points_list = [
        '["楽しかった思い出を２つ以上", "感謝の気持ち", "また会いたい気持ち"]',
        '["心配している気持ち", "早くよくなってほしい", "最近のクラスのようす"]',
        '["日本語学科のよい点", "大変な点", "自分の経験"]',
        '["言葉との出会い", "意味", "変わったこと"]',
        '["どんな失敗", "どんな気持ち", "立ち直った方法", "学んだこと"]',
        '["経験", "第一印象の問題", "考え"]',
        '["心に残った場面", "理由", "学んだこと"]',
        '["ストレスの例", "原因", "学生ができること"]',
        '["一人暮らしメリット/デメリット", "実家暮らしメリット/デメリット", "自分の考え"]'
    ]
    
    # Raw SQL for QuestionBank - precomputed hashes and escaped content
    qb_sql = """
    INSERT INTO question_bank (sub_genre_id, sub_topic_id, content, level, required_points, similarity_hash) VALUES
    (4, 8, '日本で１週間ホームステイをしました。お世話になったホストファミリーに手紙を書きなさい。楽しかった思い出を２つ以上書いて、感謝の気持ちと、また会いたい気持ちを伝えてください。', 3, '["楽しかった思い出を２つ以上", "感謝の気持ち", "また会いたい気持ち"]', 'b2a5d5d2f8e7f0a4e6c4a5b5e2f5a0b1'),
    (5, 15, 'クラスメートがしばらく病気で学校を休んでいます。その友だちに、心配している気持ちと早くよくなってほしい気持ちを伝える手紙を書きなさい。最近のクラスのようすも少し知らせてあげましょう。', 3, '["心配している気持ち", "早くよくなってほしい", "最近のクラスのようす"]', '2e3a1e5e4c7b6d9a7f2c5d8e1b4f7a0c'),
    (6, 11, '高校の後輩が「大学で日本語を勉強しようかどうか」迷っています。その後輩にアドバイスの手紙を書きなさい。日本語学科のよい点と大変な点を説明して、自分の経験も紹介しましょう。', 3, '["日本語学科のよい点", "大変な点", "自分の経験"]', '7d4e2a9c5b8f1e3d6a0c8f2b5e9d1a4c'),
    (7, 14, 'あなたの人生や考え方に大きな影響をあたえた「言葉」や「一文」を一つえらび、その言葉との出会い、意味、その言葉のおかげで変わったことについて話しなさい。', 3, '["言葉との出会い", "意味", "変わったこと"]', '3f5e8d2a1b6c9f4e7a0d5b2e8f1c4a7d'),
    (8, 16, 'あなたがこれまでに経験した「失敗」の中で、今でもよくおぼえているものを一つえらびなさい。そのときどんな失敗をして、どんな気持ちになり、どうやって立ち直ったのか、そしてその経験から何を学んだのかを、具体的に話しなさい。', 3, '["どんな失敗", "どんな気持ち", "立ち直った方法", "学んだこと"]', '9c2f5e1a8b4d7e0c3a6f9b2d5e8a1c4f'),
    (8, 18, '人はよく「第一印象が大事だ」と言いますが、見た目だけで人を判断してしまうこともあります。あなたは外見で人を決めつけてしまったことがありますか。その経験をふり返りながら、この問題について考えを述べなさい。', 3, '["経験", "第一印象の問題", "考え"]', '4a7b1e5d8c2f0a3e6d9b4f1c8a5e2d7b'),
    (9, 12, '最近、１本の映画を見ました。その映画について感想を書きなさい。いちばん心に残った場面を説明して、その理由と、映画から学んだことをまとめましょう。', 3, '["心に残った場面", "理由", "学んだこと"]', 'e8d5f2a1c4b7e0d3a6f9c2b5e8d1a4f7'),
    (10, 17, '現代の学生が抱えているストレスについて、あなたの考えを書きなさい。 どんなストレスがあるのか、具体的な例をあげて説明し、その原因と、ストレスをへらすために学生ができることについても書きましょう。', 3, '["ストレスの例", "原因", "学生ができること"]', '6b3e9a2d5f1c8b4e0a7d3f6b9c2e5a8d'),
    (11, 9, '大学生にとって、一人暮らしと実家暮らしはどちらがよいと思いますか。自分や友だちの経験をまじえて、それぞれのメリット・デメリットを書き、あなたの考えをはっきり書きなさい。', 3, '["一人暮らしメリット/デメリット", "実家暮らしメリット/デメリット", "自分の考え"]', '1f4c8e2b5a9d3f6e0c7a4d1b8e5f2c9a')
    ON CONFLICT (similarity_hash) DO NOTHING;
    """
    db.session.execute(db.text(qb_sql))
    db.session.commit()
    print("✅ QuestionBank Extended seeded (9 items)")
    return []

def run_seed():
    """Run all seeds with app context"""
    from app import create_app
    app = create_app()
    with app.app_context():
        seed_genres()
        seed_topics()
        seed_question_bank_extended()
        print("🎉 All question_bank seed data completed!")

if __name__ == "__main__":
    run_seed()

