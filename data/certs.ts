export type Certification = {
  id: string;
  title: string;
  image: string;
  href: string;
}

export const certifications: Certification[] = [
  {
    id: "ejemplo-cert",
    title: "Certificación de Ejemplo",
    image: "/images/cert-placeholder.svg",
    href: "https://example.com/cert"
  }
  // TODO: Agregar más certificaciones aquí
  // {
  //   id: "otra-cert",
  //   title: "Otra Certificación",
  //   image: "/images/otra-cert.webp",
  //   href: "https://example.com/otra-cert"
  // }
];
