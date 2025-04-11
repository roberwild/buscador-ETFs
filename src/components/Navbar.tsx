'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AhorrarModal from './AhorrarModal';

export default function Navbar() {
  const [isAhorrarModalOpen, setIsAhorrarModalOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center flex-1">
            <Link href="/" className="flex-shrink-0 pl-8">
              <Image
                src="/images/logo.png"
                alt="SelfBank"
                width={200}
                height={70}
                className="h-14 w-auto"
                priority
              />
            </Link>
            <div className="hidden md:flex md:ml-16 space-x-12">
              <button
                onClick={() => setIsAhorrarModalOpen(true)}
                type="button"
                className="text-[#E31837] text-base font-medium relative group py-2"
              >
                Ahorrar
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#E31837] group-hover:w-full transition-all duration-300 ease-out -translate-x-1/2" />
              </button>
              <Link
                href="/invertir"
                className="text-[#E31837] text-base font-medium relative group py-2"
              >
                Invertir
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#E31837] group-hover:w-full transition-all duration-300 ease-out -translate-x-1/2" />
              </Link>
              <Link
                href="/tu-dia-a-dia"
                className="text-[#E31837] text-base font-medium relative group py-2"
              >
                Tu día a día
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#E31837] group-hover:w-full transition-all duration-300 ease-out -translate-x-1/2" />
              </Link>
              <Link
                href="/asesoramiento"
                className="text-[#E31837] text-base font-medium relative group py-2"
              >
                Asesoramiento
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#E31837] group-hover:w-full transition-all duration-300 ease-out -translate-x-1/2" />
              </Link>
              <Link
                href="/aprender-a-invertir"
                className="text-[#E31837] text-base font-medium relative group py-2"
              >
                Aprender a Invertir
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#E31837] group-hover:w-full transition-all duration-300 ease-out -translate-x-1/2" />
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-6 pr-8">
            <button className="text-gray-700 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            <Link
              href="https://clientes.selfbank.es/conexion"
              className="text-gray-700 px-3 py-2 text-sm font-medium hover:text-gray-900"
            >
              Área cliente
            </Link>
            <Link
              href="https://clientes.selfbank.es/quiero-ser-cliente"
              className="bg-[#E31837] text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-[#c41530] transition-colors"
            >
              Hazte cliente
            </Link>
          </div>
        </div>
      </div>

      <AhorrarModal
        isOpen={isAhorrarModalOpen}
        onClose={() => setIsAhorrarModalOpen(false)}
      />
    </header>
  );
} 