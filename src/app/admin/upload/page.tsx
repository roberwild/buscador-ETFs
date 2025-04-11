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
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Administración de Datos</h1>
            <p className="text-gray-600 mt-2">
              Sube un archivo Excel con la información de fondos para actualizar la base de datos.
            </p>
          </div>
          
          <ExcelUploader />
          
          <div className="mt-8">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Volver al Buscador
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 