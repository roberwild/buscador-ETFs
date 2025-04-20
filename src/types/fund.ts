export type RiskLevel = 
  'Sin valorar' | 
  'Riesgo bajo' | 
  'Riesgo moderado' | 
  'Riesgo medio-alto' | 
  'Riesgo alto' | 
  'Riesgo muy alto';

export type Fund = {
  isin: string;
  name: string;
  category: string;
  management_company: string;
  currency: string;
  risk_level: RiskLevel;
  focus_list: string;
  implicit_advisory?: boolean;
  explicit_advisory?: boolean;
  hedge?: boolean;
  dividend_policy?: 'Acumulación' | 'Distribución';
  replication_type?: 'Física' | 'Sintética';
  ytd_return: number;
  one_year_return: number;
  three_year_return: number;
  five_year_return: number;
  management_fee: number;
  rating?: string;
  maturity_range?: string;
  factsheet_url: string;
  compartment_code: string;
}; 