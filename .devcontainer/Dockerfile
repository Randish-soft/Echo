# Use an official Python runtime as a base image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /workspace

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Dagster, and other requirements
RUN pip install dagster dagit dagster-docker

# Install other Python dependencies for your project
COPY pipeline/requirements.txt /workspace/pipeline/requirements.txt
RUN pip install -r /workspace/pipeline/requirements.txt

# Set the default working directory
WORKDIR /workspace

# Make sure Python runs in the right environment
RUN python -m ensurepip --upgrade
