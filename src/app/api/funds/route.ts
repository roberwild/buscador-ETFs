import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { Fund, RiskLevel } from '@/types/fund';

// Función para mapear el nivel de riesgo del CSV a nuestro tipo
function mapRiskLevel(risk: string): RiskLevel {
  const riskNumber = parseInt(risk) || 0;
  
  if (riskNumber === 0) return 'Sin valorar';
  if (riskNumber >= 1 && riskNumber <= 20) return 'Riesgo bajo';
  if (riskNumber >= 21 && riskNumber <= 40) return 'Riesgo moderado';
  if (riskNumber >= 41 && riskNumber <= 60) return 'Riesgo medio-alto';
  if (riskNumber >= 61 && riskNumber <= 80) return 'Riesgo alto';
  if (riskNumber >= 81 && riskNumber <= 99) return 'Riesgo muy alto';
  
  return 'Sin valorar'; // valor por defecto
}

// Función auxiliar para procesar valores numéricos
function parseNumericValue(value: string | undefined): number {
  if (!value) return 0;
  // Reemplazar la coma por punto para el separador decimal
  const cleanValue = value.replace(',', '.').replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanValue) || 0;
}

// Función para leer y procesar el CSV según la fuente de datos
async function getFundsData(dataSource: string = 'fondos-gestion-activa'): Promise<Fund[]> {
  // Determinar qué archivo CSV usar
  let csvFileName = 'datos-fondos.csv'; // Archivo predeterminado (compatible con el código anterior)
  
  if (dataSource === 'fondos-gestion-activa') {
    csvFileName = 'datos-fondos-gestion-activa.csv';
  } else if (dataSource === 'etf-y-etc') {
    csvFileName = 'datos-etf-y-etc.csv';
  } else if (dataSource === 'fondos-indexados') {
    csvFileName = 'datos-fondos-indexados.csv';
  }
  
  // Si no existe el nuevo archivo, usar el predeterminado como fallback
  const csvFilePath = path.join(process.cwd(), 'src/data', csvFileName);
  let fileExists = false;
  
  try {
    await fs.access(csvFilePath);
    fileExists = true;
  } catch (error) {
    console.warn(`Archivo ${csvFileName} no encontrado, usando datos-fondos.csv como fallback`);
    csvFileName = 'datos-fondos.csv';
  }
  
  const finalPath = fileExists 
    ? csvFilePath 
    : path.join(process.cwd(), 'src/data', 'datos-fondos.csv');
  
  const fileContents = await fs.readFile(finalPath, 'utf8');
  
  const { data } = Papa.parse(fileContents, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';'
  });

  // El mapeo de los datos dependerá de la estructura de cada CSV
  if (dataSource === 'etf-y-etc') {
    // Mapeo específico para ETFs (podría tener campos diferentes)
    return data.map((row: any) => {
      // Procesar la URL KIID - intentar diferentes posibles nombres de columna
      let kiidUrl = '';
      
      // Para ETFs, la URL del KIID puede estar en diferentes columnas
      // Intentamos buscar en varias columnas posibles
      const possibleKiidColumns = [
        'URL KID PRIIPS',
        'KID URL', 
        'KIID URL', 
        'URL KIID',
        'URL Documento KIID'
      ];
      
      // También buscamos en todas las columnas para ver si alguna contiene una URL de api.fundinfo.com
      for (const key of Object.keys(row)) {
        const value = row[key];
        if (typeof value === 'string') {
          // Si la columna contiene una URL de Fundinfo, probablemente sea el KIID
          if (value.includes('api.fundinfo.com') && value.includes('.pdf')) {
            kiidUrl = value.startsWith('@') ? value.substring(1) : value;
            break;
          }
        }
      }
      
      // Si aún no encontramos la URL, probamos las columnas específicas
      if (!kiidUrl) {
        for (const colName of possibleKiidColumns) {
          if (row[colName] && typeof row[colName] === 'string') {
            kiidUrl = row[colName].startsWith('@') ? row[colName].substring(1) : row[colName];
            if (kiidUrl) break;
          }
        }
      }
      
      // Debugging para el ISIN específico
      if (row['ISIN'] === 'IE00BNTVVR89') {
        console.log('IE00BNTVVR89 - URL KIID encontrada:', kiidUrl);
        // Mostrar todas las columnas disponibles para este ISIN
        console.log('Columnas disponibles:', Object.keys(row).join(', '));
      }
      
      return {
        isin: row['ISIN'] || '',
        name: row['Nombre'] || '',
        currency: row['Divisa'] || '',
        category: row['Categoria'] || row['Categoria Singular Bank'] || '',
        subcategory: row['Subcategoria'] || row['Categoría Morningstar'] || '',
        management_fee: parseNumericValue(row['Comisión Gestión'] || row['TER']),
        success_fee: parseNumericValue(row['Comisión Exito'] || '0'),
        min_investment: parseNumericValue(row['Mínimo Inicial'] || '0'),
        min_investment_currency: row['Divisa'] || '',
        aum: row['Patrimonio'] || '',
        ytd_return: parseNumericValue(row['Rent YTD']),
        one_year_return: parseNumericValue(row['Rent 12M'] || row['Rent 1Y']),
        three_year_return: parseNumericValue(row['Rent 36M'] || row['Rent 3Y']),
        five_year_return: parseNumericValue(row['Rent 60M'] || row['Rent 5Y']),
        management_company: row['Gestora / Emisor'] || row['Emisor'] || '',
        factsheet_url: row['URL Ficha Comercial'] || row['URL Ficha Comercial '] || '',
        kiid_url: kiidUrl,
        risk_level: mapRiskLevel(row['REQ'] || row['Riesgo'] || ''),
        morningstar_rating: parseInt(row['Morningstar Rating'] || '0'),
        available_for_implicit_advisory: true, // Para ETFs, asumimos que todos están disponibles
        focus_list: row['Focus List'] || 'N', // Añadimos el campo Focus List
      };
    });
  } else {
    // Mapeo original para fondos de gestión activa u otras categorías
    return data.map((row: any) => {
      // Procesar la URL KIID - eliminar @ inicial y asegurar que es una URL válida
      let kiidUrl = '';
      if (row['URL KID PRIIPS']) {
        // Si la URL comienza con @, eliminarlo
        kiidUrl = row['URL KID PRIIPS'].startsWith('@') 
          ? row['URL KID PRIIPS'].substring(1) 
          : row['URL KID PRIIPS'];
      }
      
      return {
        isin: row['ISIN'] || '',
        name: row['Nombre'] || '',
        currency: row['Divisa'] || '',
        category: row['Categoria Singular Bank'] || '',
        subcategory: row['Categoría Morningstar'] || '',
        management_fee: parseNumericValue(row['Comisión Gestión']),
        success_fee: parseNumericValue(row['Comisión Exito']),
        min_investment: parseNumericValue(row['Mínimo Inicial']),
        min_investment_currency: row['Divisa'] || '',
        aum: row['Patrimonio'] || '',
        ytd_return: parseNumericValue(row['Rent YTD']),
        one_year_return: parseNumericValue(row['Rent 12M']),
        three_year_return: parseNumericValue(row['Rent 36M']),
        five_year_return: parseNumericValue(row['Rent 60M']),
        management_company: row['Gestora / Emisor'] || '',
        factsheet_url: row['URL Ficha Comercial'] || row['URL Ficha Comercial '] || '',
        kiid_url: kiidUrl,
        risk_level: mapRiskLevel(row['REQ']),
        morningstar_rating: parseInt(row['Morningstar Rating'] || '0'),
        available_for_implicit_advisory: row['Disponible para asesoramiento con cobro implícito'] === 'Y',
        focus_list: row['Focus List'] || 'N', // Añadimos el campo por consistencia
      };
    });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const currency = searchParams.get('currency') || '';
    const sortBy = searchParams.get('sortBy') || 'ytd_return';
    const riskLevels = searchParams.get('riskLevels') || '';
    const dataSource = searchParams.get('dataSource') || 'fondos-gestion-activa';

    const funds = await getFundsData(dataSource);

    // Aplicar filtros
    let filteredFunds = funds;
    
    if (search) {
      filteredFunds = filteredFunds.filter(fund => 
        fund.isin.toLowerCase() === search.toLowerCase()
      );
    }

    if (category) {
      const categories = category.split(',').filter(Boolean);
      if (categories.length > 0) {
        filteredFunds = filteredFunds.filter(fund => 
          categories.some(cat => 
            fund.category.toLowerCase().startsWith(cat.toLowerCase())
          )
        );
      }
    }

    if (currency) {
      filteredFunds = filteredFunds.filter(fund => 
        fund.currency.toLowerCase() === currency.toLowerCase()
      );
    }

    if (riskLevels) {
      const selectedRiskLevels = riskLevels.split(',').filter(Boolean);
      if (selectedRiskLevels.length > 0) {
        filteredFunds = filteredFunds.filter(fund => 
          selectedRiskLevels.includes(fund.risk_level)
        );
      }
    }

    // Ordenar los fondos
    filteredFunds.sort((a, b) => {
      switch (sortBy) {
        case 'ytd_return':
          return (b.ytd_return || 0) - (a.ytd_return || 0);
        case 'one_year_return':
          return (b.one_year_return || 0) - (a.one_year_return || 0);
        case 'three_year_return':
          return (b.three_year_return || 0) - (a.three_year_return || 0);
        case 'morningstar_rating':
          return (b.morningstar_rating || 0) - (a.morningstar_rating || 0);
        case 'management_fee':
          return (b.management_fee || 0) - (a.management_fee || 0);
        default:
          return (b.ytd_return || 0) - (a.ytd_return || 0);
      }
    });

    // Calcular paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFunds = filteredFunds.slice(startIndex, endIndex);

    return NextResponse.json({
      funds: paginatedFunds,
      total: filteredFunds.length,
      page,
      totalPages: Math.ceil(filteredFunds.length / limit),
      limit
    });
  } catch (error) {
    console.error('Error fetching funds:', error);
    return NextResponse.json(
      { error: 'Error fetching funds' },
      { status: 500 }
    );
  }
} 