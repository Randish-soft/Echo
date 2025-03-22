#!/usr/bin/env bash
set -e

# OPTIONAL: Activate your venv if you use one
# source /workspaces/Echo/.venv/bin/activate

echo "Starting Dagit..."
exec dagit \
    -f /workspaces/Echo/pipeline/pipeline.py \
    -n run_code_analysis_pipeline \
    -p 3000 \
    -h 0.0.0.0
