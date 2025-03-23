# pipeline/Dockerfile
FROM python:3.9-slim

# Install git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy + install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy pipeline code
COPY pipeline.py .
COPY ml ./ml

EXPOSE 9001
CMD ["python", "pipeline.py"]
