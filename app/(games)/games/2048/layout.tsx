import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '2048 - Juego de números',
  description: 'Juega al clásico juego 2048. Combina números para llegar al 2048!',
  icons: {
    icon: '/games/2048/logo.ico',
    shortcut: '/games/2048/logo.ico',
    apple: '/games/2048/logo.png',
  },
};

export default function Game2048Layout({
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
