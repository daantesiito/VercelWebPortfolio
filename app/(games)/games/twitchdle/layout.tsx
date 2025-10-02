import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Twitchdle - Adivina el streamer del día',
  description: 'Adivina el Streamer del día. Juga todos los días para mantener tu racha!',
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
