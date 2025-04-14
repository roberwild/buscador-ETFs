export type RiskLevel = 'Sin valorar' | 'Riesgo bajo' | 'Riesgo moderado' | 'Riesgo medio-alto' | 'Riesgo alto' | 'Riesgo muy alto';

export interface Fund {
  isin: string;
  name: string;
  currency: string;
  category: string;
  subcategory: string;
  compartment_code: string; // Código de compartimento
  available_for_implicit_advisory: boolean; // Disponible para asesoramiento con cobro implícito
  available_for_explicit_advisory: boolean; // Disponible para asesoramiento con cobro explícito
  hedge: string; // Valor Y/N que indica si el fondo tiene cobertura de divisa
  management_fee: number;
  success_fee: number;
  min_investment: number;
  min_investment_currency: string;
  aum: string; // Assets Under Management
  ytd_return: number;
  one_year_return: number;
  three_year_return: number;
  five_year_return: number;
  management_company: string;
  factsheet_url: string;
  kiid_url: string;
  risk_level: RiskLevel;
  morningstar_rating: number; // 0-5 stars
  sharpe_ratio?: number; // Opcional ya que no todos los fondos podrían tenerlo
  focus_list: string; // "Y" o "N"
} 