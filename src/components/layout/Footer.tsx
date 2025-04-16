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
    <footer className="bg-[#333333] dark:bg-black text-white w-full">
      <div className="w-full px-6 py-10">
        <div className="text-center mt-6 text-gray-500 dark:text-gray-400 text-xs">
          © {new Date().getFullYear()} SelfBank. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
} 