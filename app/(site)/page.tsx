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
                src="/images/perfil.jpeg"
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
              Junior Pentester / Junior Developer
            </p>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Apasionado por la ciberseguridad. Aprendiendo programacion web con proyectos y trabajos pequeños.
            </p>
          </div>
        </div>
      </section>

      {/* Sobre Mi Section */}
      <Section id="sobre-mi" title="Sobre Mí" subtitle="">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-8">
            <div>
              <p className="text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Soy Dante Puddu, tengo 21 años y soy de Argentina. Soy un pentester junior apasionado por la ciberseguridad. 
                Actualmente estoy en 3er año de Licenciatura en Informatica en la UNLP.
                Mi interés en la seguridad comenzó durante mis estudios y me metí de lleno gracias a cursos web.
                Mi hobby es el jetski y compito en carreras de este deporte.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">Habilidades</h3>
              <div className="flex flex-wrap gap-2 justify-center">
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
        </div>
      </Section>

      {/* Proyectos Section */}
      <Section id="proyectos" title="Mis Proyectos" subtitle="">
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
            </p>
          </div>
        )}
      </Section>

      {/* Contacto Section */}
      <Section id="contacto" title="Contactame" subtitle="">
        <ContactList />
      </Section>

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
