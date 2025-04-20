import { useEffect, useRef, useState } from 'react';
import { Fund } from '@/types/fund';
import mermaid from 'mermaid';

// Configurar Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'sans-serif',
  logLevel: 4, // 'error' level only to reduce console noise
});

interface FundChartsProps {
  funds: Fund[];
}

// Asignar colores a niveles de riesgo
const getRiskLevelNumber = (riskLevel: string): number => {
  switch (riskLevel) {
    case 'Sin valorar': return 0;
    case 'Riesgo bajo': return 1;
    case 'Riesgo moderado': return 2;
    case 'Riesgo medio-alto': return 3; 
    case 'Riesgo alto': return 4;
    case 'Riesgo muy alto': return 5;
    default: return 0;
  }
};

// Helper function to safely render Mermaid charts with error boundary
const renderMermaidChart = async (
  chartId: string, 
  definition: string, 
  container: HTMLDivElement | null, 
  fallbackMessage: string = 'Gráfico no disponible'
): Promise<void> => {
  if (!container) return;
  
  try {
    // Ensure clean container
    container.innerHTML = '';
    
    // Add timeout to prevent hanging
    const renderPromise = new Promise<{svg: string}>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout rendering chart'));
      }, 3000);
      
      mermaid.render(chartId, definition)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
    
    const { svg } = await renderPromise;
    container.innerHTML = svg;
  } catch (err) {
    console.error(`Error rendering ${chartId}:`, err);
    console.debug('Failed chart definition:', definition);
    
    // Quietly hide error in reports - only log to console
    container.innerHTML = '';
  }
};

export default function FundCharts({ funds }: FundChartsProps) {
  const returnsChartRef = useRef<HTMLDivElement>(null);
  const riskReturnChartRef = useRef<HTMLDivElement>(null);
  const feesChartRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!funds || funds.length === 0) {
      setError("No hay fondos seleccionados para visualizar");
      setLoading(false);
      return;
    }

    // Generar y renderizar los gráficos
    const renderCharts = async () => {
      try {
        setLoading(true);
        
        // 1. Gráfico de rentabilidades a 1 año
        if (returnsChartRef.current) {
          // Preprocesar datos para evitar errores
          const fundNames = funds.map(f => f.name.length > 10 ? f.name.slice(0, 10) + '...' : f.name);
          const returnValues = funds.map(f => parseFloat(f.one_year_return.toFixed(2)));
          const maxReturn = Math.max(...returnValues) * 1.2 || 100;
          
          const returnsChartDef = `
            xychart-beta
            title "Comparación de Rentabilidades a 1 Año"
            x-axis ${JSON.stringify(fundNames)}
            y-axis "Rentabilidad (%)" 0 --> ${maxReturn}
            bar ${JSON.stringify(returnValues)}
          `;
          
          await renderMermaidChart('returnsChart', returnsChartDef, returnsChartRef.current);
        }
        
        // 2. Gráfico de relación riesgo/rentabilidad usando flowchart
        if (riskReturnChartRef.current && funds.length > 0) {
          // Preparar datos para el gráfico de dispersión
          const riskReturnData = funds.map(fund => {
            return {
              name: fund.name.length > 10 ? fund.name.slice(0, 10) + '...' : fund.name,
              riskLevel: getRiskLevelNumber(fund.risk_level),
              return1yr: parseFloat(fund.one_year_return.toFixed(2))
            };
          });
          
          const maxReturn = Math.max(...riskReturnData.map(d => d.return1yr)) * 1.2;
          
          // Usar flowchart en lugar de xychart para el scatter plot
          const scatterDef = `
            flowchart LR
            classDef low fill:#4ADE80,stroke:#16A34A,color:#166534
            classDef medium fill:#FCD34D,stroke:#F59E0B,color:#92400E
            classDef high fill:#F87171,stroke:#EF4444,color:#991B1B
            
            ${riskReturnData.map((item, i) => 
              `    p${i}["${item.name}\\n${item.return1yr}%"]`
            ).join('\n')}
            
            ${riskReturnData.map((item, i) => {
              const x = 150 + item.riskLevel * 150; // Espaciado horizontal basado en riesgo
              const y = 500 - (item.return1yr / maxReturn * 400); // Posición vertical basada en rentabilidad
              return `    p${i}:::${item.riskLevel <= 2 ? 'low' : item.riskLevel <= 3 ? 'medium' : 'high'} --> |${item.riskLevel}| p${i} & position${i}[""] --> p${i}
              style p${i} opacity:0.9,rx:15,ry:15
              style position${i} width:0,height:0,opacity:0,position:absolute,left:${x}px,top:${y}px`;
            }).join('\n')}
            
            title["Relación Riesgo/Rentabilidad"]
            style title opacity:0,position:absolute,left:10px,top:10px,font-size:18px,font-weight:bold
            
            xAxis["Nivel de Riesgo -->"]
            style xAxis opacity:0,position:absolute,left:150px,bottom:10px
            
            yAxis["Rentabilidad (%)"]
            style yAxis opacity:0,position:absolute,left:10px,top:250px,writing-mode:vertical-rl,transform:rotate(180deg)
          `;
          
          await renderMermaidChart('riskReturnChart', scatterDef, riskReturnChartRef.current);
        }
        
        // 3. Gráfico de comisiones
        if (feesChartRef.current) {
          // Crear versión segura con valores correctos para el gráfico circular
          const fundLabels = funds.map(fund => fund.name.length > 10 ? fund.name.slice(0, 10) + '...' : fund.name);
          const feeValues = funds.map(fund => fund.management_fee.toFixed(2));
          
          // Asegurarse de que el gráfico circular tenga al menos dos valores
          let pieChartDef = '';
          
          if (funds.length === 1) {
            // Para un solo fondo, mostrar proporciones de comisión vs rendimiento
            pieChartDef = `
              pie title Análisis de ${fundLabels[0]}
              "Comisión" : ${feeValues[0]}
              "Rendimiento Anual" : ${funds[0].one_year_return.toFixed(2)}
            `;
          } else {
            // Para múltiples fondos, mostrar distribución de comisiones
            pieChartDef = `
              pie title Distribución de Comisiones (%)
              ${fundLabels.map((label, i) => `"${label}" : ${feeValues[i]}`).join('\n')}
            `;
          }
          
          await renderMermaidChart('feesChart', pieChartDef, feesChartRef.current);
        }
        
      } catch (err) {
        console.error('Error generating charts:', err);
        setError('Error al generar los gráficos');
      } finally {
        setLoading(false);
      }
    };

    renderCharts();
  }, [funds]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!funds || funds.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-8">
        No hay fondos seleccionados para visualizar.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Rentabilidades a 1 Año */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-md font-medium mb-3 text-gray-700 dark:text-gray-300">
          Comparativa de Rentabilidades (1 Año)
        </h3>
        <div ref={returnsChartRef} className="min-h-[300px] flex items-center justify-center"></div>
      </div>

      {/* Gráfico de Relación Riesgo/Rentabilidad */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-md font-medium mb-3 text-gray-700 dark:text-gray-300">
          Relación Riesgo/Rentabilidad
        </h3>
        <div ref={riskReturnChartRef} className="min-h-[300px] flex items-center justify-center"></div>
      </div>

      {/* Gráfico de Comisiones */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow lg:col-span-2">
        <h3 className="text-md font-medium mb-3 text-gray-700 dark:text-gray-300">
          Distribución de Comisiones
        </h3>
        <div ref={feesChartRef} className="min-h-[300px] flex items-center justify-center"></div>
      </div>
    </div>
  );
} 