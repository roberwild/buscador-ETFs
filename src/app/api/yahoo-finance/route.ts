import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const period = searchParams.get('period') || '5y' // default to 5 years

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Primero verificamos que el símbolo existe
    const quote = await yahooFinance.quote(symbol)
    
    // Si el símbolo existe, obtenemos los datos históricos
    const historicalData = await yahooFinance.historical(symbol, {
      period1: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), // 5 años atrás
      period2: new Date(),
      interval: '1d'
    })

    return NextResponse.json({
      quote,
      historicalData
    })
  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from Yahoo Finance' },
      { status: 500 }
    )
  }
} 