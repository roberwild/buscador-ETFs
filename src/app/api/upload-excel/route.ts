import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const excelFile = formData.get('excelFile') as File
    
    if (!excelFile) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo' },
        { status: 400 }
      )
    }
    
    // Leer el archivo Excel
    const buffer = await excelFile.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    // Obtener los nombres de las hojas
    const sheetNames = workbook.SheetNames
    
    // Crear y guardar un CSV para cada hoja
    const results = []
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      
      // Convertir la hoja a CSV
      const csvOptions = { 
        FS: ';', // Delimitador de columnas
        RS: '\n', // Delimitador de filas
        blankrows: false,
        strip: true
      }
      
      const csvContent = XLSX.utils.sheet_to_csv(worksheet, csvOptions)
      
      // Nombre del archivo: nombre de la hoja sin espacios y en minúsculas
      const fileName = `datos-${sheetName.toLowerCase().replace(/\s+/g, '-')}.csv`
      const filePath = path.join(process.cwd(), 'src/data', fileName)
      
      // Escribir el archivo CSV
      await fs.writeFile(filePath, csvContent, 'utf8')
      
      results.push({
        sheetName,
        fileName,
        rowCount: csvContent.split('\n').length - 1
      })
    }
    
    return NextResponse.json({
      message: `Se han procesado ${results.length} hojas del Excel`,
      results
    })
    
  } catch (error) {
    console.error('Error processing Excel file:', error)
    return NextResponse.json(
      { error: 'Error al procesar el archivo Excel' },
      { status: 500 }
    )
  }
} 