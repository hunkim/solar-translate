import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Solar Translate - AI-Powered Document Translation',
  description: 'Professional document translation powered by Solar LLM. Upload PDFs, DOCX, images and get accurate translations with page-by-page processing and real-time editing.',
  keywords: [
    'translation',
    'AI translation',
    'document translation',
    'PDF translation',
    'Solar LLM',
    'Upstage',
    'multilingual',
    'Korean translation',
    'English translation',
    'Japanese translation'
  ],
  authors: [{ name: 'Upstage' }],
  creator: 'Upstage',
  publisher: 'Upstage',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://solar-translate.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Solar Translate - AI-Powered Document Translation',
    description: 'Professional document translation powered by Solar LLM. Upload PDFs, DOCX, images and get accurate translations with page-by-page processing.',
    url: 'https://solar-translate.vercel.app',
    siteName: 'Solar Translate',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Solar Translate - AI-Powered Document Translation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solar Translate - AI-Powered Document Translation',
    description: 'Professional document translation powered by Solar LLM. Upload PDFs, DOCX, images and get accurate translations.',
    images: ['/og-image.png'],
    creator: '@upstage_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#7c3aed' },
    ],
  },
  manifest: '/site.webmanifest',
  // Note: Add Google site verification via environment variable: NEXT_PUBLIC_GOOGLE_VERIFICATION
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    },
  }),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="msapplication-TileColor" content="#7c3aed" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
