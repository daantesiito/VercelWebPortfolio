export type Certification = {
  id: string;
  title: string;
  image: string;
  href: string;
}

export const certifications: Certification[] = [
  {
    id: "CIHE",
    title: "Certificación Introduccion al Hacking Ético",
    image: "/images/CIHE.jpg",
    href: "https://www.mastermind.ac/certificates/d47co03d6c"
  }
  // Agregar más certificaciones
  // {
  //   id: "otra-cert",
  //   title: "Otra Certificación",
  //   image: "/images/otra-cert.webp",
  //   href: "https://example.com/otra-cert"
  // }
];
