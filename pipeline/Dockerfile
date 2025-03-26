# Use official Python 3.12 image
FROM python:3.12

# Install system dependencies including git and Rust (needed for some Python packages)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (needed for compiling some Python packages like pendulum)
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Set working directory inside container
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy machine learning code
COPY ml ./ml

# Copy the main script
COPY main.py .  

# Expose port for the pipeline
EXPOSE 9001

# Run the pipeline script
CMD ["python3", "main.py"]
