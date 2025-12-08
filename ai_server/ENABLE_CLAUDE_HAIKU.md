Enable Claude Haiku 4.5 (guidance)

Summary
-------
This project uses a local Ollama model by default (`llama3:8b-instruct-q4_K_M`). To "enable Claude Haiku 4.5 for all clients" you must ensure the model is available to the AI runtime (Ollama) or switch the AI server to call Anthropic's API.

Two approaches (choose one):

1) Ollama-hosted model (preferred if you run everything locally):
   - Note: Ollama can only run models you have pulled or that Ollama supports. Claude-style models are usually hosted by Anthropic and may not be available in Ollama by that exact name.
   - Steps:
     1. If an Ollama package name exists for Claude Haiku 4.5, pull it locally:
        ```powershell
        ollama pull <model-name-for-claude-haiku-4.5>
        ```
     2. Set the `OLLAMA_MODEL` environment variable on all client machines or in your start scripts to point to that model. Example (PowerShell session):
        ```powershell
        $env:OLLAMA_MODEL = '<model-name-for-claude-haiku-4.5>'
        ```
     3. To persist for all future PowerShell sessions for the current user:
        ```powershell
        setx OLLAMA_MODEL "<model-name-for-claude-haiku-4.5>"
        ```
     4. Restart the AI server (`ai_server/app.py`) and the frontends. They will now use `OLLAMA_MODEL` when invoking `ollama run`.

2) Use Anthropic (hosted) API (if Claude Haiku 4.5 is not available locally):
   - Register with Anthropic, obtain an API key, and update the AI server to call Anthropic endpoints instead of `ollama run`.
   - Minimal steps:
     - Add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` env variables to the AI server environment.
     - Replace or extend the `run_llama` function in `ai_server/app.py` to call Anthropic's HTTP API (their official client or `requests`) with the `ANTHROPIC_MODEL` set to `claude-haiku-4.5`.
     - Ensure responses are returned in the same JSON shape expected by the frontends (`response` + `emotion`).

Notes and caveats
-----------------
- Claude Haiku 4.5 may not be distributed for local Ollama usage; check Anthropic's licensing and distribution policies.
- If using Anthropic, remember to secure your API key and do not commit it to the repo. Use environment variables or a secrets manager.
- The repository has been updated to support `OLLAMA_MODEL` (see `ai_server/app.py`). Set that variable to switch models without code changes.

Quick test (PowerShell):
1. Verify Ollama is running:
   ```powershell
   ollama serve
   ```
2. Verify the model is available (example):
   ```powershell
   ollama list
   ```
3. Start AI server (in project root) with model set for the session:
   ```powershell
   $env:OLLAMA_MODEL='llama3:8b-instruct-q4_K_M' ; python .\ai_server\app.py
   ```

If you want, I can:
- Add a small Anthropic client helper to `ai_server/` and toggle between Ollama and Anthropic based on environment variables.
- Update `Start-All-Enforced.ps1` and `Start_all_system.bat` to set `OLLAMA_MODEL` for all clients automatically.
