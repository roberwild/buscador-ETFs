'use client'

import Link from 'next/link'
import Image from 'next/image'

const legalLinks = [
  { name: 'Aviso legal', href: '/aviso-legal' },
  { name: 'Información legal', href: '/informacion-legal' },
  { name: 'Política de cookies', href: '/politica-cookies' },
  { name: 'Política de protección de datos', href: '/politica-proteccion-datos' },
  { name: 'Seguridad', href: '/seguridad' },
  { name: 'Tarifas', href: '/tarifas' },
]

export default function Footer() {
  return (
    <footer className="bg-black text-white py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo and Contact Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-2">
          <div>
            <Image
              src="/images/logo-footer.png"
              alt="Self Bank"
              width={280}
              height={70}
              className="h-12 w-auto mb-2"
              priority
            />
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold mb-0">914 890 888</p>
            <p className="text-gray-400 text-sm mb-0">lunes a viernes de 8:00 a 22:00</p>
            <a 
              href="mailto:informacion@selfbank.es" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              informacion@selfbank.es
            </a>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex justify-end mb-2 space-x-3">
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
        <div className="border-t border-gray-800 pt-2">
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

        {/* Legal Text */}
        <div className="mt-2 text-gray-400 text-[10px]">
          <p className="leading-none">
            Singular Bank, S.A.U. (anteriormente Self Trade Bank S.A.U.) Calle de Goya, 11. 28001 Madrid. 
            Entidad de crédito sujeta a la supervisión del Banco de España e inscrita en el Registro de 
            Entidades de Crédito Nacionales del Banco de España con el número 1490. CIF A-85597821 
            Inscrita en el Registro Mercantil de Madrid, tomo 26409, folio 1, sección 8ª, hoja M-475925, 
            Inscripción 1. Operador de Banca Seguros Vinculado registrado en la Dirección General de Seguros 
            con el número de registro OV0091 mantiene un acuerdo de distribución con CASER, Compañía de 
            Seguros y Reaseguros, S.A., entidad con domicilio en Avenida de Burgos 109, 28050 Madrid, e 
            inscrita en el Registro Mercantil de Madrid, tomo 2245, Folio 179, Hoja M-39662, a través de 
            su agente suscriptor Coventia Legal S.L. con CIF B56685738, sobre seguros de vida: Seguro de 
            vida Self. Puede consultar todas las compañías aseguradoras con las que la entidad mantiene 
            acuerdos de distribución
          </p>
        </div>
      </div>
    </footer>
  )
} 