# Solar Translate App

A modern translation application powered by Solar LLM with streaming responses and intelligent text chunking.

## Features

- **Real-time Translation**: Stream translations as they're generated
- **Auto-Translate on Copy**: Automatically translates text when copied to clipboard
- **Smart Chunking**: Automatically splits long text (>500 words) into chunks with proper sentence boundaries
- **Multiple Languages**: Support for English, Korean, Spanish, French, German, Japanese, and Chinese
- **Custom Instructions**: Add translation instructions for specific tone, style, or requirements
- **Progress Tracking**: Visual progress indicators for chunked translations
- **Error Handling**: Retry failed chunks individually
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and shadcn/ui

## Setup

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Create `.env.local` file in the root directory:
```
UPSTAGE_API_KEY=your_solar_api_key_here
```

3. Get your Solar API key from [Upstage Console](https://console.upstage.ai/)

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

## Usage

### Basic Translation
1. Navigate to the `/translate` page
2. Select source and target languages
3. Enter text to translate
4. Click "Translate with Solar LLM"

### Long Text Translation
- Text longer than 500 words will be automatically chunked
- Each chunk is translated individually with streaming responses
- You can see progress for each chunk
- Failed chunks can be retried individually

### Auto-Translate on Copy
1. Enable the "Auto-translate copied text" toggle in the header
2. Copy any text to your clipboard (minimum 5 words)
3. The app automatically detects and translates the copied text
4. Perfect for translating content from websites, documents, or other apps

### Custom Instructions
Add translation instructions like:
- "Maintain formal tone"
- "Preserve technical terms"
- "Use casual language"
- "Translate for marketing audience"

## API Endpoints

### POST /api/translate
Translates text using Solar LLM with streaming response.

**Request Body:**
```json
{
  "text": "Text to translate",
  "sourceLang": "en",
  "targetLang": "ko",
  "instructions": "Optional instructions"
}
```

**Response:**
Server-sent events stream with translation chunks.

## Architecture

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **API**: Solar LLM (solar-pro2-preview model)
- **Text Processing**: Custom chunking algorithm with sentence boundary detection
- **Streaming**: Server-sent events for real-time updates

## Files Structure

```
app/
├── api/translate/route.ts     # Solar LLM API integration
├── translate/page.tsx         # Main translation interface
├── layout.tsx                 # App layout with navigation
└── page.tsx                   # Original home page

lib/
└── textChunker.ts            # Text chunking utilities

hooks/
└── useTranslation.ts         # Translation state management

components/
└── TranslationSection.tsx    # Translation UI component
```

## Development

The app uses TypeScript and includes:
- Real-time streaming translations
- Intelligent text chunking
- Error handling and retry logic
- Progress tracking
- Modern React patterns with hooks

## Environment Variables

Create a `.env.local` file with:
```
UPSTAGE_API_KEY=up_*************************0UNK
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

The app can be deployed to Vercel, Netlify, or any platform supporting Next.js.

Make sure to set the `UPSTAGE_API_KEY` environment variable in your deployment environment. 