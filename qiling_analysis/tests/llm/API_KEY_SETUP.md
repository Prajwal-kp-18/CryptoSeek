# OpenAI API Key Setup Guide

## Issue Fixed
The authentication error has been resolved. Two issues were fixed:
1. ✅ Corrected the OpenAI API method from `client.responses.create()` to `client.chat.completions.create()`
2. ✅ Updated the model from invalid `gpt-4.1` to valid `gpt-4o`

## How to Get Your OpenAI API Key

1. **Visit OpenAI Platform**: Go to https://platform.openai.com/account/api-keys
2. **Sign In**: Log in with your OpenAI account
3. **Create New Key**: Click "Create new secret key"
4. **Copy Key**: Copy the key immediately (you won't see it again!)
5. **Set Up Key**: Update the `.env` file

## Update Your API Key

Edit the file: `/home/prajwal/Documents/vestigo-data/qiling_analysis/tests/.env`

Replace the placeholder with your actual key:
```
OPENAI_API_KEY="sk-proj-YOUR_ACTUAL_KEY_HERE"
```

## Alternative: Set Environment Variable

Instead of using `.env` file, you can set it in your shell:

```bash
export OPENAI_API_KEY="sk-proj-YOUR_ACTUAL_KEY_HERE"
```

Add this to your `~/.zshrc` file to make it permanent.

## Verify Setup

Run your script to test:
```bash
cd /home/prajwal/Documents/vestigo-data/qiling_analysis/tests/llm
python engine.py --input your_input_file.txt --out output.json
```

## Available Models

The code now uses `gpt-4o`. You can change to:
- `gpt-4o` - Latest GPT-4 optimized (recommended)
- `gpt-4o-mini` - Faster, cheaper version
- `gpt-4-turbo` - Previous generation
- `gpt-3.5-turbo` - Cheaper, faster, less capable

## Troubleshooting

- **Error 401**: Invalid API key - get a new key from OpenAI
- **Error 429**: Rate limit exceeded - wait or upgrade plan
- **Error 404**: Model not available - check model name
- **Missing key**: Make sure `.env` file is in the correct location

## Cost Considerations

- GPT-4o: ~$5-15 per million tokens (input)
- GPT-3.5-turbo: ~$0.50-1.50 per million tokens
- Check current pricing at: https://openai.com/api/pricing/
