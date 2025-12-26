# 🌐 OpenRouter Configuration Guide

OpenRouter provides unified access to 150+ AI models from multiple providers through a single API. This guide explains how to configure and use OpenRouter in The Best Chatbot.

## Table of Contents
- [What is OpenRouter?](#what-is-openrouter)
- [Getting Started](#getting-started)
- [Model Selection](#model-selection)
- [Vision & File Upload Support](#vision--file-upload-support)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

## What is OpenRouter?

OpenRouter aggregates AI models from multiple providers including:
- **OpenAI** (GPT-4, GPT-3.5, etc.)
- **Anthropic** (Claude 3.5, Claude 3, etc.)
- **Google** (Gemini Pro, Gemini Flash, etc.)
- **Meta** (Llama 3.1, Llama 3.2, etc.)
- **Mistral AI** (Mistral Large, Mixtral, etc.)
- **And 100+ more models**

### Benefits
✅ **Single API Key** - Access all models with one key  
✅ **Pay-as-you-go** - Only pay for what you use  
✅ **Dynamic Updates** - New models automatically available  
✅ **Automatic Fallbacks** - Built-in redundancy  
✅ **Usage Analytics** - Track costs and usage

## Getting Started

### 1. Get Your API Key

1. Visit [openrouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Add credits to your account (pay-as-you-go)

### 2. Configure Environment

Add your OpenRouter API key to `.env`:

```dotenv
# OpenRouter - Access to 150+ AI models
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
```

### 3. Restart Application

```bash
# If using Docker
pnpm docker-compose:down
pnpm docker-compose:up

# If running locally
# Stop the app (Ctrl+C) and restart
pnpm start
```

## Model Selection

### Accessing Model Selection

1. Open The Best Chatbot
2. Navigate to **Chat Preferences** (gear icon)
3. Click on **OpenRouter Configuration** tab
4. Browse or search for models

### Selecting Models

The OpenRouter configuration interface allows you to:

- **Search** - Find models by name or provider
- **Filter** - Filter by capabilities (vision, function calling, etc.)
- **Sort** - Sort by pricing, context length, or name
- **Select** - Click checkboxes to select your desired models

### Model Display

Once selected, your models will appear in the chat interface model dropdown with:
- **Human-readable names** (e.g., "GPT-4 Turbo" instead of "openai/gpt-4-turbo")
- **Provider icons** for easy identification
- **Vision indicators** for models that support image input

### Key Features

✨ **Dynamic Model Discovery** - All models from OpenRouter API are available  
✨ **No Hardcoded Limits** - Select any model you want  
✨ **Persistent Selection** - Your choices are saved across sessions  
✨ **Real-time Updates** - New models appear automatically

## Vision & File Upload Support

### Automatic Detection

The system automatically detects which models support vision/image input by querying the OpenRouter API. Models with vision support include:

- GPT-4 Vision, GPT-4 Turbo Vision
- Claude 3.5 Sonnet, Claude 3 Opus
- Gemini Pro Vision, Gemini Flash
- Llama 3.2 Vision
- And many more...

### File Upload Behavior

When you select a vision-capable model:

1. The **"+" file upload button** automatically appears in the chat input
2. You can upload images (PNG, JPEG, WebP, etc.)
3. The AI can analyze and discuss the uploaded images
4. File upload is automatically disabled for non-vision models

### Supported File Types

Vision models typically support:
- **Images**: PNG, JPEG, WebP, GIF
- **Size limits**: Usually 20MB per image
- **Multiple files**: Upload multiple images in one message

### Example Usage

```
User: [uploads architecture diagram]
      Can you explain this system architecture?

AI: Based on the diagram you shared, this appears to be a 
    microservices architecture with the following components...
```

## Advanced Features

### Model Comparison

Compare different models for your use case:

| Feature | GPT-4 Vision | Claude 3.5 Sonnet | Gemini Pro Vision |
|---------|--------------|-------------------|-------------------|
| Context | 128K tokens | 200K tokens | 1M tokens |
| Vision | ✅ | ✅ | ✅ |
| Speed | Medium | Fast | Very Fast |
| Cost | $$$ | $$ | $ |

### Cost Optimization

Tips for managing costs:

1. **Use cheaper models** for simple tasks (e.g., Llama 3.1 8B)
2. **Reserve expensive models** for complex reasoning (e.g., GPT-4, Claude 3.5)
3. **Monitor usage** in your OpenRouter dashboard
4. **Set spending limits** in OpenRouter settings

### Model Context Windows

Different models have different context limits:

- **Standard**: 8K-32K tokens (older models)
- **Extended**: 128K-200K tokens (most modern models)
- **Ultra-large**: 1M+ tokens (Gemini Pro, Claude 3)

Choose based on your conversation length needs.

## Troubleshooting

### Models Not Appearing

**Problem**: Selected models don't show in the dropdown.

**Solutions**:
1. Refresh the page (browser cache)
2. Check that you've saved your selections in preferences
3. Verify your OpenRouter API key is valid
4. Check browser console for errors

### File Upload Not Working

**Problem**: Upload button doesn't appear for vision model.

**Solutions**:
1. Verify the model actually supports vision in OpenRouter docs
2. Clear browser cache and refresh
3. Check that the model is properly selected
4. Try selecting a different vision model to test

### API Errors

**Problem**: Getting errors when using OpenRouter models.

**Solutions**:
1. **"Insufficient credits"**: Add funds to your OpenRouter account
2. **"Invalid API key"**: Check your `.env` file and restart the app
3. **"Model not found"**: The model may have been deprecated
4. **"Rate limit"**: Wait a moment and try again

### Model Performance Issues

**Problem**: Slow responses or timeouts.

**Solutions**:
1. Try a different model (some are faster than others)
2. Check your internet connection
3. Reduce context length if possible
4. Check OpenRouter status page for outages

## Best Practices

### Model Selection Strategy

1. **For coding**: Use Claude 3.5 Sonnet or GPT-4
2. **For analysis**: Use models with large context (Gemini Pro, Claude 3)
3. **For quick tasks**: Use faster, cheaper models (Llama 3.1, Mistral)
4. **For vision**: Use GPT-4 Vision, Claude 3.5, or Gemini Pro Vision

### Security Considerations

⚠️ **Never share your API key**  
⚠️ **Rotate keys periodically**  
⚠️ **Monitor usage for unexpected spikes**  
⚠️ **Use environment variables, never hardcode keys**

### Performance Tips

- **Cache responses** when possible (built-in with The Best Chatbot)
- **Use streaming** for long responses (enabled by default)
- **Batch similar requests** when appropriate
- **Choose models appropriate** to task complexity

## Additional Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Model List](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/models#pricing)
- [OpenRouter Discord](https://discord.gg/openrouter)

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/cgoinglove/better-chatbot/issues)
2. Join our [Discord Community](https://discord.gg/gCRu69Upnp)
3. Contact OpenRouter support for API-specific issues

---

**Happy chatting with 150+ AI models! 🚀**

