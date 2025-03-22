from dagster import job, op, In, Out, String, Field
import subprocess
from dagster_docker import docker_executor
import os

# Define the code analysis operation
@op(
    config_schema={
        'repo_url': String,
        'analysis_script': String,
    }
)
def code_analysis_op(context):
    """
    A simple operation that runs the code analysis script on the given GitHub repository.
    """
    repo_url = context.op_config['repo_url']
    analysis_script = context.op_config['analysis_script']

    # Clone the GitHub repository
    context.log.info(f"Cloning repository from {repo_url}")
    clone_command = f"git clone {repo_url} /tmp/repo"
    subprocess.run(clone_command, shell=True, check=True)

    # Run the code analysis (this can be a python script or another command)
    context.log.info(f"Running analysis script: {analysis_script}")
    analysis_command = f"python3 {analysis_script} /tmp/repo"
    subprocess.run(analysis_command, shell=True, check=True)

    context.log.info("Code analysis completed.")

    return {"status": "success"}


# Define a Dagster job that runs the code analysis operation
@job(
    executor_def=docker_executor.configured(
        {
            "image": "python:3.9-slim",  # Python image for the analysis
            "env_vars": {
                "GITHUB_REPO_URL": "https://github.com/your-username/your-repo.git",
            },
        }
    )
)
def run_code_analysis_pipeline():
    code_analysis_op()
