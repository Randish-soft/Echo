FROM python:3.9-slim

# Add this line to install git
RUN apt-get update && apt-get install -y git && apt-get clean

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Dagster CLI
RUN pip install dagster dagit dagster-docker

COPY . .

CMD ["dagster", "job", "execute", "-f", "/app/run_pipeline.py", "-j", "run_code_analysis_pipeline"]
