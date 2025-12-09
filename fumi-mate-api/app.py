from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS
CORS(app)

# Register blueprint
from routes.tasks import tasks_bp
app.register_blueprint(tasks_bp, url_prefix='/api/tasks')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
