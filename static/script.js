document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('image', document.getElementById('image').files[0]);
    
    const response = await fetch('/generate_story', {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    document.getElementById('story-container').innerText = data.story;
    document.getElementById('audio').src = data.audio;
});
