#!/bin/bash

cd /Users/vasicatalin/Desktop/hermes-agent-ui
source .venv/bin/activate 2>/dev/null || source venv/bin/activate 2>/dev/null || echo "Nu s-a găsit venv"

echo "Construind web UI..."
cd web
npm run build

if [ $? -eq 0 ]; then
    echo "Build completat!"
    cd ..
    export HERMES_WEB_DIST="web/dist"
    echo "Pornind dashboard..."
    python3 -m hermes_cli.main dashboard
else
    echo "Build failed!"
    exit 1
fi