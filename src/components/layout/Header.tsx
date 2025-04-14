'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

const navigationItems = [
  { name: 'Ahorrar', href: '/ahorrar' },
  { name: 'Invertir', href: '/invertir', active: true },
  { name: 'Tu día a día', href: '/tu-dia-a-dia' },
  { name: 'Asesoramiento', href: '/asesoramiento' },
  { name: 'Aprender a Invertir', href: '/aprender-a-invertir' },
]

const secondaryNavItems = [
  { name: 'Lo más visto', href: 'https://www.selfbank.es/lo-mas-visto' },
  { name: 'Blog', href: 'https://blog.selfbank.es/' },
  { name: 'Conócenos', href: 'https://www.selfbank.es/conocenos' },
  { name: 'Ayuda', href: '/ayuda' },
]

export default function Header() {
  const [activeItem, setActiveItem] = useState('/invertir')

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <style jsx global>{`
        .nav-link {
          position: relative;
          display: inline-block;
          padding: 26px 0;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 23px;
          left: 50%;
          width: 0;
          height: 3px;
          background: #D1472C;
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }
        
        .nav-link:hover::after {
          width: 100%;
        }
        
        .nav-link.active::after {
          width: 100%;
        }
      `}</style>
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

          {/* Main Navigation */}
          <nav className="flex-1 flex justify-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveItem(item.href)
                }}
                className={`nav-link text-[15px] text-[#D1472C] ${
                  activeItem === item.href ? 'active font-medium' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Secondary Navigation and Actions */}
          <div className="flex items-center space-x-7">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[13px] text-gray-600 dark:text-gray-300 hover:text-[#D1472C]"
              >
                {item.name}
              </Link>
            ))}
            
            <button className="text-gray-600 dark:text-gray-300 hover:text-[#D1472C]">
              <Search className="h-[18px] w-[18px]" />
            </button>

            <ThemeToggle />

            <Link
              href="https://clientes.selfbank.es/conexion"
              className="text-[13px] text-gray-700 dark:text-gray-300 hover:text-[#D1472C] px-4 py-[6px] border border-gray-300 dark:border-gray-700 rounded"
            >
              Área cliente
            </Link>
            <Link
              href="https://clientes.selfbank.es/quiero-ser-cliente"
              className="text-[13px] text-white bg-[#D1472C] px-4 py-[6px] rounded hover:bg-[#B33D25]"
            >
              Hazte cliente
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
} 