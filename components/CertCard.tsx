import Image from 'next/image';
import { Certification } from '@/data/certs';

interface CertCardProps {
  certification: Certification;
}

export default function CertCard({ certification }: CertCardProps) {
  return (
    <a
      href={certification.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/10"
      aria-label={`Ver certificación ${certification.title}`}
    >
      <div className="aspect-square relative overflow-hidden">
        <Image
          src={certification.image}
          alt={certification.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors text-center">
          {certification.title}
        </h3>
      </div>
    </a>
  );
}



