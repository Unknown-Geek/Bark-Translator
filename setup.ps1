# Setup script for Granny's Tales project

Write-Host "Setting up Granny's Tales project..." -ForegroundColor Green

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed or not in PATH"
    exit 1
}

# Create and activate virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
python -m venv venv
./venv/Scripts/Activate

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install requirements
Write-Host "Installing requirements..." -ForegroundColor Yellow
pip install -r requirements.txt

# Install ipykernel for Jupyter/Colab support
Write-Host "Installing and configuring ipykernel..." -ForegroundColor Yellow
pip install ipykernel
python -m ipykernel install --user --name=venv

# Create necessary directories
Write-Host "Creating project directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "temp"
New-Item -ItemType Directory -Force -Path "output"
New-Item -ItemType Directory -Force -Path "static"
New-Item -ItemType Directory -Force -Path "templates"

# Start servers in new PowerShell windows
Write-Host "Starting servers..." -ForegroundColor Yellow

# Start Flask server
$flaskCmd = "cd '$PSScriptRoot'; ./venv/Scripts/Activate; python app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $flaskCmd

# Start Streamlit server
$streamlitCmd = "cd '$PSScriptRoot'; ./venv/Scripts/Activate; streamlit run streamlit_app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $streamlitCmd

Write-Host "Setup complete! The following servers are running:" -ForegroundColor Green
Write-Host "- Flask server: http://127.0.0.1:5001" -ForegroundColor Cyan
Write-Host "- Streamlit server: http://localhost:8501" -ForegroundColor Cyan
Write-Host "`nNote: You'll need to start the Colab notebook separately and update the ngrok URL in app.py" -ForegroundColor Yellow
