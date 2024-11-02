// Theme management
const themeSwitch = document.getElementById('theme-switch');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light-theme';
body.classList.add(savedTheme);

// Theme toggle functionality
themeSwitch.addEventListener('click', () => {
    if (body.classList.contains('light-theme')) {
        body.classList.replace('light-theme', 'dark-theme');
        localStorage.setItem('theme', 'dark-theme');
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        localStorage.setItem('theme', 'light-theme');
    }
});

// Genre selection management
let selectedGenre = 'horror'; // Default genre

// Add click handlers for genre selection
document.querySelectorAll('.genre-card').forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all cards
        document.querySelectorAll('.genre-card').forEach(c => c.classList.remove('active'));
        // Add active class to selected card
        card.classList.add('active');
        // Update selected genre
        selectedGenre = card.dataset.genre;
        // Update upload container theme
        updateTheme(selectedGenre);
    });
});

// Set initial active state
document.querySelector('.genre-card.horror').classList.add('active');

// Function to update theme based on genre
function updateTheme(genre) {
    const uploadContainer = document.querySelector('.upload-container');
    uploadContainer.className = 'upload-container'; // Reset classes
    uploadContainer.classList.add(genre);
}

// Form submission handler
document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    const imageFile = document.getElementById('image').files[0];
    
    if (!imageFile) {
        alert('Please select an image first!');
        return;
    }
    
    formData.append('image', imageFile);
    formData.append('genre', selectedGenre);
    
    try {
        const storyContainer = document.getElementById('story-container');
        storyContainer.innerText = 'Generating your story...';
        
        const response = await fetch('/generate_story', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        storyContainer.innerText = data.story;
        
        const audio = document.getElementById('audio');
        audio.src = data.audio;
        audio.style.display = 'block';
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('story-container').innerText = 
            'An error occurred while generating the story. Please try again.';
    }
});

// File input change handler - show selected filename
document.getElementById('image').addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name;
    if (fileName) {
        const label = this.closest('.file-input-label');
        label.textContent = fileName;
    }
});