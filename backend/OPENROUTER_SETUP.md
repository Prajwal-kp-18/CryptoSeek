# OpenRouter API Key Setup for LLM Integration

All LLM calls in the backend go through [OpenRouter](https://openrouter.ai) using the
OpenAI-compatible SDK (`base_url="https://openrouter.ai/api/v1"`).

## Quick Setup

### 1. Get an OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up or log in
3. Navigate to https://openrouter.ai/keys
4. Create a new key
5. Copy the key (starts with `sk-or-`)

### 2. Configure Backend

Create or edit `backend/.env`:

```bash
# LLM Configuration
OPENROUTER_KEY=sk-or-your-actual-key-here
OPENROUTER_MODEL=openai/gpt-4o
```

### 3. Install Dependencies

```bash
cd backend
pip install openai   # OpenAI SDK is used as the OpenRouter client
# Or install all requirements:
pip install -r requirements.txt
```

### 4. Restart Backend

```bash
cd backend
uvicorn main:app --reload
```

### 5. Verify Integration

Check logs for:
```
[INFO] LLMAnalysisService initialized with OpenRouter API
[INFO] LLM Model: openai/gpt-4o
```

## Models Used

| Service | Env override | Default model |
|---------|--------------|---------------|
| `services/llm_analysis_service.py` (strace analysis) | `OPENROUTER_MODEL` | `openai/gpt-4o` |
| `services/llm_crypto_analyzer.py` (crypto strings, hard targets) | `OPENROUTER_CRYPTO_STRINGS_MODEL` | `perplexity/sonar` |

Any model id from https://openrouter.ai/models can be used, e.g. `openai/gpt-4o-mini`
(cheaper) or `anthropic/claude-sonnet-4.5`.

## Cost Information

See per-model pricing at https://openrouter.ai/models.

**Per Binary Analysis** (strace analysis):
- Input tokens: ~1,000-5,000 (strace log)
- Output tokens: ~300-800 (classification)

## Without API Key

The system works fine without an API key:
- LLM analysis will be **disabled**
- Qiling, Ghidra, and GNN analyses still run
- Job JSON will show `llm_analysis_results.status: "disabled"`

## Security Notes

⚠️ **Important**:
- Keep your API key secret
- Add `.env` to `.gitignore`
- Don't commit API keys to git
- Rotate keys if exposed
- Set credit limits on the key in the OpenRouter dashboard

## Troubleshooting

### "LLM analysis disabled (no API key)"
✅ Check `.env` file exists in `backend/` directory  
✅ Verify `OPENROUTER_KEY` is set correctly  
✅ Restart backend server  

### "OpenRouter API call failed: 401 Unauthorized"
✅ API key is invalid or revoked  
✅ Create a new key at https://openrouter.ai/keys  

### "OpenRouter API call failed: 402 Payment Required"
✅ Out of credits — top up at https://openrouter.ai/settings/credits  

### "OpenRouter API call failed: 429 Rate limit"
✅ Too many requests  
✅ Wait, or check https://openrouter.ai/activity  

### "Import 'openai' could not be resolved"
✅ Install package: `pip install openai`  

## Testing

Test with a simple curl after setup:

```bash
# Upload a binary
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@test_binary.elf"

# Get job status (wait a few seconds)
curl http://localhost:8000/api/jobs/<job_id>

# Check for llm_analysis_results in response
```

## Environment Variables Reference

```bash
# Required
OPENROUTER_KEY=sk-or-your-key-here

# Optional
OPENROUTER_MODEL=openai/gpt-4o                     # Default: openai/gpt-4o
OPENROUTER_CRYPTO_STRINGS_MODEL=perplexity/sonar   # Default: perplexity/sonar
```

## Sample .env File

```bash
# Database
DATABASE_URL="postgresql://..."

# LLM Configuration
OPENROUTER_KEY=sk-or-v1-abcdefghijklmnopqrstuvwxyz1234567890
OPENROUTER_MODEL=openai/gpt-4o

# Other backend configs...
```

## Monitoring Usage

Check the OpenRouter dashboard:
- https://openrouter.ai/activity
- View costs per model/day
- Set per-key credit limits

## Support

For issues:
1. Check backend logs: `backend/logs/`
2. Review `LLM_INTEGRATION.md`
3. Test with simple binary
4. Verify API key is active
