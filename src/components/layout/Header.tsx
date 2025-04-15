'use client'

import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex justify-between items-center h-[72px]">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative w-[220px] h-[60px]">
                <Image
                  src="/images/self_bank.png"
                  alt="SelfBank by Singular Bank"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  className="dark:invert"
                />
              </div>
            </Link>
          </div>

          {/* Espacio central con título */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">Buscador de Fondos de Inversión</h1>
          </div>

          {/* Acciones (ThemeToggle y Administrar datos) */}
          <div className="flex items-center space-x-5">
            <ThemeToggle />

            <Link
              href="/admin/upload"
              className="text-[13px] text-white bg-[#D1472C] px-4 py-[6px] rounded hover:bg-[#B33D25]"
            >
              Administrar datos
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
} 