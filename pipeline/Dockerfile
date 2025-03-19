FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Install the necessary dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy the analysis script
COPY repo_analyzer.py .

# Set environment variables if needed
ENV GITHUB_REPO_URL=https://github.com/your-username/your-repo.git

CMD ["python", "repo_analyzer.py"]
