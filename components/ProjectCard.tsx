import Link from 'next/link';
import Image from 'next/image';
import { Project } from '@/data/projects';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const isExternal = project.kind === 'external';
  
  const cardContent = (
    <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/10">
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-medium">
            {isExternal ? 'Ver Proyecto' : 'Jugar'}
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          {project.description}
        </p>
      </div>
    </div>
  );

  // Todos los proyectos se abren en nueva pestaña
  return (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      aria-label={`Abrir ${project.title} en nueva pestaña`}
    >
      {cardContent}
    </a>
  );
}



