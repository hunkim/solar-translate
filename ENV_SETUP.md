# Environment Variables Setup

This document explains how to set up the environment variables for Solar Translate.

## Required Environment Variables

### `.env.local` file setup

Create a `.env.local` file in the root directory of your project with the following variables:

```env
# Required: Your Upstage API key
UPSTAGE_API_KEY=your_upstage_api_key_here

# Optional: Model name for translation (defaults to 'solar-pro2')
UPSTAGE_MODEL_NAME=solar-pro2
```

## Available Models

The following models are available for `UPSTAGE_MODEL_NAME`:

- `solar-pro2` (default) - Latest Solar Pro2 model
- `solar-pro2-preview` - Preview version of Solar Pro2
- `solar-mini` - Lightweight Solar model

## Getting Your API Key

1. Go to [Upstage Console](https://console.upstage.ai/)
2. Sign up or log in
3. Create a new API key
4. Copy the API key to your `.env.local` file

## Deployment

For production deployment, make sure to set these environment variables in your deployment platform:

- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Other platforms: Check their documentation for environment variable setup

## Security Note

Never commit your `.env.local` file to version control. It's already included in `.gitignore` for security. 