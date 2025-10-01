import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Twitchdle - Adivina la palabra del día',
  description: 'Adivina la palabra del día relacionada con Twitch y el streaming. ¡Juega todos los días y mantén tu racha!',
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
