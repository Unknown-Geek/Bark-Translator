@echo off

REM Check if already activated
if defined VIRTUAL_ENV (
    echo Virtual environment is already activated
    goto :eof
)

call venv\Scripts\activate
