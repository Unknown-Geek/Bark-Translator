from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

# Configure paths
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/output/<path:filename>')
def serve_audio(filename):
    return send_from_directory(OUTPUT_DIR, filename)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
