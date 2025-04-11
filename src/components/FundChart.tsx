'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface FundChartProps {
  isin: string
  name: string
}

interface HistoricalDataPoint {
  date: Date
  close: number
  high: number
  low: number
  open: number
  volume: number
  adjClose: number
}

// Mapeo de ISIN conocidos a tickers de Yahoo Finance
const KNOWN_TICKERS: { [key: string]: string } = {
  'LU1223083327': '0P0001843N.L', // Schroder ISF Global Gold A Dis GBPHdg AV
  'LU1223083087': '0P0001843N.L', // Schroder ISF Global Gold A Acc EUR Hedged (usa el mismo ticker porque es la misma clase de fondo)
}

// Función para formatear errores
const formatError = (error: any): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return JSON.stringify(error)
}

export default function FundChart({ isin, name }: FundChartProps) {
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    console.log(info)
    setDebugInfo(prev => [...prev, info])
  }

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true)
        setError(null)
        setDebugInfo([])

        addDebugInfo(`Buscando fondo: ${name} (${isin})`)

        // Intentamos obtener datos usando el ticker conocido
        if (KNOWN_TICKERS[isin]) {
          const knownTicker = KNOWN_TICKERS[isin]
          addDebugInfo(`Usando ticker conocido: ${knownTicker}`)
          
          try {
            const response = await fetch(`/api/yahoo-finance?symbol=${knownTicker}`)
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            
            if (data.error) {
              throw new Error(data.error)
            }

            addDebugInfo(`Información del símbolo: ${JSON.stringify(data.quote, null, 2)}`)

            if (data.historicalData && data.historicalData.length > 0) {
              const result = data.historicalData.map((point: any) => ({
                ...point,
                date: new Date(point.date)
              }))

              addDebugInfo(`Datos históricos obtenidos para ${knownTicker} (${result.length} puntos)`)
              
              // Ordenamos los datos por fecha
              result.sort((a: HistoricalDataPoint, b: HistoricalDataPoint) => 
                a.date.getTime() - b.date.getTime()
              )
              
              const dates = result.map((item: HistoricalDataPoint) => 
                item.date.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              )
              const prices = result.map((item: HistoricalDataPoint) => item.close)

              setChartData({
                labels: dates,
                datasets: [
                  {
                    label: 'Valor Liquidativo',
                    data: prices,
                    borderColor: '#D1472C',
                    backgroundColor: 'rgba(209, 71, 44, 0.1)',
                    tension: 0.1,
                    fill: true
                  }
                ]
              })
              addDebugInfo('Gráfico generado correctamente')
            } else {
              throw new Error('No se encontraron datos históricos')
            }
          } catch (err) {
            const errorMsg = formatError(err)
            addDebugInfo(`Error obteniendo datos para ticker conocido: ${errorMsg}`)
            setError('No se encontraron datos históricos para este fondo')
          }
        } else {
          addDebugInfo(`No se encontró un ticker conocido para el ISIN ${isin}`)
          setError('No se encontraron datos históricos para este fondo')
        }
      } catch (err) {
        const errorMsg = formatError(err)
        console.error('Error fetching historical data:', err)
        setError('No se pudieron obtener los datos históricos del fondo')
        addDebugInfo(`Error general: ${errorMsg}`)
      } finally {
        setLoading(false)
      }
    }

    fetchHistoricalData()
  }, [isin, name])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D1472C]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-96 bg-gray-50 rounded-lg p-6">
        <div className="text-center max-w-md mx-auto mb-6">
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">
            Los datos históricos no están disponibles en este momento. 
            Esto puede deberse a que el fondo es muy nuevo, no cotiza en mercados públicos, 
            o los datos no están accesibles a través de nuestras fuentes.
          </p>
          {KNOWN_TICKERS[isin] && (
            <p className="text-sm text-gray-500 mt-2">
              Puedes consultar los datos directamente en{' '}
              <a 
                href={`https://finance.yahoo.com/quote/${KNOWN_TICKERS[isin]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D1472C] hover:underline"
              >
                Yahoo Finance
              </a>
            </p>
          )}
        </div>
        
        {/* Información de depuración */}
        <div className="mt-auto">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">Mostrar detalles técnicos</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto max-h-40">
              {debugInfo.map((info, index) => (
                <p key={index} className="mb-1 font-mono">{info}</p>
              ))}
            </div>
          </details>
        </div>
      </div>
    )
  }

  if (!chartData) {
    return null
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} €`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return value.toFixed(2) + ' €'
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }

  return (
    <div className="h-96">
      <Line data={chartData} options={options} />
    </div>
  )
} 