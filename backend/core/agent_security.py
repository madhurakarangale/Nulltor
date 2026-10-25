import os
import re
from typing import Dict, Any, Optional

# File patterns that MUST NEVER be read, written, or exposed to the LLM or sandbox
SENSITIVE_FILE_PATTERNS = [
    r"^\.?env(\..+)?$",           # .env, .env.local, .env.production, etc.
    r".*\.db$",                    # nulltor.db, sqlite databases
    r".*\.sqlite(\d)?$",
    r".*\.pem$",                   # Private keys & certificates
    r".*\.key$",
    r".*id_rsa.*",
    r".*id_ed25519.*",
    r".*id_ecdsa.*",
    r".*\.pfx$",
    r".*\.p12$",
    r".*nulltor.*config.*\.py$",   # Server configuration
    r".*backend/core/config\.py$",
]

# Sensitive environment key prefixes / substrings that must NEVER be passed to user runtime processes
SENSITIVE_ENV_KEYWORDS = [
    "SECRET", "KEY", "TOKEN", "PASSWORD", "PASS", "AUTH",
    "DATABASE", "DB_", "GROQ", "OPENAI", "BOTPRESS", "JWT",
    "ENCRYPTION", "SALT", "CREDENTIAL", "AWS_", "AZURE_", "GCP_"
]

# Safe system environment variables necessary for compilers/interpreters to function
SAFE_SYSTEM_ENV_VARS = {
    "PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "USERPROFILE",
    "HOME", "LANG", "LC_ALL", "TERM", "COMSPEC", "PATHEXT",
    "LOCALAPPDATA", "APPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)",
    "COMMONPROGRAMFILES", "ALLUSERSPROFILE", "HOMEDRIVE", "HOMEPATH"
}

# Regex patterns for real-time Data Loss Prevention (DLP) secret redaction
DLP_REDACTION_PATTERNS = [
    # JWT Tokens
    (re.compile(r"eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}"), "[REDACTED_JWT_TOKEN]"),
    # API Keys (Groq, OpenAI, Anthropic, OpenRouter, Google Gemini, GitHub, GitLab, HuggingFace, Slack, etc.)
    (re.compile(r"(?:gsk_[a-zA-Z0-9_-]{15,}|sk-(?:ant-|proj-|or-v1-)?[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{20,}|glpat-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{30,}|xoxb-[a-zA-Z0-9_-]{20,}|hf_[a-zA-Z0-9]{20,})"), "[REDACTED_API_KEY]"),
    # Database Connection URLs
    (re.compile(r"(?:postgresql|postgres|mysql|sqlite|mongodb(?:\+srv)?):\/\/[^\s\"']+"), "[REDACTED_DB_URL]"),
    # Password & Secret string declarations
    (re.compile(r"""(?i)(["']?(?:password|secret_key|api_key|access_token|private_key|auth_token)["']?\s*[:=]\s*["'])([^"']{4,})(["'])"""), r"\1[REDACTED_SECRET]\3"),
]


def is_sensitive_file(file_path: str) -> bool:
    """
    Checks if a target file path matches any sensitive server or credential files.
    """
    if not file_path:
        return False

    clean_path = file_path.replace("\\", "/").strip().lower()

    # Block directory traversal attempts
    if ".." in clean_path or clean_path.startswith("/") or clean_path.startswith("c:"):
        return True

    base_name = os.path.basename(clean_path)

    for pattern in SENSITIVE_FILE_PATTERNS:
        if re.match(pattern, base_name, re.IGNORECASE) or re.match(pattern, clean_path, re.IGNORECASE):
            return True

    return False


def redact_secrets(text: Optional[str]) -> str:
    """
    Sanitizes text by replacing sensitive secrets, JWTs, API keys, and connection strings
    with safe redacted placeholders before sending to external LLM APIs.
    """
    if not text or not isinstance(text, str):
        return text or ""

    sanitized = text
    for pattern, replacement in DLP_REDACTION_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)

    return sanitized


