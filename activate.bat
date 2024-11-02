@echo off

REM Check if already activated
if defined VIRTUAL_ENV (
    echo Virtual environment is already activated
    goto :requirements
)

REM Try primary activation method
call venv\Scripts\activate.bat
if defined VIRTUAL_ENV goto :requirements

REM Try secondary activation method if first one fails
call venv\Scripts\activate
if defined VIRTUAL_ENV goto :requirements

echo Failed to activate virtual environment
exit /b 1

:requirements
if exist requirements.txt (
    echo Installing requirements...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo Error installing requirements
        exit /b 1
    )
    echo Requirements installed successfully
)

:success
echo Virtual environment is ready
exit /b 0
