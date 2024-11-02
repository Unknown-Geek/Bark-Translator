document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const imageFile = document.getElementById('image').files[0];
    if (!imageFile) {
        alert('Please select an image first');
        return;
    }

    // Show loading state
    document.getElementById('loading').style.display = 'block';
    document.getElementById('caption').innerHTML = '';
    document.getElementById('story-container').innerHTML = '';
    document.getElementById('story-audio').style.display = 'none';

    // Display image preview
    const imagePreview = document.getElementById('image-preview');
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded image">`;
    };
    reader.readAsDataURL(imageFile);

    // Send request to backend server
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch('http://127.0.0.1:5001/generate_story', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // Hide loading state
        document.getElementById('loading').style.display = 'none';

        if (data.status === 'success') {
            // Display caption
            if (data.caption) {
                document.getElementById('caption').innerHTML = `<strong>Image Caption:</strong> ${data.caption}`;
            }

            // Display story
            if (data.story) {
                document.getElementById('story-container').innerHTML = data.story;
            }

            // Setup audio
            if (data.audio) {
                const audioElement = document.getElementById('story-audio');
                audioElement.src = `/output/${data.audio.split('/').pop()}`;
                audioElement.style.display = 'block';
            }
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        alert(`An error occurred: ${error.message}`);
    }
});
