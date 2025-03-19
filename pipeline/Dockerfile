FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy the pipeline code and analysis scripts
COPY pipeline.py .

# Command to run the pipeline script
ENTRYPOINT ["python", "pipeline.py"]
