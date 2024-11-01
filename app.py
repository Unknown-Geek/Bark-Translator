from flask import Flask, request, jsonify
from transformers import pipeline, BlipProcessor, BlipForConditionalGeneration
import pyttsx3
import os
from PIL import Image
import torch

app = Flask(__name__)

# Load BLIP model for image captioning
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
captioning_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# Load GPT-2 model for story generation
story_generator = pipeline('text-generation', model='gpt2')

def generate_spooky_caption(image_path):
    # Load and process image
    image = Image.open(image_path).convert('RGB')
    inputs = processor(image, return_tensors="pt")
    
    # Generate caption
    out = captioning_model.generate(**inputs)
    caption = processor.decode(out[0], skip_special_tokens=True)
    
    # Make the caption spooky
    spooky_prompt = f"In a horror story setting: {caption}. The atmosphere is eerie and unsettling."
    return spooky_prompt

@app.route('/generate_story', methods=['POST'])
def generate_story():
    try:
        if 'image' not in request.files:
            return jsonify({'status': 'error', 'message': 'No image provided'}), 400
            
        image = request.files['image']
        temp_image_path = "temp_image.jpg"
        image.save(temp_image_path)
        
        try:
            # Generate caption from image
            spooky_prompt = generate_spooky_caption(temp_image_path)
            
            # Generate horror story using the caption
            story = story_generator(
                spooky_prompt,
                max_length=300,
                num_return_sequences=1,
                temperature=0.9,
                repetition_penalty=1.2
            )[0]['generated_text']
            
            # Create audio with spooky voice settings
            engine = pyttsx3.init()
            voices = engine.getProperty('voices')
            engine.setProperty('rate', 150)  # Slower speed
            engine.setProperty('volume', 0.9)
            engine.save_to_file(story, 'story.mp3')
            engine.runAndWait()
            
            return jsonify({
                'status': 'success',
                'caption': spooky_prompt,
                'story': story,
                'audio': 'story.mp3'
            })
            
        except Exception as e:
            print(f"Error in story generation: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': f"Story generation error: {str(e)}"
            }), 500
            
        finally:
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)
                
    except Exception as e:
        print(f"General error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Server error: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
