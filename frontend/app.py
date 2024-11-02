from flask import Flask, render_template, send_from_directory, request
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# Configure paths
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
BACKEND_URL = "http://127.0.0.1:5001"  # Backend server URL

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/output/<path:filename>')
def serve_audio(filename):
    return send_from_directory(OUTPUT_DIR, filename)

@app.route('/process_image', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return {'error': 'No image provided'}, 400
    
    # Forward the request to backend
    response = requests.post(
        f"{BACKEND_URL}/generate_story",
        files={'image': request.files['image']}
    )
    return response.json()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
