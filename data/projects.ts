export type Project = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  kind: "game" | "external";
}

export const projects: Project[] = [
  {
    id: "suika",
    title: "Suika Game",
    description: "Juego de física inspirado en Suika Game donde combinas frutas para crear frutas más grandes. Desarrollado con HTML5 Canvas y JavaScript.",
    image: "/images/suika.svg",
    href: "/games/suika",
    kind: "game"
  },
  {
    id: "2048",
    title: "2048",
    description: "Clásico juego de números donde combinas tiles para alcanzar el número 2048. Implementado con JavaScript vanilla y CSS Grid.",
    image: "/images/2048.svg",
    href: "/games/2048",
    kind: "game"
  },
  {
    id: "twitchdle",
    title: "Twitchdle",
    description: "Juego de adivinanzas inspirado en Wordle pero con streamers de Twitch. Adivina el streamer basándote en pistas visuales.",
    image: "/images/twitchdle.svg",
    href: "/games/twitchdle",
    kind: "game"
  },
  {
    id: "desafioalpasto",
    title: "Desafío Al Pasto",
    description: "Proyecto web interactivo desarrollado para el desafío Al Pasto. Incluye animaciones y efectos visuales modernos.",
    image: "/images/desafioalpasto.svg",
    href: "https://daantesiito.github.io/desafioalpasto",
    kind: "external"
  },
  {
    id: "ttstreamersarg",
    title: "TT Streamers Arg",
    description: "Aplicación para seguir y descubrir streamers argentinos en Twitch. Incluye filtros, búsqueda y estadísticas en tiempo real.",
    image: "/images/ttstreamersarg.svg",
    href: "https://github.com/daantesiito/TTStreamersArg",
    kind: "external"
  }
];

// Mapeo de slugs a URLs para los juegos
export const gameUrls: Record<string, string> = {
  suika: "https://daantesiito.github.io/suika/",
  "2048": "https://daantesiito.github.io/2048/",
  twitchdle: "https://daantesiito.github.io/twitchdle/"
};
