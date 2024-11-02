from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import requests
import pyttsx3
import atexit
from PIL import Image
import io
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import urllib3

# Disable SSL verification warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create required directories
os.makedirs('temp', exist_ok=True)
os.makedirs('output', exist_ok=True)

# Update API URL configuration
COLAB_API_URL = "https://a5b4-34-169-122-61.ngrok-free.app/generate_story"  # Production with ngrok
# COLAB_API_URL = "http://127.0.0.1:5000/generate_story"  # Local development (commented out)

# Global engine variable
engine = None

def init_engine():
    """Initialize the text-to-speech engine"""
    global engine
    try:
        if engine is None:
            engine = pyttsx3.init()
            engine.setProperty('rate', 150)
            engine.setProperty('volume', 0.9)
        return engine
    except Exception as e:
        logger.error(f"Error initializing TTS engine: {str(e)}")
        raise

def create_session_with_retries():
    """Create requests session with retries"""
    session = requests.Session()
    retry_strategy = Retry(
        total=5,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

def process_image_with_colab(image_path):
    try:
        session = create_session_with_retries()
        
        with open(image_path, 'rb') as img_file:
            files = {'image': ('image.jpg', img_file, 'image/jpeg')}
            
            response = session.post(COLAB_API_URL, files=files, verify=False, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if data.get('status') == 'error':
                raise Exception(data.get('message', 'Unknown error from Colab'))
                
            return data
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Colab API Error: {str(e)}")
        raise Exception(f"Failed to connect to Colab API: {str(e)}")

@app.route('/generate_story', methods=['POST'])
def generate_story():
    temp_image_path = None
    try:
        # Initialize engine if needed
        init_engine()

        if 'image' not in request.files:
            return jsonify({'status': 'error', 'message': 'No image provided'}), 400
            
        image = request.files['image']
        temp_image_path = os.path.join('temp', f"temp_image_{os.getpid()}.jpg")
        audio_path = os.path.join('output', f"story_{os.getpid()}.mp3")
        
        image.save(temp_image_path)
        logger.info(f"Image saved to {temp_image_path}")
        
        # Get story from Colab instead of Kaggle
        colab_response = process_image_with_colab(temp_image_path)
        story = colab_response['story']
        caption = colab_response.get('caption', '')
        
        # Generate audio
        engine.save_to_file(story, audio_path)
        engine.runAndWait()
        
        return jsonify({
            'status': 'success',
            'story': story,
            'caption': caption,
            'audio': audio_path
        })
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
    finally:
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.remove(temp_image_path)
            except Exception as e:
                logger.error(f"Error removing temp file: {str(e)}")

@atexit.register
def cleanup():
    global engine
    if engine is not None:
        try:
            engine.stop()
        except Exception as e:
            logger.error(f"Error during engine cleanup: {str(e)}")

if __name__ == '__main__':
    init_engine()
    # Run on a different port to avoid conflict with Colab server
    app.run(host='127.0.0.1', port=5001, debug=True)
