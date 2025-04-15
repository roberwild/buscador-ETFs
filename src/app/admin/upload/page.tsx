'use client'

import { useState } from 'react'
import ExcelUploader from '@/components/ExcelUploader'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export default function UploadPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="ml-36 mt-2">
        <Link 
          href="/"
          className="text-[#D1472C] hover:text-[#B33D25] font-medium"
        >
          ← Volver al Buscador
        </Link>
      </div>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Administración de Datos</h1>
            <p className="text-gray-600 mt-2">
              Sube un archivo Excel con la información de fondos para actualizar la base de datos.
            </p>
          </div>
          
          <ExcelUploader />
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 