# pipeline.py
from dagster import job, op, In, Out, String, Field
import subprocess
import os
import psycopg2  # pip install psycopg2 (or psycopg2-binary) if using Postgres
from git import Repo  # from GitPython
from pipeline.ml.code_llm import summarize_code_snippet
from dagster_docker import docker_executor

@op(
    config_schema={
        "repo_url": String,      # e.g. "https://github.com/your-username/your-repo.git"
        "analysis_script": String,  # path to a local .py script if you want
        "database_url": String,  # e.g. "postgresql://user:password@host:port/db_name"
        "user_id": String,       # ID or username of the signed-in user
    }
)
def analyze_and_store(context):
    """
    1. Clones the given GitHub repo.
    2. Optionally runs analysis_script.
    3. Summarizes each .py file via the code LLM.
    4. Inserts results into the DB under the given user_id.
    """
    repo_url = context.op_config["repo_url"]
    analysis_script = context.op_config["analysis_script"]
    database_url = context.op_config["database_url"]
    user_id = context.op_config["user_id"]

    # 1) Clone the repo to /tmp/repo
    clone_path = "/tmp/repo"
    if os.path.exists(clone_path):
        subprocess.run(f"rm -rf {clone_path}", shell=True)
    context.log.info(f"Cloning repository from {repo_url} to {clone_path}...")
    Repo.clone_from(repo_url, clone_path)

    # 2) If needed, run the local analysis script
    if analysis_script:
        context.log.info(f"Running analysis script: {analysis_script}")
        subprocess.run(
            f"python3 {analysis_script} {clone_path}",
            shell=True,
            check=True
        )

    # 3) Summarize code files with Hugging Face LLM
    summaries = {}
    for root, dirs, files in os.walk(clone_path):
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root, file)
                context.log.info(f"Analyzing: {filepath}")

                # read code
                with open(filepath, "r", encoding="utf-8") as f:
                    code_content = f.read()

                # you may want to chunk or truncate for large files
                snippet = code_content[:2000]
                summary = summarize_code_snippet(snippet)
                summaries[filepath] = summary

    context.log.info("LLM code analysis completed. Now storing results...")

    # 4) Connect to DB and insert results
    conn = psycopg2.connect(database_url)
    try:
        with conn:
            with conn.cursor() as cur:
                # Example table definition:
                # CREATE TABLE code_analysis (
                #    id SERIAL PRIMARY KEY,
                #    user_id VARCHAR NOT NULL,
                #    file_path TEXT,
                #    summary TEXT
                # );
                for path, summary in summaries.items():
                    cur.execute(
                        "INSERT INTO code_analysis (user_id, file_path, summary) VALUES (%s, %s, %s)",
                        (user_id, path, summary)
                    )
    finally:
        conn.close()

    return {"status": "success", "count": len(summaries)}


@job(
    executor_def=docker_executor.configured(
        {
            "image": "python:3.9-slim",
            "env_vars": {
                # If you want to pass env vars or secrets into the Docker executor,
                # do that here. For example:
                # "DATABASE_URL": "postgresql://..."
            },
        }
    )
)
def run_code_analysis_pipeline():
    analyze_and_store()
