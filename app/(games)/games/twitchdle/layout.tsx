import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Twitchdle - Adivina el streamer del día',
  description: 'Adivina el Streamer del día. Juga todos los días para mantener tu racha!',
  icons: {
    icon: '/games/twitchdle/media/twitchLogo.png',
    shortcut: '/games/twitchdle/media/twitchLogo.png',
    apple: '/games/twitchdle/media/twitchLogo.png',
  },
};

export default function TwitchdleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
