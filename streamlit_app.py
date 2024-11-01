import streamlit as st
import requests

st.title("Granny's Horror Tales")

uploaded_file = st.file_uploader("Choose an image...", type="jpg")

if uploaded_file is not None:
    files = {'image': uploaded_file.getvalue()}
    response = requests.post('http://localhost:5000/generate_story', files=files)
    data = response.json()
    
    st.write(data['story'])
    st.audio(data['audio'])
