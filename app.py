from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from transformers import pipeline, BlipProcessor, BlipForConditionalGeneration, AutoModel
import pyttsx3
import os
from PIL import Image
import torch
import atexit

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create required directories
os.makedirs('models', exist_ok=True)
os.makedirs('temp', exist_ok=True)
os.makedirs('output', exist_ok=True)

# Configure model cache directory
cache_dir = os.path.join(os.getcwd(), 'models')

# Load BLIP model for image captioning
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base", cache_dir=cache_dir)
captioning_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base", cache_dir=cache_dir)

# Load GPT-2 model for story generation - remove cache_dir from pipeline
story_generator = pipeline('text-generation', model='gpt2')

# Create a single pyttsx3 engine instance
engine = pyttsx3.init()
engine.setProperty('rate', 150)
engine.setProperty('volume', 0.9)

def text_to_speech(text, output_path):
    try:
        engine.save_to_file(text, output_path)
        engine.runAndWait()
        # Add a small delay to ensure file is written
        import time
        time.sleep(3)
    except Exception as e:
        logger.error(f"TTS Error: {str(e)}")
        raise

def generate_spooky_caption(image_path):
    try:
        image = Image.open(image_path).convert('RGB')
        inputs = processor(image, return_tensors="pt")
        
        out = captioning_model.generate(**inputs)
        caption = processor.decode(out[0], skip_special_tokens=True)
        
        spooky_prompt = f"In a horror story setting: {caption}. The atmosphere is eerie and unsettling."
        return spooky_prompt
    except Exception as e:
        logger.error(f"Error in caption generation: {str(e)}")
        raise

@app.route('/generate_story', methods=['POST'])
def generate_story():
    temp_image_path = None
    try:
        if 'image' not in request.files:
            return jsonify({'status': 'error', 'message': 'No image provided'}), 400
            
        image = request.files['image']
        if not image.filename:
            return jsonify({'status': 'error', 'message': 'Empty image file'}), 400

        temp_image_path = os.path.join('temp', f"temp_image_{os.getpid()}.jpg")
        audio_path = os.path.abspath(os.path.join('output', f"story_{os.getpid()}.mp3"))
        
        image.save(temp_image_path)
        logger.info(f"Image saved to {temp_image_path}")
        
        spooky_prompt = generate_spooky_caption(temp_image_path)
        logger.info(f"Generated caption: {spooky_prompt}")
        
        story = story_generator(
            spooky_prompt,
            max_new_tokens=300,  # Changed from max_length to max_new_tokens
            num_return_sequences=1,
            temperature=0.9,
            repetition_penalty=1.2,
            truncation=True  # Add truncation parameter
        )[0]['generated_text']
        logger.info("Story generated successfully")
        
        # Use the new text_to_speech function
        text_to_speech(story, audio_path)
        logger.info(f"Audio saved to {audio_path}")
        
        if os.path.exists(audio_path):
         return jsonify({
        'status': 'success',
        'caption': spooky_prompt,
        'story': story,
        'audio': audio_path
           })
        else:
         return jsonify({
        'status': 'error',
        'message': 'Audio file generation failed'
        }), 500
        
        
    except Exception as e:
        logger.error(f"Error in story generation: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Story generation error: {str(e)}"
        }), 500
    
    finally:
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.remove(temp_image_path)
            except Exception as e:
                logger.error(f"Error removing temp file: {str(e)}")

@atexit.register
def cleanup():
    """Cleanup function to be called when the application exits"""
    try:
        engine.stop()
    except Exception as e:
        logger.error(f"Error during engine cleanup: {str(e)}")

if __name__ == '__main__':
    app.run(debug=True)

    
