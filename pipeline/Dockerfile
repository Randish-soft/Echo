FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the pipeline code
COPY ./ml/ /app/ml

# Command to run the main pipeline script
ENTRYPOINT ["python", "/app/ml/code_llm.py"]
