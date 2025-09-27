import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: 'Dante Puddu — Pentester Junior',
  description: 'Portfolio de Dante Puddu, Pentester Junior. Explora mis proyectos, juegos y certificaciones.',
  keywords: ['Dante Puddu', 'Pentester', 'Ciberseguridad', 'Portfolio', 'Desarrollo Web', 'Juegos'],
  authors: [{ name: 'Dante Puddu' }],
  creator: 'Dante Puddu',
  openGraph: {
    title: 'Dante Puddu — Portfolio',
    description: 'Portfolio de Dante Puddu, Pentester Junior. Explora mis proyectos, juegos y certificaciones.',
    url: 'https://dantesito.dev',
    siteName: 'Dante Puddu Portfolio',
    images: [
      {
        url: '/images/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Dante Puddu — Portfolio',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dante Puddu — Portfolio',
    description: 'Portfolio de Dante Puddu, Pentester Junior. Explora mis proyectos, juegos y certificaciones en ciberseguridad.',
    images: ['/images/og-image.webp'],
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
  verification: {
    google: 'your-google-verification-code', // TODO: Reemplazar con código real
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#090E14" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={`${inter.className} ${poppins.variable}`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}