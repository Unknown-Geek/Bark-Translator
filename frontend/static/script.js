let selectedGenre = null;
const loadingMessages = [
    "Analyzing your image...",
    "Crafting your tale...",
    "Adding magical details...",
    "Almost ready..."
];

// Genre selection handling
document.querySelectorAll('.genre-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.genre-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedGenre = card.dataset.genre;
    });
});

// File upload preview
document.getElementById('image').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Preview';
            document.getElementById('image-preview').innerHTML = '';
            document.getElementById('image-preview').appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});

// Loading animation
function startLoadingAnimation() {
    const messagesContainer = document.querySelector('.loading-text .messages');
    let currentMessage = 0;

    document.getElementById('loading').style.display = 'block';
    
    return setInterval(() => {
        messagesContainer.innerHTML = `<span>${loadingMessages[currentMessage]}</span>`;
        currentMessage = (currentMessage + 1) % loadingMessages.length;
    }, 2000);
}

// Form submission
document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    if (!selectedGenre) {
        alert('Please select a genre first!');
        return;
    }

    const imageFile = document.getElementById('image').files[0];
    if (!imageFile) {
        alert('Please select an image first!');
        return;
    }

    // Reset and show loading state
    document.getElementById('caption').innerHTML = '';
    document.getElementById('story-container').innerHTML = '';
    document.getElementById('story-audio').style.display = 'none';
    
    const loadingInterval = startLoadingAnimation();

    // Prepare form data
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('genre', selectedGenre);

    try {
        const response = await fetch('http://127.0.0.1:5001/generate_story', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // Clear loading state
        clearInterval(loadingInterval);
        document.getElementById('loading').style.display = 'none';

        if (data.status === 'success') {
            // Display caption with animation
            if (data.caption) {
                const captionEl = document.getElementById('caption');
                captionEl.innerHTML = `
                    <strong>Image Caption:</strong> 
                    <span class="caption-text">${data.caption}</span>
                `;
                captionEl.style.display = 'block';
            }

            // Display story with animation
            if (data.story) {
                const storyEl = document.getElementById('story-container');
                storyEl.innerHTML = data.story;
                storyEl.style.display = 'block';
            }

            // Setup audio if available
            if (data.audio) {
                const audioElement = document.getElementById('story-audio');
                audioElement.src = `/output/${data.audio.split('/').pop()}`;
                audioElement.style.display = 'block';
            }
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        clearInterval(loadingInterval);
        document.getElementById('loading').style.display = 'none';
        alert(`An error occurred: ${error.message}`);
    }
});

// Drag and drop functionality
const dropZone = document.querySelector('.file-upload-label');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('highlight');
}

function unhighlight(e) {
    dropZone.classList.remove('highlight');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    document.getElementById('image').files = files;
    const event = new Event('change');
    document.getElementById('image').dispatchEvent(event);
}
