'use client'

import { useState } from 'react'
import { Upload, FileUp, CheckCircle, AlertCircle } from 'lucide-react'

export default function ExcelUploader() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      setIsUploading(true)
      setUploadStatus('idle')
      setStatusMessage('Procesando archivo...')
      
      // Crear un FormData para enviar el archivo
      const formData = new FormData()
      formData.append('excelFile', file)
      
      // Enviar el archivo al endpoint
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el archivo')
      }
      
      setUploadStatus('success')
      setStatusMessage('Archivo procesado correctamente: ' + result.message)
    } catch (error) {
      console.error('Error processing Excel file:', error)
      setUploadStatus('error')
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Desconocido'}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Subir archivo Excel de fondos</h2>
      
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
        <div className="mb-4">
          <Upload className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-300" />
          <p className="mt-2 text-sm text-gray-600">
            Arrastra y suelta el archivo Excel o haz clic para seleccionarlo
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Solo archivos .xlsx
          </p>
        </div>
        
        <input
          type="file"
          id="excel-upload"
          className="hidden"
          accept=".xlsx"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        
        <label
          htmlFor="excel-upload"
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#D1472C] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
            isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {isUploading ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Procesando...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-5 w-5" />
              Seleccionar archivo
            </>
          )}
        </label>
      </div>
      
      {uploadStatus !== 'idle' && (
        <div className={`mt-4 p-3 rounded ${
          uploadStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center">
            {uploadStatus === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
} 