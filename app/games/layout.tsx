import Header from '@/components/Header';

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header hideNavigation={true} />
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}
