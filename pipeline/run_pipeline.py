from dagster import job, op, In, Out, String, Field
import subprocess
import os
import psycopg2
from git import Repo
from pipeline.ml.code_llm import summarize_code_snippet
from dagster_docker import docker_executor

class AnalyzeConfig(Config):
    repo_url: str
    analysis_script: str
    database_url: str
    user_id: str

@op(config_schema=AnalyzeConfig.to_dict())
def analyze_and_store(context):
    config = context.op_config

    repo_url = config["repo_url"]
    analysis_script = config["analysis_script"]
    database_url = config["database_url"]
    user_id = config["user_id"]

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
                for path, summary in summaries.items():
                    cur.execute(
                        "INSERT INTO code_analysis (user_id, file_path, summary) VALUES (%s, %s, %s)",
                        (user_id, path, summary)
                    )
    finally:
        conn.close()

    context.log.info(f"Inserted {len(summaries)} records into the database.")
    return {"status": "success", "count": len(summaries)}

@job(
    executor_def=docker_executor.configured(
        {
            "image": "python:3.9-slim",
            "env_vars": {
                "DATABASE_URL": os.getenv("DATABASE_URL"),
                "GITHUB_REPO_URL": os.getenv("GITHUB_REPO_URL"),
                "GITHUB_ACCESS_TOKEN": os.getenv("GITHUB_ACCESS_TOKEN"),
                "USER_ID": os.getenv("USER_ID"),
            },
        }
    )
)
def run_code_analysis_pipeline():
    analyze_and_store()
