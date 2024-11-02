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

# Add server status indicator
st.sidebar.markdown("### Server Status")
try:
    response = requests.get("https://a5b4-34-169-122-61.ngrok-free.app/")
    st.sidebar.success("✅ Connected to AI Server")
except:
    st.sidebar.error("❌ AI Server Unavailable")

uploaded_file = st.file_uploader("Upload an image to generate a spooky story...", type=["jpg", "jpeg", "png"])

# Update API endpoint
API_ENDPOINT = 'http://127.0.0.1:5001/generate_story'  # Point to local Flask app

if uploaded_file is not None:
    # Display image preview
    image = Image.open(uploaded_file)
    st.image(image, caption='Your uploaded image', use_column_width=True)
    
    try:
        with st.spinner('Granny is analyzing the image and crafting a spooky tale...'):
            files = {'image': uploaded_file.getvalue()}
            
            # Add error details for debugging
            try:
                response = requests.post(API_ENDPOINT, files=files)
                st.sidebar.write(f"Response Status: {response.status_code}")
            except requests.exceptions.RequestException as e:
                st.sidebar.error(f"Request Error: {str(e)}")
                raise
            
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
