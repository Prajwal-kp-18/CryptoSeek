# OpenRouter API Key Setup Guide

`engine.py` calls the LLM through [OpenRouter](https://openrouter.ai) using the
OpenAI-compatible SDK (`base_url="https://openrouter.ai/api/v1"`).

## How to Get Your OpenRouter API Key

1. **Visit OpenRouter**: Go to https://openrouter.ai/keys
2. **Sign In**: Log in with your OpenRouter account
3. **Create New Key**: Click "Create Key"
4. **Copy Key**: Copy the key immediately (you won't see it again!)
5. **Set Up Key**: Update the `.env` file

## Update Your API Key

Edit the file: `qiling_analysis/tests/.env`

Replace the placeholder with your actual key:
```
OPENROUTER_KEY="sk-or-YOUR_ACTUAL_KEY_HERE"
```

## Alternative: Set Environment Variable

Instead of using `.env` file, you can set it in your shell:

```bash
export OPENROUTER_KEY="sk-or-YOUR_ACTUAL_KEY_HERE"
```

Add this to your shell profile to make it permanent.

## Verify Setup

Run your script to test:
```bash
cd qiling_analysis/tests/llm
python engine.py --input your_input_file.txt --out output.json
```

## Available Models

The code uses `openai/gpt-4o` by default. Override with `OPENROUTER_MODEL`, e.g.:
- `openai/gpt-4o` - GPT-4o (default, recommended)
- `openai/gpt-4o-mini` - Faster, cheaper version
- Any other id from https://openrouter.ai/models

## Troubleshooting

- **Error 401**: Invalid API key - create a new key at https://openrouter.ai/keys
- **Error 402**: Out of credits - top up at https://openrouter.ai/settings/credits
- **Error 429**: Rate limit exceeded - wait and retry
- **Error 404**: Model not available - check the model id on https://openrouter.ai/models
- **Missing key**: Make sure `.env` file is in the correct location

## Cost Considerations

- Check current per-model pricing at: https://openrouter.ai/models
