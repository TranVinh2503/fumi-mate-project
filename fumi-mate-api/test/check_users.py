from app import create_app
from app.extensions import db
from app.models.user import User

def check_users():
    app = create_app()
    with app.app_context():
        print("🔍 Checking users in database...")
        users = User.query.all()
        if not users:
            print("No users found.")
        else:
            for user in users:
                print(f"Username: {user.username}, Role: {user.role}")
        print("✅ Check completed.")

if __name__ == "__main__":
    check_users()
