import Image from 'next/image';
import Link from 'next/link';
import { projects } from '@/data/projects';

// Filtrar solo los juegos
const games = projects.filter(project => project.kind === 'game');

export default function GamesPage() {
  return (
    <>
      {/* Juegos Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-12 flex items-center justify-center mb-20">
        Mis Juegos
        </h1>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => (
              <div key={game.id} className="group relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/10">
                <a
                  href={game.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  aria-label={`Abrir ${game.title} en nueva pestaña`}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={game.image}
                      alt={game.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-medium">
                        Jugar
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Botón para volver al portfolio */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-2xl hover:bg-primary/80 transition-all duration-300 hover:scale-105 shadow-lg"
            aria-label="Volver al portfolio principal"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Portfolio
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Made by Dante Puddu
          </p>
        </div>
      </footer>
    </>
  );
}
