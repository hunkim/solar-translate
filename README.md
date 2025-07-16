# Solar Translate ☀️

**AI-Powered Document Translation with Page-by-Page Processing**

A professional translation application powered by Solar LLM and Upstage Document Parse API, featuring intelligent document processing, real-time translation, and multi-page management.

![Solar Translate](public/og-image.svg)

## ✨ Features

### 🚀 **Core Functionality**
- **Multi-Format Support**: Upload PDFs, DOCX, images (JPEG, PNG, BMP, TIFF, HEIC), and text files
- **Page-by-Page Processing**: Intelligent page detection and content placement
- **Sequential Auto-Translation**: Automatic translation starting from page 1
- **Real-Time Editing**: Edit translations with live preview
- **Smart Text Chunking**: Handles long documents with intelligent segmentation

### 🌍 **Translation Features**
- **Multi-Language Support**: English, Korean, Japanese
- **Custom Instructions**: Set translation tone and style preferences
- **Context Preservation**: Maintains formatting, structure, and technical terms
- **Batch Processing**: Translate multiple pages simultaneously
- **Progress Tracking**: Detailed upload and translation progress indicators

### 📱 **User Experience**
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Progress Indicators**: "Uploading → Processing → Extracting → Translating"
- **Toast Notifications**: Real-time feedback and status updates
- **Mobile Optimized**: Works seamlessly on all devices
- **PWA Ready**: Progressive Web App capabilities

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.2.4, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI/ML**: Solar LLM API, Upstage Document Parse API
- **File Processing**: Multi-format document parsing
- **State Management**: React hooks and context
- **Deployment**: Vercel-ready with comprehensive SEO

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Upstage API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/solar-translate-app.git
cd solar-translate-app

# Install dependencies
pnpm install

# Create .env.local file in the root directory
# Add your UPSTAGE_API_KEY to .env.local
# Also add UPSTAGE_MODEL_NAME to specify the model (optional)

# Example structure:
# projectname/
# ├── .env.local          # ← Add your environment variables here
# ├── README.md
# ├── package.json
# └── ...

# Add these to your .env.local file:
UPSTAGE_API_KEY=your_upstage_api_key_here
UPSTAGE_MODEL_NAME=solar-pro2  # Optional, defaults to 'solar-pro2'

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

```env
# Required
UPSTAGE_API_KEY=your_upstage_api_key_here

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Rate Limiting (Optional - protects against API abuse)
TRANSLATE_RATE_LIMIT=160                   # Max translations per hour (default: 160)
UPLOAD_RATE_LIMIT=40                       # Max uploads per hour (default: 40)
```

### Rate Limiting
The app includes built-in rate limiting to prevent API abuse:
- **Translation API**: 160 requests per hour per IP
- **Upload API**: 40 requests per hour per IP
- **Configurable**: Adjust limits via environment variables
- **User-Friendly**: Clear error messages with wait times when limits are reached

## 📖 Usage Guide

### 1. **Upload Documents**
- Click the "Upload" button
- Select PDF, DOCX, or image files (max 50MB)
- Watch the progress: Uploading → Processing → Extracting

### 2. **Review Content**
- Content automatically placed in correct pages
- Each page shows extracted text with page numbers
- Long documents are intelligently chunked

### 3. **Set Translation Preferences**
- Click "Translation Instructions" to expand settings
- Choose target language (English, Korean, Japanese)
- Add custom instructions for tone and style
- Select translation model

### 4. **Auto-Translation**
- Pages with substantial content auto-translate sequentially
- Watch real-time translation progress
- Edit translations directly in the interface

### 5. **Manage Results**
- Copy individual pages or all content
- Clear specific pages or entire document
- Add/remove pages as needed
- Retranslate with different settings

## 🏗️ Architecture

### API Endpoints

#### `/api/upload`
- Handles file uploads and document parsing
- Integrates with Upstage Document Parse API
- Returns page-based content structure
- Supports multiple file formats

#### `/api/translate`
- Processes translation requests
- Uses Solar LLM for high-quality translations
- Supports streaming responses
- Handles context and custom instructions

### Key Components

- **`app/page.tsx`**: Main application interface
- **`components/TranslationSection.tsx`**: Translation UI components
- **`hooks/useTranslation.ts`**: Translation logic and state management
- **`lib/textChunker.ts`**: Smart text segmentation utilities

## 🔧 Configuration

### Translation Models
```typescript
const translationModels = [
  { value: "solar-1-mini-translate", label: "Solar 1 Mini Translate (Fast)" },
  { value: "solar-1-mini-chat", label: "Solar 1 Mini Chat (Balanced)" },
  { value: "solar-pro", label: "Solar Pro (Premium)" }
]
```

### Supported File Types
- **Documents**: PDF, DOCX, TXT
- **Images**: JPEG, PNG, BMP, TIFF, HEIC
- **Size Limit**: 50MB per file

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy to Vercel

```bash
npm i -g vercel
vercel
```

### Environment Setup
1. Set `UPSTAGE_API_KEY` in your deployment platform
2. Update domain references in `app/layout.tsx`
3. Generate favicon files (see deployment guide)

## 🧪 Testing

The application includes comprehensive testing with Playwright:

```bash
# Run tests
npm run test

# Run tests in headed mode
npm run test:headed
```

## 📊 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **Core Web Vitals**: Optimized for LCP, FID, CLS
- **Bundle Size**: Optimized with Next.js automatic code splitting
- **API Response**: Streaming for real-time translation feedback

## 🔒 Security

- **API Key Protection**: Server-side API calls only
- **File Validation**: Strict file type and size checking
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Sanitization**: XSS protection for user inputs

## 🔗 Important Links

### 🔑 **Get Started**
- **Solar API Key**: Get your API key at [Upstage Console](https://console.upstage.ai/)
- **Feedback & Issues**: Report bugs or request features at [GitHub Issues](https://github.com/hunkim/solar-translate/issues)

### 🏢 **Enterprise & Private Use**
For private, internal use of this translation service, please contact us at [Upstage Homepage](https://upstage.ai)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support & Contact

- **Issues & Feedback**: [GitHub Issues](https://github.com/hunkim/solar-translate/issues)
- **API Documentation**: [Upstage Console](https://console.upstage.ai/)
- **Enterprise Inquiries**: [Upstage Homepage](https://upstage.ai)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Upstage**: For providing Solar LLM and Document Parse APIs
- **Vercel**: For Next.js framework and deployment platform
- **shadcn/ui**: For beautiful, accessible UI components
- **Tailwind CSS**: For utility-first styling

## 📞 Support

- **Documentation**: Check the [deployment guide](DEPLOYMENT.md)
- **Issues**: Report bugs via GitHub Issues
- **API Support**: Contact Upstage for API-related questions

---

**Built with ❤️ using Solar LLM**

*Transform your documents with AI-powered translation* 