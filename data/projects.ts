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
    description: "Juego de física inspirado en Suika Game donde combinas cabezas de streamers para crear otras más grandes. Desarrollado con HTML, CSS y JavaScript.",
    image: "/images/suikaStreamers.jpg",
    href: "https://daantesiito.github.io/suika/",
    kind: "game"
  },
  {
    id: "2048",
    title: "2048",
    description: "Juego de combinar fichas para alcanzar la ficha más alta. Inspirado en el juego 2048. Implementado con HTML, CSS y JavaScript.",
    image: "/images/2048.jpg",
    href: "https://daantesiito.github.io/2048/",
    kind: "game"
  },
  {
    id: "twitchdle",
    title: "Twitchdle",
      description: "Juego de adivinanza inspirado en Wordle pero con streamers de Twitch/Kick. Adivina el streamer descubriendo letras con palabras. Implementado con HTML, CSS y JavaScript.",
    image: "/images/twitchdle.jpg",
    href: "https://daantesiito.github.io/twitchdle/",
    kind: "game"
  },
  {
    id: "desafioalpasto",
    title: "Desafío Al Pasto",
    description: "Proyecto web de una tabla de posiciones para el desafío 'Al Pasto'. Es un desafio de Formula 1 creado por mi para jugar en mi casa con invitados.",
    image: "/images/desafioalpasto.jpg",
    href: "https://daantesiito.github.io/desafioalpasto",
    kind: "external"
  },
  {
    id: "ttstreamersarg",
    title: "TT Streamers Arg",
    description: "Aplicación para agregar en OBS y que los viewers pueda usar voces con inteligencia artificial personalizadas.",
    image: "/images/ttsStreamersArg.jpg",
    href: "https://github.com/daantesiito/TTStreamersArg",
    kind: "external"
  },
  {
    id: "bauloSpeedrunWinterChallenge",
    title: "Baulo Speedrun Winter Challenge",
    description: "Trabajé con Baulo para hacer un evento de speedrun de minecraft en vacaciones de invierno y transmitirlo en Kick.",
    image: "/images/baulowinterspeedrunchallenge.jpg",
    href: "https://baulo-speedrun-challenge.vercel.app/",
    kind: "external"
  }
];