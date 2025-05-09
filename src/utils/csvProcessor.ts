import { Fund, RiskLevel } from '@/types/fund';
import Papa from 'papaparse';

function parseNumericValue(value: string | undefined): number {
  if (!value) return 0;
  const cleanValue = value.replace(',', '.').replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanValue) || 0;
}

function parseRiskLevel(value: string): RiskLevel {
  const riskMap: { [key: string]: RiskLevel } = {
    '1': 'Riesgo bajo',
    '2': 'Riesgo bajo',
    '3': 'Riesgo moderado',
    '4': 'Riesgo medio-alto',
    '5': 'Riesgo alto',
    '6': 'Riesgo muy alto',
  };
  return riskMap[value] || 'Sin valorar';
}

export const processCSVData = (csvData: string): Fund[] => {
  const { data } = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';'
  });

  return data.map((row: any) => ({
    isin: row['ISIN'] || '',
    name: row['Nombre'] || '',
    currency: row['Divisa'] || '',
    category: row['Categoria Singular Bank'] || row['Categoria SB'] || '',
    subcategory: row['Categoría Morningstar'] || '',
    compartment_code: row['Código de compartimento'] || '',
    available_for_implicit_advisory: row['Disponible para asesoramiento con cobro implícito'] === 'Y',
    available_for_explicit_advisory: row['Disponible para asesoramiento con cobro explícito'] === 'Y',
    hedge: row['Hedge'] || 'N',
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
    factsheet_url: row['URL Ficha Comercial'] || '',
    kiid_url: row['URL KID PRIIPS'] || '',
    risk_level: parseRiskLevel(row['REQ']),
    morningstar_rating: parseInt(row['Morningstar Rating'] || '0'),
    focus_list: row['Focus List'] === 'Y' ? 'Y' : 'N',
    rating: row['Calificación'] || '',
    maturity_range: row['Rango de vencimientos'] || '',
    dividend_policy: row['Politica de dividendos'] || row['Política de dividendos'] || 'C',
    replication_type: row['Tipo de Réplica'] || '',
    req: row['REQ'] || '',
  }));
}; 