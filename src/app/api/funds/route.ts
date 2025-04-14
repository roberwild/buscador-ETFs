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

// Función para normalizar los valores de focus_list
function normalizeFocusList(value: string | undefined): string {
  if (!value) return 'N';
  
  try {
    // Eliminar caracteres no imprimibles y espacios
    // Convertir a cadena, eliminar espacios y convertir a mayúsculas
    let normalized = value.toString()
                        .replace(/\s+/g, '')       // Eliminar todos los espacios
                        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Eliminar caracteres de control
                        .trim()
                        .toUpperCase();
    
    // Depuración - registrar lo que estamos procesando
    console.log(`Valor original: "${value}", Normalizado: "${normalized}"`);
    
    // Convertir a Y/N para estandarizar
    if (['Y', 'S', 'SI', 'SÍ', 'YES', 'TRUE', '1'].includes(normalized)) {
      return 'Y';
    } else {
      return 'N';
    }
  } catch (error) {
    console.error(`Error al normalizar focus_list: ${error}, valor: ${value}`);
    return 'N'; // En caso de error, asumimos 'N'
  }
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
  
  // Para depuración, mostrar las primeras líneas del CSV
  console.log(`Primeras líneas del CSV ${csvFileName}:`);
  console.log(fileContents.split('\n').slice(0, 3).join('\n'));
  
  const { data } = Papa.parse(fileContents, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';',
    transformHeader: function(header) {
      // Conservar el header exactamente como está en el CSV
      return header.trim();
    }
  });

  // Verificar que hay datos
  if (!data || data.length === 0) {
    console.error(`No se pudieron cargar datos del archivo ${csvFileName}`);
    return [];
  }
  
  console.log(`Se han cargado ${data.length} registros del archivo ${csvFileName}`);

  // El mapeo de los datos dependerá de la estructura de cada CSV
  if (dataSource === 'etf-y-etc') {
    // Mostrar los nombres de las columnas para depuración
    if (data.length > 0) {
      console.log('Nombres de columnas en ETF:', Object.keys(data[0]));
      console.log('Primera fila de datos ETF:', data[0]);
    }
    
    // Mapeo específico para ETFs (podría tener campos diferentes)
    return data.map((row: any, index) => {
      // En las primeras filas, registrar los valores exactos para depuración
      if (index < 3) {
        console.log(`Fila ${index} valores:`, row);
      }
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
      
      // En ETFs, el valor "Focus list" es exactamente como aparece en el CSV (con l minúscula)
      let focusList = 'N'; // Valor por defecto
      
      // Verificamos directamente si existe la columna "Focus list" (nombre exacto del CSV)
      if (row['Focus list'] !== undefined) {
        console.log(`Encontrada columna 'Focus list' con valor: '${row['Focus list']}'`);
        focusList = normalizeFocusList(row['Focus list']);
      } 
      // Si no, intentamos otras variantes
      else {
        // Posibles nombres para la columna Focus List
        const possibleFocusListColumns = [
          'Focus List', 'FocusList', 'FOCUS LIST', 
          'Focus_list', 'focus_list', 'focus-list'
        ];
        
        // Buscar en todas las columnas posibles
        for (const colName of possibleFocusListColumns) {
          if (row[colName] !== undefined) {
            console.log(`Encontrada columna alternativa '${colName}' con valor: '${row[colName]}'`);
            focusList = normalizeFocusList(row[colName]);
            break;
          }
        }
        
        // Si todavía no encontramos, buscar columnas que puedan contener Y/N
        if (focusList === 'N') {
          for (const key of Object.keys(row)) {
            const value = row[key];
            if (typeof value === 'string' && ['Y', 'N'].includes(value.trim().toUpperCase())) {
              // Si es la primera columna, asumimos que es Focus List
              if (Object.keys(row).indexOf(key) === 0) {
                console.log(`Usando primera columna '${key}' con valor '${value}' como Focus List`);
                focusList = normalizeFocusList(value);
                break;
              }
            }
          }
        }
      }
      
      return {
        isin: row['ISIN'] || '',
        name: row['Nombre'] || '',
        currency: row['Divisa'] || '',
        category: row['Categoria'] || row['Categoría Singular Bank'] || '',
        subcategory: row['Subcategoria'] || row['Categoría Morningstar'] || '',
        compartment_code: row['Código de compartimento'] || '',
        available_for_implicit_advisory: true, // Para ETFs, asumimos que todos están disponibles
        available_for_explicit_advisory: true, // Para ETFs, asumimos que todos están disponibles
        hedge: row['Hedge'] || 'N', // Valor por defecto: N
        management_fee: parseNumericValue(row['Comisión Gestión'] || row['TER'] || row['Gastos corrientes (%)']),
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
        focus_list: focusList,
      };
    });
  } else if (dataSource === 'fondos-indexados') {
    // Mapeo para fondos indexados, con Focus List en la cuarta posición
    return data.map((row: any) => {
      // Procesar la URL KIID - eliminar @ inicial y asegurar que es una URL válida
      let kiidUrl = '';
      if (row['URL KID PRIIPS']) {
        // Si la URL comienza con @, eliminarla
        kiidUrl = row['URL KID PRIIPS'].startsWith('@') 
          ? row['URL KID PRIIPS'].substring(1) 
          : row['URL KID PRIIPS'];
      }
      
      return {
        isin: row['ISIN'] || '',
        name: row['Nombre'] || '',
        currency: row['Divisa'] || '',
        category: row['Categoria SB'] || '',
        subcategory: row['Categoría Morningstar'] || '',
        compartment_code: row['Código de compartimento'] || '',
        available_for_implicit_advisory: row['Disponible para asesoramiento con cobro implícito'] === 'Y',
        available_for_explicit_advisory: row['Disponible para asesoramiento con cobro explícito'] === 'Y',
        hedge: row['Hedge'] || 'N', // Valor por defecto: N
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
        focus_list: normalizeFocusList(row['Focus List']),
      };
    });
  } else {
    // Fondos de gestión activa u otras categorías, con Focus List en la tercera posición
    return data.map((row: any) => {
      // Procesar la URL KIID - eliminar @ inicial y asegurar que es una URL válida
      let kiidUrl = '';
      if (row['URL KID PRIIPS']) {
        // Si la URL comienza con @, eliminarla
        kiidUrl = row['URL KID PRIIPS'].startsWith('@') 
          ? row['URL KID PRIIPS'].substring(1) 
          : row['URL KID PRIIPS'];
      }
      
      return {
        isin: row['ISIN'] || '',
        name: row['Nombre'] || '',
        currency: row['Divisa'] || '',
        category: row['Categoria SB'] || '',
        subcategory: row['Categoría Morningstar'] || '',
        compartment_code: row['Código de compartimento'] || '',
        available_for_implicit_advisory: row['Disponible para asesoramiento con cobro implícito'] === 'Y',
        available_for_explicit_advisory: row['Disponible para asesoramiento con cobro explícito'] === 'Y',
        hedge: row['Hedge'] || 'N', // Valor por defecto: N
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
        focus_list: normalizeFocusList(row['Focus List']),
      };
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const currency = searchParams.get('currency') || '';
  const sortBy = searchParams.get('sortBy') || '';
  const riskLevels = searchParams.get('riskLevels') || '';
  const dataSource = searchParams.get('dataSource') || 'fondos-gestion-activa';
  const focusListFilter = searchParams.get('focusListFilter') || 'Todos';
  const implicitAdvisoryFilter = searchParams.get('implicitAdvisoryFilter') || 'Todos';
  const explicitAdvisoryFilter = searchParams.get('explicitAdvisoryFilter') || 'Todos';
  const hedgeFilter = searchParams.get('hedgeFilter') || 'Todos';

  try {
    // Obtener y procesar todos los fondos
    let allFunds = await getFundsData(dataSource);

    // Aplicar el filtro de búsqueda
    if (search) {
      allFunds = allFunds.filter(fund => 
        fund.isin.toLowerCase() === search.toLowerCase()
      );
    }

    // Aplicar filtro de categoría
    if (category) {
      const categories = category.split(',').filter(Boolean);
      if (categories.length > 0) {
        allFunds = allFunds.filter(fund => 
          categories.some(cat => 
            fund.category.toLowerCase().startsWith(cat.toLowerCase())
          )
        );
      }
    }

    // Aplicar filtro de divisa
    if (currency) {
      allFunds = allFunds.filter(fund => 
        fund.currency.toLowerCase() === currency.toLowerCase()
      );
    }

    // Aplicar filtro de nivel de riesgo
    if (riskLevels) {
      const selectedRiskLevels = riskLevels.split(',').filter(Boolean);
      if (selectedRiskLevels.length > 0) {
        allFunds = allFunds.filter(fund => 
          selectedRiskLevels.includes(fund.risk_level)
        );
      }
    }

    // Aplicar filtro de Focus List
    if (focusListFilter !== 'Todos') {
      const isInFocusList = focusListFilter === 'Sí';
      allFunds = allFunds.filter(fund => 
        (fund.focus_list === 'Y') === isInFocusList
      );
    }
    
    // Aplicar filtro de asesoramiento con cobro implícito
    if (implicitAdvisoryFilter !== 'Todos') {
      const isImplicitAdvisory = implicitAdvisoryFilter === 'Sí';
      allFunds = allFunds.filter(fund => 
        fund.available_for_implicit_advisory === isImplicitAdvisory
      );
    }
    
    // Aplicar filtro de asesoramiento con cobro explícito
    if (explicitAdvisoryFilter !== 'Todos') {
      const isExplicitAdvisory = explicitAdvisoryFilter === 'Sí';
      allFunds = allFunds.filter(fund => 
        fund.available_for_explicit_advisory === isExplicitAdvisory
      );
    }

    // Aplicar filtro de hedge
    if (hedgeFilter !== 'Todos') {
      const isHedged = hedgeFilter === 'Sí';
      allFunds = allFunds.filter(fund => 
        (fund.hedge === 'Y') === isHedged
      );
    }

    // Ordenar los fondos
    allFunds.sort((a, b) => {
      switch (sortBy) {
        case 'ytd_return':
          return (b.ytd_return || 0) - (a.ytd_return || 0);
        case 'one_year_return':
          return (b.one_year_return || 0) - (a.one_year_return || 0);
        case 'three_year_return':
          return (b.three_year_return || 0) - (a.three_year_return || 0);
        case 'management_fee':
          return (b.management_fee || 0) - (a.management_fee || 0);
        default:
          return (b.ytd_return || 0) - (a.ytd_return || 0);
      }
    });

    // Calcular paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFunds = allFunds.slice(startIndex, endIndex);

    return NextResponse.json({
      funds: paginatedFunds,
      total: allFunds.length,
      page,
      totalPages: Math.ceil(allFunds.length / limit),
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