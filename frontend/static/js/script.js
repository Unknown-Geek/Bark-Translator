// State management
let selectedGenre = null;
const loadingMessages = [
    "Analyzing your image...",
    "Crafting your tale...",
    "Adding magical details...",
    "Almost ready..."
];

// Utility functions
const handleError = (message) => {
    alert(message);
    stopLoading();
};

const startLoading = () => {
    const messagesContainer = document.querySelector('.loading-text .messages');
    let currentMessage = 0;

    document.getElementById('loading').style.display = 'block';
    
    return setInterval(() => {
        messagesContainer.innerHTML = `<span>${loadingMessages[currentMessage]}</span>`;
        currentMessage = (currentMessage + 1) % loadingMessages.length;
    }, 2000);
};

const stopLoading = () => {
    document.getElementById('loading').style.display = 'none';
};

const resetResults = () => {
    document.getElementById('caption').innerHTML = '';
    document.getElementById('story-container').innerHTML = '';
    document.getElementById('story-audio').style.display = 'none';
};

const displayResults = (data) => {
    // Display caption
    if (data.caption) {
        const captionEl = document.getElementById('caption');
        captionEl.innerHTML = `
            <strong>Image Caption:</strong> 
            <span class="caption-text">${data.caption}</span>
        `;
        captionEl.style.display = 'block';
    }

    // Display story
    if (data.story) {
        const storyEl = document.getElementById('story-container');
        storyEl.innerHTML = data.story;
        storyEl.style.display = 'block';
    }

    // Setup audio
    if (data.audio) {
        const audioElement = document.getElementById('story-audio');
        audioElement.src = `/output/${data.audio}`;
        audioElement.style.display = 'block';
    }
};

// Genre selection handling
document.querySelectorAll('.genre-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.genre-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedGenre = card.dataset.genre;
    });
});

// File upload handling
const handleFileSelect = (file) => {
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Preview';
            const preview = document.getElementById('image-preview');
            preview.innerHTML = '';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
};

// File input change handler
document.getElementById('image').addEventListener('change', (event) => {
    handleFileSelect(event.target.files[0]);
});

// Form submission
document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    if (!selectedGenre) {
        handleError('Please select a genre first!');
        return;
    }

    const imageFile = document.getElementById('image').files[0];
    if (!imageFile) {
        handleError('Please select an image first!');
        return;
    }

    // Reset results and show loading state
    resetResults();
    const loadingInterval = startLoading();

    // Prepare form data
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('genre', selectedGenre);

    try {
        const response = await fetch('/generate_story', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // Clear loading state
        clearInterval(loadingInterval);
        stopLoading();

        if (data.status === 'success') {
            displayResults(data);
        } else {
            handleError(data.message || 'An error occurred');
        }
    } catch (error) {
        clearInterval(loadingInterval);
        handleError(`An error occurred: ${error.message}`);
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

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        document.getElementById('image').files = files;
        handleFileSelect(files[0]);
    }
}, false);
