# pipeline/ml/code_llm.py
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_NAME = "replit/replit-code-v1-3b"  # or another small code model

_tokenizer = None
_model = None

def load_code_model():
    """Loads the code model + tokenizer, if not already loaded."""
    global _tokenizer, _model
    if _tokenizer is None or _model is None:
        print(f"Loading model '{MODEL_NAME}'...")
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
        _model.eval()

        if torch.cuda.is_available():
            _model.to("cuda")
        else:
            print("No GPU found, using CPU (this may be slower).")

    return _tokenizer, _model

def summarize_code_snippet(code_snippet: str, max_new_tokens=128) -> str:
    """Ask the model to produce a short explanation of the code snippet."""
    tokenizer, model = load_code_model()

    prompt = (
        "Explain what this code does:\n\n"
        + code_snippet
        + "\n\nExplanation:"
    )

    inputs = tokenizer(prompt, return_tensors="pt")
    if torch.cuda.is_available():
        inputs = {k: v.to("cuda") for k, v in inputs.items()}

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.2,
            do_sample=False
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=True)

    # Extract the part after "Explanation:" if present
    if "Explanation:" in decoded:
        return decoded.split("Explanation:")[-1].strip()

    return decoded
