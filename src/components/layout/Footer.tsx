'use client'

import Link from 'next/link'
import Image from 'next/image'

const legalLinks = [
  { name: 'Aviso Legal', href: '/aviso-legal' },
  { name: 'Política de Privacidad', href: '/politica-privacidad' },
  { name: 'Política de Cookies', href: '/politica-cookies' },
  { name: 'Información al cliente', href: '/info-cliente' },
  { name: 'MiFID', href: '/mifid' },
  { name: 'Tarifas', href: '/tarifas' },
  { name: 'Tablón de Anuncios', href: '/anuncios' },
  { name: 'Contratos', href: '/contratos' },
];

export default function Footer() {
  return (
    <footer className="bg-[#333333] dark:bg-black text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Sobre nosotros</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Quiénes somos</Link></li>
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Equipo directivo</Link></li>
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Trabaja con nosotros</Link></li>
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Sala de prensa</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Productos</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Cuentas</Link></li>
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Fondos de inversión</Link></li>
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">ETFs</Link></li>
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Planes de pensiones</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Ayuda</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Preguntas frecuentes</Link></li>
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Contacto</Link></li>
              <li><Link href="#" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Seguridad</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <p className="text-gray-300 dark:text-gray-400 mb-2">Teléfono: 91 123 45 67</p>
            <p className="text-gray-300 dark:text-gray-400 mb-2">Email: info@selfbank.es</p>
            <p className="text-gray-300 dark:text-gray-400">Lun-Vie: 9:00-18:00h</p>
          </div>
        </div>
        
        {/* Social Media Icons */}
        <div className="flex justify-end mb-2 space-x-3 mt-8">
          <a href="#" className="text-white hover:text-gray-300">
            <Image
              src="/images/blog-icon.svg"
              alt="Blog"
              width={20}
              height={20}
              className="invert"
            />
          </a>
          <a href="#" className="text-white hover:text-gray-300">
            <Image
              src="/images/linkedin-icon.svg"
              alt="LinkedIn"
              width={20}
              height={20}
              className="invert"
            />
          </a>
          <a href="#" className="text-white hover:text-gray-300">
            <Image
              src="/images/youtube-icon.svg"
              alt="YouTube"
              width={20}
              height={20}
              className="invert"
            />
          </a>
          <a href="#" className="text-white hover:text-gray-300">
            <Image
              src="/images/facebook-icon.svg"
              alt="Facebook"
              width={20}
              height={20}
              className="invert"
            />
          </a>
          <a href="#" className="text-white hover:text-gray-300">
            <Image
              src="/images/twitter-icon.svg"
              alt="Twitter"
              width={20}
              height={20}
              className="invert"
            />
          </a>
        </div>

        {/* Legal Links */}
        <div className="border-t border-gray-800 pt-4 mt-4">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {legalLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-400 hover:text-white text-[10px] transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="text-center mt-6 text-gray-500 dark:text-gray-400 text-xs">
          © {new Date().getFullYear()} SelfBank. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
} 