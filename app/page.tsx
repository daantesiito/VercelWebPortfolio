import Image from 'next/image';
import Section from '@/components/Section';
import ProjectCard from '@/components/ProjectCard';
import CertCard from '@/components/CertCard';
import ContactList from '@/components/ContactList';
import { projects } from '@/data/projects';
import { certifications } from '@/data/certs';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <Image
                src="/images/dante-placeholder.svg"
                alt="Dante Puddu"
                fill
                className="rounded-full object-cover border-4 border-primary"
                sizes="128px"
              />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">
              Dante Puddu
            </h1>
            <p className="text-xl sm:text-2xl text-primary mb-6">
              Pentester Junior
            </p>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {/* TODO: Reemplazar con descripción personal real */}
              Apasionado por la ciberseguridad y el desarrollo web. Especializado en testing de penetración 
              y desarrollo de aplicaciones seguras. Siempre aprendiendo nuevas tecnologías y metodologías 
              para mejorar la seguridad digital.
            </p>
          </div>
        </div>
      </section>

      {/* Sobre Mi Section */}
      <Section id="sobre-mi" title="Sobre Mí" subtitle="Conoce más sobre mi experiencia y pasiones">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Mi Historia</h3>
                <p className="text-gray-300 leading-relaxed">
                  {/* TODO: Personalizar con historia real */}
                  Soy Dante Puddu, un pentester junior apasionado por la ciberseguridad. 
                  Mi interés en la seguridad digital comenzó durante mis estudios y se ha 
                  convertido en mi carrera profesional. Me especializo en identificar 
                  vulnerabilidades y ayudar a las organizaciones a fortalecer su seguridad.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Habilidades</h3>
                <div className="flex flex-wrap gap-2">
                  {['Penetration Testing', 'Web Security', 'Network Security', 'JavaScript', 'Python', 'Linux'].map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square relative">
                <Image
                  src="/images/dante-about.svg"
                  alt="Dante Puddu trabajando"
                  fill
                  className="rounded-2xl object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Proyectos Section */}
      <Section id="proyectos" title="Mis Proyectos" subtitle="Explora mis juegos y proyectos de desarrollo">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </Section>

      {/* Certificaciones Section */}
      <Section id="certificaciones" title="Mis Certificaciones" subtitle="Certificaciones y logros profesionales">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {certifications.map((cert) => (
            <CertCard key={cert.id} certification={cert} />
          ))}
        </div>
        {certifications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {/* TODO: Agregar certificaciones reales */}
              Próximamente: Mis certificaciones profesionales
            </p>
          </div>
        )}
      </Section>

      {/* Contacto Section */}
      <Section id="contacto" title="Contactame" subtitle="Conectemos y trabajemos juntos">
        <ContactList />
      </Section>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Dante Puddu. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </>
  );
}
