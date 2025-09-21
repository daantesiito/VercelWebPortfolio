'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Sobre mí', href: '#sobre-mi' },
  { name: 'Mis Proyectos', href: '#proyectos' },
  { name: 'Mis Certificaciones', href: '#certificaciones' },
  { name: 'Contactame', href: '#contacto' },
];

interface HeaderProps {
  hideNavigation?: boolean;
}

export default function Header({ hideNavigation = false }: HeaderProps) {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = navigation.map(item => item.href.substring(1));
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary hover:text-white transition-smooth">
              Dante Puddu
            </Link>
          </div>
          
          {!hideNavigation && (
            <>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleClick(item.href)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                        activeSection === item.href.substring(1)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                      aria-label={`Navegar a ${item.name}`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  className="text-gray-300 hover:text-white p-2"
                  aria-label="Abrir menú de navegación"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}



