import streamlit as st
import requests
from PIL import Image
import io

st.set_page_config(page_title="Granny's Horror Tales", page_icon="👵")

# Custom CSS
st.markdown("""
    <style>
    .stTitle {
        color: #880808;
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .story-text {
        background-color: #f8f8f8;
        padding: 20px;
        border-radius: 10px;
        border-left: 5px solid #880808;
        margin: 20px 0;
    }
    </style>
""", unsafe_allow_html=True)

st.title("👵 Granny's Horror Tales")

uploaded_file = st.file_uploader("Upload an image to generate a spooky story...", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Display image preview
    image = Image.open(uploaded_file)
    st.image(image, caption='Your uploaded image', use_column_width=True)
    
    try:
        with st.spinner('Granny is analyzing the image and crafting a spooky tale...'):
            files = {'image': uploaded_file.getvalue()}
            response = requests.post('http://localhost:5000/generate_story', files=files)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    st.info(f"Image Caption: {data['caption']}")
                    st.markdown(f"<div class='story-text'>{data['story']}</div>", unsafe_allow_html=True)
                    st.audio(data['audio'])
                    st.success("Story generated successfully! Listen to Granny narrate it above.")
                else:
                    st.error(f"Error: {data.get('message', 'Unknown error')}")
            else:
                st.error(f"Error: Server returned status code {response.status_code}")
                
    except requests.exceptions.RequestException as e:
        st.error(f"Connection error: {str(e)}")
    except Exception as e:
        st.error(f"An error occurred: {str(e)}")
