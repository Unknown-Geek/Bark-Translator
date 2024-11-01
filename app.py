#pip install -r requirements.txt
#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
from flask import Flask, request, jsonify
from transformers import pipeline
import streamlit as st
import pyttsx3
import torch

app = Flask(__name__)

# Load the model from Hugging Face
# If the model is private, include the token parameter
story_generator = pipeline('text-generation', model='gpt2', framework='pt', use_auth_token='YOUR_HUGGINGFACE_TOKEN')

# Initialize text-to-speech engine
engine = pyttsx3.init()
engine.setProperty('voice', 'com.apple.speech.synthesis.voice.grandma')  # Adjust this based on your OS

@app.route('/generate_story', methods=['POST'])
def generate_story():
    image = request.files['image']
    # Process the image and generate a description (placeholder)
    description = "A spooky old house with creaky floors and cobwebs."
    
    # Generate a horror story based on the description
    story = story_generator(description, max_length=200, num_return_sequences=1)[0]['generated_text']
    
    # Convert the story to speech
    engine.save_to_file(story, 'story.mp3')
    engine.runAndWait()
    
    return jsonify({'story': story, 'audio': 'story.mp3'})

if __name__ == '__main__':
    app.run(debug=True)
