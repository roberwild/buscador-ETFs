'use client'

import { useEffect, useState } from 'react'
import { Fund } from '@/types/fund'
import Link from 'next/link'
import FundChart from '@/components/FundChart'

export default function FundDetail({ params }: { params: { isin: string } }) {
  const [fund, setFund] = useState<Fund | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFundDetail = async () => {
      try {
        const response = await fetch(`/api/funds?search=${params.isin}`)
        const data = await response.json()
        if (data.funds && data.funds.length > 0) {
          setFund(data.funds[0])
        }
      } catch (error) {
        console.error('Error fetching fund details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFundDetail()
  }, [params.isin])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!fund) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Fondo no encontrado</h2>
          <p className="mt-2 text-gray-600">No se encontró el fondo con ISIN {params.isin}</p>
          <Link href="/" className="mt-4 inline-block text-[#D1472C] underline font-semibold">
            Volver al buscador
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/" className="text-[#D1472C] underline mb-8 inline-block font-semibold">
        ← Volver a la búsqueda
      </Link>

      <h1 className="text-4xl font-bold mb-4">{fund.name}</h1>
      <p className="text-xl text-gray-600 mb-8">ISIN {fund.isin}</p>
      <p className="text-lg mb-4">{fund.management_company}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Rating Morningstar</h3>
          <p>{fund.morningstar_rating ? '★'.repeat(fund.morningstar_rating) : 'No tiene'}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Sharpe ratio</h3>
          <p>{fund.sharpe_ratio || 'N/A'}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Gastos corrientes (OGC)</h3>
          <p>{fund.management_fee}%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Riesgo</h3>
          <p>{fund.risk_level}</p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Evolución del valor liquidativo</h2>
        <FundChart isin={fund.isin} name={fund.name} />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Rentabilidad acumulada</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Período</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">Rentabilidad</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">YTD</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{fund.ytd_return.toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">1 año</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{fund.one_year_return.toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">3 años</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{fund.three_year_return.toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">5 años</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{fund.five_year_return.toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 