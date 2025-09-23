import type { Metadata } from 'next';
import Game2048 from './Game2048';
import './styles.css';

export const metadata: Metadata = {
  title: '2048 — dantesito.dev',
  description: 'Juega al clásico juego 2048 con emotes de Twitch. Combina fichas para llegar al OMEGALUL.',
  keywords: ['2048', 'juego', 'twitch', 'emotes', 'dantesito.dev'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '2048 — dantesito.dev',
    description: 'Juega al clásico juego 2048 con emotes de Twitch. Combina fichas para llegar al OMEGALUL.',
    url: 'https://dantesito.dev/games/2048',
    siteName: 'dantesito.dev',
    images: [
      {
        url: '/games/2048/logo.png',
        width: 512,
        height: 512,
        alt: '2048 Game',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
};

export default function Game2048Page() {
  return <Game2048 />;
}
