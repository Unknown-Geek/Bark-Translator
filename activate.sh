#!/bin/bash

# Check if already activated to avoid duplicate activation
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "Virtual environment is already activated"
    return 0
fi

source venv/bin/activate
