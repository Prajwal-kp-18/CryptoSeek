"""
LLM client selection for Vestigo Backend
Supports OpenRouter and OpenAI through the OpenAI-compatible SDK.

Provider choice:
  LLM_PROVIDER=openrouter|openai   explicit choice
  (unset)                          OpenRouter if OPENROUTER_KEY is set, otherwise OpenAI if OPENAI_API_KEY is set
"""

import os
from typing import Optional, Tuple

from openai import OpenAI

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Default model per provider and purpose; env vars override them
DEFAULT_MODELS = {
    "openrouter": {"default": "openai/gpt-4o", "crypto_strings": "perplexity/sonar"},
    "openai": {"default": "gpt-4o", "crypto_strings": "gpt-4o"},
}
MODEL_ENV_VARS = {
    "openrouter": {"default": "OPENROUTER_MODEL", "crypto_strings": "OPENROUTER_CRYPTO_STRINGS_MODEL"},
    "openai": {"default": "OPENAI_MODEL", "crypto_strings": "OPENAI_MODEL"},
}
KEY_ENV_VARS = {"openrouter": "OPENROUTER_KEY", "openai": "OPENAI_API_KEY"}


def resolve_provider() -> Optional[str]:
    """Return the configured provider name, or None if no usable key is set."""
    provider = os.getenv("LLM_PROVIDER", "").strip().lower()
    if provider in KEY_ENV_VARS:
        return provider if os.getenv(KEY_ENV_VARS[provider]) else None
    if os.getenv("OPENROUTER_KEY"):
        return "openrouter"
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    return None


def create_llm_client(purpose: str = "default", api_key: Optional[str] = None) -> Tuple[Optional[OpenAI], Optional[str], Optional[str]]:
    """
    Build an OpenAI-compatible client for the configured provider.

    Returns (client, model, provider); client is None when no key is configured.
    An explicit api_key is used with the resolved provider (OpenRouter if none is configured).
    """
    provider = resolve_provider() or ("openrouter" if api_key else None)
    if provider is None:
        return None, None, None

    key = api_key or os.getenv(KEY_ENV_VARS[provider])
    model = os.getenv(MODEL_ENV_VARS[provider][purpose]) or DEFAULT_MODELS[provider][purpose]

    if provider == "openrouter":
        client = OpenAI(api_key=key, base_url=OPENROUTER_BASE_URL)
    else:
        client = OpenAI(api_key=key)
    return client, model, provider


def missing_key_message() -> str:
    provider = os.getenv("LLM_PROVIDER", "").strip().lower()
    if provider in KEY_ENV_VARS:
        return f"LLM_PROVIDER={provider} but {KEY_ENV_VARS[provider]} is not set"
    return "neither OPENROUTER_KEY nor OPENAI_API_KEY is set"