def get_sanitized_execution_env(extra_env: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    """
    Creates a clean-room execution environment for user scripts and terminal processes.
    Strips ALL server secrets, database URLs, and API keys.
    """
    clean_env: Dict[str, str] = {}

    # 1. Inherit only safe system OS paths
    for key, value in os.environ.items():
        key_upper = key.upper()
        if key_upper in SAFE_SYSTEM_ENV_VARS:
            clean_env[key] = value

    # 2. Strict blacklist filtering on any inherited variables
    for key in list(clean_env.keys()):
        key_upper = key.upper()
        if any(bad in key_upper for bad in SENSITIVE_ENV_KEYWORDS):
            clean_env.pop(key, None)

    # 3. Standard runtime configuration flags
    clean_env["PYTHONUNBUFFERED"] = "1"
    clean_env["PYTHONIOENCODING"] = "utf-8"
    clean_env["PYTHONUTF8"] = "1"
    clean_env["PYTHONPATH"] = ""  # Prevent importing server backend models/core
    clean_env["NODE_OPTIONS"] = "--no-warnings"

    # 4. If the user defined their own project-specific .env variables, attach them
    if extra_env and isinstance(extra_env, dict):
        for k, v in extra_env.items():
            if isinstance(k, str) and isinstance(v, str):
                clean_env[k] = v

    return clean_env


def load_project_env(project_env_vars: Optional[Dict[str, str]]) -> Dict[str, str]:
    """
    Safely loads project-level environment variables for injection into the sandbox.

    Rules:
      - Keys containing any SENSITIVE_ENV_KEYWORDS substring are BLOCKED (cannot
        shadow server secrets like DATABASE_URL, JWT_SECRET_KEY, GROQ_API_KEY, etc.)
      - System-critical keys (PATH, PYTHONPATH, HOME, SYSTEMROOT, etc.) are BLOCKED
        to prevent hijacking the runtime environment.
      - Values are always cast to str and truncated to 4096 chars.
      - Maximum 100 vars total per project.

    This guarantees that user code calling os.getenv() or os.environ only sees
    their own project variables — never any server credential.
    """
    if not project_env_vars or not isinstance(project_env_vars, dict):
        return {}

    # Keys that are reserved — cannot be overridden by project env
    BLOCKED_KEYS = SAFE_SYSTEM_ENV_VARS | {
        "PYTHONPATH", "PYTHONUNBUFFERED", "PYTHONIOENCODING", "PYTHONUTF8",
        "NODE_OPTIONS", "TERM", "SHELL", "COMSPEC"
    }

    safe: Dict[str, str] = {}
    count = 0
    for k, v in project_env_vars.items():
        if count >= 100:
            break
        if not isinstance(k, str) or not k.strip():
            continue
        key_clean = k.strip()
        key_upper = key_clean.upper()

        # Block keys that shadow server secrets
        if any(bad in key_upper for bad in SENSITIVE_ENV_KEYWORDS):
            continue
        # Block system-reserved keys
        if key_upper in BLOCKED_KEYS:
            continue
        # Block keys with invalid characters
        if not re.match(r'^[A-Z_][A-Z0-9_]*$', key_upper):
            continue

        val = str(v)[:4096]  # truncate very long values
        safe[key_clean] = val
        count += 1

    return safe


def validate_ai_base_url(url: Optional[str]) -> bool:
    """
    SSRF protection: validates that a user-supplied AI base_url points only at
    known external LLM providers OR a local Ollama instance.
    Rejects any URL targeting loopback, LAN, cloud metadata, or the server itself.
    """
    if not url:
        return True  # empty = use default, which is always safe

    import urllib.parse, ipaddress

    try:
        parsed = urllib.parse.urlparse(url.strip())
    except Exception:
        return False

    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        return False

    hostname = (parsed.hostname or "").lower().rstrip(".")
    port = parsed.port

    # Allowed external AI provider hostnames (whitelist)
    ALLOWED_EXTERNAL = {
        "api.groq.com",
        "api.openai.com",
        "api.anthropic.com",
        "generativelanguage.googleapis.com",
        "openrouter.ai",
        "api.openrouter.ai",
        "api.together.xyz",
        "api.mistral.ai",
        "api.deepseek.com",
        "api.cohere.com",
        "api.fireworks.ai",
    }

    if hostname in ALLOWED_EXTERNAL:
        return True

    # Allow local Ollama on standard port only
    if hostname in ("localhost", "127.0.0.1", "::1") and port in (11434, 1234, 5000, 8080):
        return True

    # Block everything else (RFC-1918, loopback, link-local, cloud metadata)
    try:
        ip = ipaddress.ip_address(hostname)
        return False  # any explicit IP that isn’t in the whitelist is blocked
    except ValueError:
        pass  # not an IP literal — check for known dangerous hostnames

    BLOCKED_PATTERNS = [
        "localhost", "0.0.0.0", "internal", "intranet", "metadata",
        "169.254",  # link-local / AWS IMDS
    ]
    if any(pat in hostname for pat in BLOCKED_PATTERNS):
        return False

    return False  # default-deny: reject unknown hostnames not in the whitelist
