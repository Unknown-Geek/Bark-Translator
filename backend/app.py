from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import requests
import atexit
from PIL import Image
import io
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import urllib3
import ssl
from gtts import gTTS  # Add this import at the top
import time
from pydub import AudioSegment
import shutil
import tempfile
import ffmpeg
import wave
import numpy as np

# Update Colab URL to the new ngrok URL
COLAB_API_URL = "https://8175-34-83-88-14.ngrok-free.app/generate_story"

# Disable SSL verification warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Update paths to be absolute
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, 'temp')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

# Create required directories with absolute paths
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Update timeout and file handling settings
REQUEST_TIMEOUT = 60  # Increased timeout
FILE_RETRY_COUNT = 3
FILE_RETRY_DELAY = 1

def init_engine():
    """Initialize text-to-speech using gTTS instead of pyttsx3"""
    # No initialization needed for gTTS
    pass

def create_session_with_retries():
    """Create requests session with improved retry strategy"""
    session = requests.Session()
    retry = Retry(
        total=5,  # More retries
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "POST", "OPTIONS"]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def process_image_with_colab(image_path):
    try:
        session = create_session_with_retries()
        
        with open(image_path, 'rb') as img_file:
            files = {'image': ('image.jpg', img_file, 'image/jpeg')}
            
            response = session.post(
                COLAB_API_URL,
                files=files,
                headers={'Connection': 'close'},
                timeout=30
            )
            
            logger.debug(f"Response status: {response.status_code}")
            logger.debug(f"Response URL: {response.url}")
            
            response.raise_for_status()
            return response.json()
            
    except Exception as e:
        logger.error(f"Colab API Error: {str(e)}")
        raise

def generate_audio(text, output_path):
    """Generate audio using gTTS and process with ffmpeg-python"""
    try:
        # Create temporary files for audio processing
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_mp3:
            temp_mp3_path = temp_mp3.name
            
        logger.info(f"Generating audio to temp file: {temp_mp3_path}")
        
        # Generate initial audio with gTTS
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(temp_mp3_path)
        
        # Process audio with ffmpeg
        try:
            # Read input audio
            stream = ffmpeg.input(temp_mp3_path)
            
            # Apply audio processing
            stream = ffmpeg.filter(stream, 'afftfilt', 'volume=0.8')  # Normalize volume
            stream = ffmpeg.filter(stream, 'aresample', 44100)  # Resample to 44.1kHz
            stream = ffmpeg.filter(stream, 'aformat', 'sample_fmts=s16')  # Set format
            
            # Write output
            stream = ffmpeg.output(stream, output_path,
                                 acodec='libmp3lame',
                                 audio_bitrate='192k',
                                 loglevel='error')
            
            # Run ffmpeg
            ffmpeg.run(stream, capture_stdout=True, capture_stderr=True)
            
            # Verify output file
            if not os.path.exists(output_path) or os.path.getsize(output_path) < 1024:
                raise Exception("Processed audio file is invalid")
                
            return True
            
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error: {e.stderr.decode() if e.stderr else str(e)}")
            raise
            
    except Exception as e:
        logger.error(f"Error in audio generation: {str(e)}")
        return False
        
    finally:
        # Clean up temp file
        if 'temp_mp3_path' in locals() and os.path.exists(temp_mp3_path):
            safe_remove_file(temp_mp3_path)

def safe_remove_file(file_path):
    """Safely remove file with retries"""
    if file_path and os.path.exists(file_path):
        for _ in range(FILE_RETRY_COUNT):
            try:
                os.remove(file_path)
                break
            except Exception:
                time.sleep(FILE_RETRY_DELAY)

@app.route('/generate_story', methods=['POST', 'OPTIONS'])
def generate_story():
    if request.method == 'OPTIONS':
        return '', 204
    temp_image_path = None
    audio_path = None
    
    try:
        if 'image' not in request.files:
            return jsonify({'status': 'error', 'message': 'No image provided'}), 400
        
        # Generate unique filenames with timestamp
        timestamp = int(time.time())
        temp_image_path = os.path.join(TEMP_DIR, f"temp_image_{timestamp}_{os.getpid()}.jpg")
        audio_filename = f"story_{timestamp}_{os.getpid()}.mp3"
        audio_path = os.path.join(OUTPUT_DIR, audio_filename)
        
        image.save(temp_image_path)
        logger.info(f"Image saved to {temp_image_path}")
        
        # Get story from Colab instead of Kaggle
        colab_response = process_image_with_colab(temp_image_path)
        story = colab_response['story']
        caption = colab_response.get('caption', '')
        
        # Generate and process audio
        if not generate_audio(story, audio_path):
            raise Exception("Failed to generate audio")
        
        # Get audio duration using ffmpeg
        probe = ffmpeg.probe(audio_path)
        audio_info = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
        duration = float(probe['format']['duration'])
        
        return jsonify({
            'status': 'success',
            'story': story,
            'caption': caption,
            'audio': audio_filename,
            'duration': duration
        })
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        if audio_path and os.path.exists(audio_path):
            safe_remove_file(audio_path)
        return jsonify({'status': 'error', 'message': str(e)}), 500
        
    finally:
        safe_remove_file(temp_image_path)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)
