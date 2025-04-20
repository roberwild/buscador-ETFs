import React, { useMemo } from 'react';
import { Fund } from '@/types/fund';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Scatter, ScatterChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ReferenceLine, Label
} from 'recharts';

interface FundComparativeDashboardProps {
  selectedFunds: Fund[];
}

export const FundComparativeDashboard: React.FC<FundComparativeDashboardProps> = ({ selectedFunds }) => {
  // Don't render if no funds or just one fund (nothing to compare)
  if (!selectedFunds || selectedFunds.length <= 1) {
    return null;
  }

  // Process data for returns comparison chart (Bar Chart)
  const returnsData = useMemo(() => {
    return selectedFunds.map(fund => ({
      name: fund.name.length > 20 ? fund.name.substring(0, 20) + '...' : fund.name,
      isin: fund.isin,
      'YTD': fund.ytd_return,
      '1 Año': fund.one_year_return,
      '3 Años': fund.three_year_return,
      '5 Años': fund.five_year_return,
      'TER': fund.management_fee
    }));
  }, [selectedFunds]);

  // Process data for risk vs return scatter plot
  const riskReturnData = useMemo(() => {
    // Map risk levels to numeric values for visualization
    const riskToNumber = (risk: string): number => {
      switch (risk) {
        case 'Riesgo bajo': return 1;
        case 'Riesgo moderado': return 2;
        case 'Riesgo medio-alto': return 3;
        case 'Riesgo alto': return 4;
        case 'Riesgo muy alto': return 5;
        default: return 3; // Default to middle value
      }
    };

    return selectedFunds.map(fund => ({
      name: fund.name.length > 20 ? fund.name.substring(0, 20) + '...' : fund.name,
      isin: fund.isin,
      risk: riskToNumber(fund.risk_level),
      return: fund.three_year_return, // Using 3-year return as the performance metric
      TER: fund.management_fee
    }));
  }, [selectedFunds]);

  // Prepare data for a line chart showing performance over time (inverted order - older data on left)
  const performanceLineData = useMemo(() => {
    return [
      { name: '5 Años', ...selectedFunds.reduce((acc, fund) => ({ ...acc, [fund.isin]: fund.five_year_return }), {}) },
      { name: '3 Años', ...selectedFunds.reduce((acc, fund) => ({ ...acc, [fund.isin]: fund.three_year_return }), {}) },
      { name: '1 Año', ...selectedFunds.reduce((acc, fund) => ({ ...acc, [fund.isin]: fund.one_year_return }), {}) },
      { name: 'YTD', ...selectedFunds.reduce((acc, fund) => ({ ...acc, [fund.isin]: fund.ytd_return }), {}) }
    ];
  }, [selectedFunds]);

  // Prepare data for fee comparison
  const feeData = useMemo(() => {
    return selectedFunds.map(fund => ({
      name: fund.name.length > 20 ? fund.name.substring(0, 20) + '...' : fund.name,
      isin: fund.isin,
      TER: fund.management_fee
    }));
  }, [selectedFunds]);

  // Generate colors for the charts
  const chartColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', 
    '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'
  ];

  return (
    <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Dashboard Comparativo</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance comparison chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Comparativa de Rentabilidad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={performanceLineData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value}%`, '']} />
              <Legend />
              {selectedFunds.map((fund, i) => (
                <Line 
                  key={fund.isin}
                  type="monotone" 
                  dataKey={fund.isin}
                  name={fund.name.length > 20 ? fund.name.substring(0, 20) + '...' : fund.name}
                  stroke={chartColors[i % chartColors.length]}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk vs Return scatter plot */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Riesgo vs Rentabilidad (3 años)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="risk" 
                name="Riesgo" 
                domain={[0, 6]}
                tickFormatter={(value) => {
                  switch(value) {
                    case 1: return 'Bajo';
                    case 2: return 'Moderado';
                    case 3: return 'Medio-Alto';
                    case 4: return 'Alto';
                    case 5: return 'Muy Alto';
                    default: return '';
                  }
                }}
              />
              <YAxis type="number" dataKey="return" name="Rentabilidad" unit="%" />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'return') return [`${value}%`, 'Rentabilidad'];
                  if (name === 'risk') {
                    const riskLabels = ['Bajo', 'Moderado', 'Medio-Alto', 'Alto', 'Muy Alto'];
                    return [riskLabels[Number(value)-1] || '', 'Riesgo'];
                  }
                  return [value, name];
                }}
                labelFormatter={(value) => {
                  const fund = selectedFunds.find((_, index) => index === value);
                  return fund ? (fund.name.length > 20 ? fund.name.substring(0, 20) + '...' : fund.name) : '';
                }}
              />
              <Legend />
              {selectedFunds.map((fund, i) => (
                <Scatter 
                  key={fund.isin} 
                  name={fund.name.length > 20 ? fund.name.substring(0, 20) + '...' : fund.name} 
                  data={[riskReturnData.find(item => item.isin === fund.isin)]} 
                  fill={chartColors[i % chartColors.length]} 
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* TER (Management Fee) Comparison */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Comparativa de Comisiones (TER)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={feeData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip formatter={(value) => [`${value}%`, 'TER']} />
              <Legend />
              <Bar dataKey="TER" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance vs Fee Efficiency */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Eficiencia: Rentabilidad vs Comisiones</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 50, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="TER" 
                name="Comisión TER" 
                label={{ 
                  value: 'Comisión TER (%)', 
                  position: 'bottom', 
                  offset: 0,
                  dy: 15
                }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                type="number" 
                dataKey="return" 
                name="Rentabilidad a 3 años"
                label={{ 
                  value: 'Rentabilidad a 3 años (%)', 
                  angle: -90, 
                  position: 'left',
                  dx: -5
                }}
                tickFormatter={(value) => `${value}%`}
              />
              
              {/* Efficiency reference line - this draws a diagonal line showing optimal fee/return ratio */}
              {(() => {
                // Calculate average return and fee for reference line
                const avgReturn = selectedFunds.reduce((sum, fund) => sum + fund.three_year_return, 0) / selectedFunds.length;
                const avgFee = selectedFunds.reduce((sum, fund) => sum + fund.management_fee, 0) / selectedFunds.length;
                const maxReturn = Math.max(...selectedFunds.map(fund => fund.three_year_return));
                const minFee = Math.min(...selectedFunds.map(fund => fund.management_fee));
                
                // Only show reference if we have enough data
                if (selectedFunds.length >= 2) {
                  return (
                    <ReferenceLine
                      segment={[
                        { x: minFee, y: avgReturn },
                        { x: avgFee * 1.5, y: maxReturn * 0.25 }
                      ]}
                      stroke="#ff7300"
                      strokeDasharray="3 3"
                      label={{ value: 'Frontera de Eficiencia', position: 'insideTopRight', fill: '#ff7300' }}
                    />
                  );
                }
                return null;
              })()}
              
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'return') return [`${value}%`, 'Rentabilidad 3 años'];
                  if (name === 'TER') return [`${value}%`, 'Comisión TER'];
                  return [value, name];
                }}
                labelFormatter={(index) => {
                  const fund = selectedFunds[index];
                  return fund ? fund.name : '';
                }}
              />
              
              <Legend />
              
              {/* Create data points for each fund */}
              {selectedFunds.map((fund, i) => {
                // Create data for this fund
                const data = [{
                  name: fund.name,
                  TER: fund.management_fee,
                  return: fund.three_year_return,
                  // Calculate an efficiency score (higher is better)
                  efficiency: fund.three_year_return / fund.management_fee
                }];
                
                // Determine point size based on efficiency (better efficiency = larger point)
                const avgEfficiency = selectedFunds.reduce((sum, f) => sum + (f.three_year_return / f.management_fee), 0) / selectedFunds.length;
                const efficiency = fund.three_year_return / fund.management_fee;
                const size = 50 + (efficiency / avgEfficiency) * 70;
                
                return (
                  <Scatter 
                    key={fund.isin} 
                    name={fund.name.length > 20 ? fund.name.substring(0, 20) + '...' : fund.name} 
                    data={data} 
                    fill={chartColors[i % chartColors.length]}
                    shape="circle"
                    r={Math.min(Math.max(size / 5, 5), 20)}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <p>* El gráfico de eficiencia muestra la relación entre rentabilidad y comisiones. Los fondos más eficientes aparecen por encima de la línea de referencia.</p>
        <p>* El tamaño de cada punto indica la eficiencia del fondo: mayor tamaño = mejor relación rentabilidad/comisión.</p>
      </div>
    </div>
  );
}; 