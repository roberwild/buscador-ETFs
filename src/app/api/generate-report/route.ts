import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { funds } = await request.json();
    
    if (!funds || !Array.isArray(funds) || funds.length === 0) {
      return NextResponse.json(
        { error: 'No funds provided or invalid format' },
        { status: 400 }
      );
    }

    // Limit number of funds to process (to avoid overloading)
    const fundsToProcess = funds.slice(0, 5); // Process max 5 funds
    
    // Create basic info about the funds
    const fundsInfo = fundsToProcess.map(fund => ({
      isin: fund.isin,
      name: fund.name,
      category: fund.category,
      risk_level: fund.risk_level,
      management_company: fund.management_company,
      currency: fund.currency,
      ytd_return: `${fund.ytd_return.toFixed(2)}%`,
      one_year_return: `${fund.one_year_return.toFixed(2)}%`,
      three_year_return: `${fund.three_year_return.toFixed(2)}%`,
      five_year_return: `${fund.five_year_return.toFixed(2)}%`,
      management_fee: `${fund.management_fee.toFixed(2)}%`
    }));
    
    // PDF extraction attempt - this is simpler but may not work with complex PDFs
    const pdfContents = [];
    
    // Track PDF extraction attempts for debugging
    const extractionResults = [];
    
    for (const fund of fundsToProcess) {
      // Try to fetch factsheet PDF
      if (fund.factsheet_url) {
        try {
          extractionResults.push({
            fund: fund.isin,
            document: 'factsheet',
            status: 'Attempting to fetch',
            url: fund.factsheet_url
          });
          
          const response = await fetch(fund.factsheet_url);
          
          if (response.ok) {
            // Just capture metadata about the PDF since we can't easily extract content
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            
            pdfContents.push({
              fund: fund.name,
              document_type: 'factsheet',
              url: fund.factsheet_url,
              status: 'Available - see link for details',
              metadata: { contentType, contentLength }
            });
            
            extractionResults.push({
              fund: fund.isin,
              document: 'factsheet',
              status: 'Fetch successful',
              contentType,
              contentLength
            });
          } else {
            extractionResults.push({
              fund: fund.isin,
              document: 'factsheet',
              status: 'Fetch failed',
              statusCode: response.status
            });
          }
        } catch (error) {
          extractionResults.push({
            fund: fund.isin,
            document: 'factsheet',
            status: 'Error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Try to fetch KIID PDF
      if (fund.kiid_url) {
        try {
          extractionResults.push({
            fund: fund.isin,
            document: 'kiid',
            status: 'Attempting to fetch',
            url: fund.kiid_url
          });
          
          const response = await fetch(fund.kiid_url);
          
          if (response.ok) {
            // Just capture metadata about the PDF
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            
            pdfContents.push({
              fund: fund.name,
              document_type: 'KIID',
              url: fund.kiid_url,
              status: 'Available - see link for details',
              metadata: { contentType, contentLength }
            });
            
            extractionResults.push({
              fund: fund.isin,
              document: 'kiid',
              status: 'Fetch successful',
              contentType,
              contentLength
            });
          } else {
            extractionResults.push({
              fund: fund.isin,
              document: 'kiid',
              status: 'Fetch failed',
              statusCode: response.status
            });
          }
        } catch (error) {
          extractionResults.push({
            fund: fund.isin,
            document: 'kiid',
            status: 'Error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    console.log('Document extraction results:', JSON.stringify(extractionResults, null, 2));
    
    // Create prompt for OpenAI with all available information
    const systemPrompt = `
Eres un asesor financiero especializado en analizar fondos de inversión.
Analizarás la información proporcionada de los fondos y generarás un informe completo que incluya:

1. Información Clave del Fondo: Resume la estrategia, objetivos y perfil de inversor objetivo basado en la categoría y datos del fondo
2. Análisis de Rendimiento: Analiza los retornos en el contexto de la categoría del fondo y las condiciones generales del mercado
3. Evaluación de Riesgo: Evalúa el nivel de riesgo y si es apropiado para la estrategia del fondo
4. Análisis de Comisiones: Evalúa si la comisión de gestión es competitiva para esta categoría de fondo
5. Consideraciones: Proporciona factores a considerar sobre el fondo, pero NO hagas recomendaciones definitivas de compra, venta o mantenimiento

Estructura tu informe con secciones claras para cada fondo y un análisis comparativo.
Formatea tu respuesta en Markdown para facilitar la lectura.

IMPORTANTE: El informe debe estar completamente en español.

IMPORTANTE: NO debes proporcionar recomendaciones definitivas de "comprar", "vender" o "mantener". Debes dejar claro que la decisión final SIEMPRE debe ser tomada por un asesor financiero calificado que considere la situación particular de cada inversor, sus objetivos y tolerancia al riesgo.

IMPORTANTE: Incluye visualizaciones utilizando la sintaxis de Mermaid para mostrar:
1. Un gráfico de barras comparando los rendimientos a 1 año de todos los fondos
2. Un gráfico de dispersión que muestre la relación entre el riesgo (eje X) y el rendimiento a 1 año (eje Y)
3. Un gráfico circular mostrando la distribución de comisiones entre los fondos analizados

Ejemplo de sintaxis para gráficos Mermaid:

\`\`\`mermaid
graph TD
    A[Cliente] -->|Solicita datos| B(API)
    B --> C{Procesa}
    C -->|Éxito| D[Resultado]
    C -->|Error| E[Error]
\`\`\`

\`\`\`mermaid
pie title Distribución de Activos
    "Renta Variable" : 45
    "Renta Fija" : 30
    "Liquidez" : 25
\`\`\`

Para los gráficos xychart-beta, usa el siguiente formato:

\`\`\`mermaid
xychart-beta
    title "Comparación de Rendimientos"
    x-axis ["Fondo A", "Fondo B", "Fondo C", "Fondo D"]
    y-axis "Rentabilidad (%)" 0 --> 70
    bar [63, 45, 23, 12]
\`\`\`

\`\`\`mermaid
xychart-beta
    title "Relación Riesgo-Rentabilidad"
    x-axis "Riesgo" 1 --> 5
    y-axis "Rentabilidad (%)" 0 --> 70
    line [10, 20, 30, 40, 50]
    point [10, 20, 30, 40, 50]
\`\`\`

NOTA: En los gráficos xychart-beta, nunca incluyas strings en las secciones 'bar', 'line' o 'point', solo valores numéricos. Los nombres de los fondos deben ir en el x-axis como arreglo de strings.
`;

    const userPrompt = `
Por favor, analiza estos fondos de inversión y genera un informe completo:

Información de los Fondos:
${JSON.stringify(fundsInfo, null, 2)}

Enlaces a Documentos (Los PDFs no pudieron ser procesados automáticamente, pero aquí están los enlaces si los necesitas):
${JSON.stringify(pdfContents, null, 2)}

Por favor, genera un análisis detallado basado en los datos numéricos disponibles. Para cada fondo proporciona:
1. Análisis de métricas de rendimiento (YTD, 1 año, 3 años, 5 años)
2. Evaluación del nivel de riesgo en relación con los rendimientos
3. Evaluación de la comisión de gestión
4. Análisis comparativo entre fondos
5. Factores clave a considerar (pero no recomendaciones definitivas de compra/venta)

RECUERDA: No proporciones recomendaciones definitivas de inversión. El análisis debe ser informativo pero la decisión final siempre debe dejarse al inversor y su asesor financiero personal.

No olvides incluir gráficos utilizando Mermaid para visualizar los datos clave.

Formatea la respuesta como un informe profesional de inversión en Markdown y COMPLETAMENTE EN ESPAÑOL.
`;

    // Call OpenAI directly with chat completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    // Get the generated report
    const report = completion.choices[0].message.content;
    
    // Return both the report and debugging info about document processing
    return NextResponse.json({ 
      report,
      debug: {
        extraction_attempts: extractionResults,
        pdf_metadata: pdfContents
      }
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to generate report', details: errorMessage },
      { status: 500 }
    );
  }
} 