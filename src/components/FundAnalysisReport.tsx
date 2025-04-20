import React, { useState, useCallback } from 'react';
import { Fund } from '@/types/fund';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { trpc } from './TRPCProvider';

// Define the response type to match the server
type AnalysisResponse = 
  | { success: true; data: any } 
  | { success: false; error: string };

interface FundAnalysisReportProps {
  selectedFunds: Fund[];
}

export const FundAnalysisReport: React.FC<FundAnalysisReportProps> = ({ selectedFunds }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<'summary' | 'allocation' | 'risk' | 'future'>('summary');
  const [analysisRequested, setAnalysisRequested] = useState(false);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Helper functions for formatters (prevents template errors)
  const percentFormatter = useCallback((value: any) => {
    return [`${value}%`, 'Porcentaje'];
  }, []);
  
  const allocationFormatter = useCallback((value: any) => {
    return [`${value}%`, 'Asignación'];
  }, []);
  
  const returnFormatter = useCallback((value: any) => {
    return [`${value}%`, 'Rendimiento Proyectado'];
  }, []);
  
  const axisFormatter = useCallback((value: any) => {
    return `${value}%`;
  }, []);
  
  const pieLabelFormatter = useCallback((props: any) => {
    const name = props.name || '';
    const percent = props.percent || 0;
    return `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`;
  }, []);
  
  const categoryLabelFormatter = useCallback((props: any) => {
    const name = props.name || '';
    const percent = props.percent || 0;
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  }, []);
  
  // Helper function to get risk level text
  const getRiskLevelText = useCallback((score: number) => {
    if (score < 33) return "Riesgo Bajo";
    if (score < 66) return "Riesgo Moderado";
    return "Riesgo Alto";
  }, []);
  
  // Helper function to get risk color
  const getRiskColor = useCallback((score: number) => {
    if (score < 33) return "#10b981"; // green for low risk
    if (score < 66) return "#f59e0b"; // amber for moderate risk
    return "#ef4444"; // red for high risk
  }, []);
  
  // Helper function to get cell color based on name
  const getCellColor = useCallback((name: string) => {
    if (name.includes("Low") || name.includes("Bajo")) {
      return "#10b981"; // green for low risk
    } else if (name.includes("Moderate") || name.includes("Moderado")) {
      return "#f59e0b"; // amber for moderate risk
    }
    return "#ef4444"; // red for high risk
  }, []);
  
  // Use tRPC mutation
  const analyzeFundsMutation = trpc.analysis.analyzeFunds.useMutation({
    onSuccess: (data: AnalysisResponse) => {
      if (data.success) {
        setInsights(data.data);
        setError(null);
      } else {
        setError(data.error || "Error al generar el análisis. Por favor, inténtelo de nuevo.");
      }
      setLoading(false);
    },
    onError: (err) => {
      console.error("Error in tRPC mutation:", err);
      setError("Error en la comunicación con el servidor. Por favor, inténtelo de nuevo.");
      setLoading(false);
    }
  });
  
  // Function to generate insights on demand
  const generateInsights = () => {
    setLoading(true);
    setError(null);
    setAnalysisRequested(true);

    try {
      // Call the tRPC mutation
      analyzeFundsMutation.mutate({ funds: selectedFunds });
    } catch (e: any) {
      console.error("Error initiating funds analysis:", e);
      setError("Error al iniciar el análisis. Por favor, inténtelo de nuevo.");
      setLoading(false);
    }
  };

  // If no funds are selected or only one fund, show a message
  if (!selectedFunds || selectedFunds.length <= 1) {
    return (
      <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Análisis de Fondos</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-300">
            Seleccione al menos dos fondos para generar un análisis comparativo.
          </p>
        </div>
      </div>
    );
  }

  // If analysis hasn't been requested yet, show the button
  if (!analysisRequested && !insights && !loading) {
    return (
      <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Análisis de Fondos</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Analizar {selectedFunds.length} fondos seleccionados usando IA. Esta acción puede tardar unos segundos.
            </p>
            <button
              onClick={generateInsights}
              className="px-6 py-3 bg-[#D1472C] text-white font-medium rounded-lg hover:bg-[#B33D25] transition-colors duration-200"
            >
              Generar Análisis con IA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If loading, show a loading indicator
  if (loading) {
    return (
      <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Análisis de Fondos</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 dark:border-gray-300 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Generando análisis con IA... Esto puede tardar unos segundos.
          </p>
        </div>
      </div>
    );
  }

  // If there was an error, show an error message with retry button
  if (error) {
    return (
      <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Análisis de Fondos</h2>
        <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg shadow">
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={generateInsights}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Intentar Nuevamente
          </button>
        </div>
      </div>
    );
  }

  // If no insights yet, don't render anything
  if (!insights) {
    return null;
  }

  // Render the analysis report with visualizations
  return (
    <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Análisis de Fondos</h2>
      
      {/* Report tab navigation */}
      <div className="flex overflow-x-auto mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 font-medium text-sm mr-4 ${
            selectedSection === 'summary'
              ? 'text-[#D1472C] border-b-2 border-[#D1472C]'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setSelectedSection('summary')}
        >
          Resumen
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm mr-4 ${
            selectedSection === 'allocation'
              ? 'text-[#D1472C] border-b-2 border-[#D1472C]'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setSelectedSection('allocation')}
        >
          Asignación Recomendada
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm mr-4 ${
            selectedSection === 'risk'
              ? 'text-[#D1472C] border-b-2 border-[#D1472C]'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setSelectedSection('risk')}
        >
          Análisis de Riesgo
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            selectedSection === 'future'
              ? 'text-[#D1472C] border-b-2 border-[#D1472C]'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setSelectedSection('future')}
        >
          Perspectivas Futuras
        </button>
      </div>

      {/* Summary Section */}
      {selectedSection === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
              Resumen del Análisis
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{insights.summary.overview}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Fortalezas</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.summary.strengths.map((strength: string, i: number) => (
                    <li key={i} className="text-gray-600 dark:text-gray-400">{strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Debilidades</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.summary.weaknesses.map((weakness: string, i: number) => (
                    <li key={i} className="text-gray-600 dark:text-gray-400">{weakness}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Top Performers and Underperformers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                Mejores Fondos
              </h3>
              <ul className="space-y-3">
                {insights.summary.topPerformers.map((fund: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center mr-2 mt-0.5">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300">{fund}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                Fondos Con Menor Rendimiento
              </h3>
              <ul className="space-y-3">
                {insights.summary.underperformers.map((fund: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center mr-2 mt-0.5">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300">{fund}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Takeaways */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
              Conclusiones Clave
            </h3>
            <ul className="space-y-3">
              {insights.summary.keyTakeaways.map((takeaway: string, i: number) => (
                <li key={i} className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Allocation Section */}
      {selectedSection === 'allocation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
              Asignación Recomendada
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{insights.allocation.overview}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Allocation Pie Chart */}
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={insights.allocation.percentages}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={pieLabelFormatter}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {insights.allocation.percentages.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={allocationFormatter} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Allocation Details */}
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Detalles de Asignación</h4>
                <div className="space-y-4">
                  {insights.allocation.percentages.map((allocation: any, i: number) => (
                    <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {allocation.name}
                        </span>
                        <span className="text-[#D1472C] font-medium">
                          {allocation.value}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {allocation.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Allocation Rationale */}
            <div className="mt-8">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Estrategia y Razonamiento</h4>
              <p className="text-gray-600 dark:text-gray-300">{insights.allocation.strategy}</p>
              <p className="text-gray-600 dark:text-gray-300 mt-3">{insights.allocation.rationale}</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis Section */}
      {selectedSection === 'risk' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
              Análisis de Riesgo
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{insights.riskAnalysis.overview}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Risk Score Gauge */}
              <div className="flex flex-col items-center">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4 self-start">Puntuación de Riesgo</h4>
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 200 100" className="w-full">
                    {/* Background arc */}
                    <path
                      d="M20,100 A80,80 0 0,1 180,100"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    {/* Value arc */}
                    <path
                      d="M20,100 A80,80 0 0,1 180,100"
                      fill="none"
                      stroke={getRiskColor(insights.riskAnalysis.riskScore)}
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray={`${insights.riskAnalysis.riskScore * 2.5} 1000`}
                    />
                    {/* Score label */}
                    <text x="100" y="90" textAnchor="middle" fontSize="24" fontWeight="bold">
                      {insights.riskAnalysis.riskScore}
                    </text>
                    <text x="100" y="110" textAnchor="middle" fontSize="14">
                      de 100
                    </text>
                  </svg>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getRiskLevelText(insights.riskAnalysis.riskScore)}
                  </p>
                </div>
              </div>
              
              {/* Risk Breakdown */}
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Distribución de Riesgo</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={insights.riskAnalysis.riskBreakdown}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={axisFormatter} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={percentFormatter} />
                    <Bar dataKey="value" fill="#8884d8">
                      {insights.riskAnalysis.riskBreakdown.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getCellColor(entry.name)} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Diversification and Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Diversificación</h4>
                <p className="text-gray-600 dark:text-gray-300">{insights.riskAnalysis.diversification}</p>
                
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">Fortalezas</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.riskAnalysis.strengths.map((strength: string, i: number) => (
                    <li key={i} className="text-gray-600 dark:text-gray-400">{strength}</li>
                  ))}
                </ul>
                
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">Debilidades</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.riskAnalysis.weaknesses.map((weakness: string, i: number) => (
                    <li key={i} className="text-gray-600 dark:text-gray-400">{weakness}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Distribución por Categoría</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={insights.riskAnalysis.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={categoryLabelFormatter}
                    >
                      {insights.riskAnalysis.categoryBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={percentFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Future Outlook Section */}
      {selectedSection === 'future' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
              Perspectivas Futuras
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{insights.futureOutlook.overview}</p>
            
            {/* Projected Returns Chart */}
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Rendimientos Proyectados</h4>
            <div className="h-64 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={insights.futureOutlook.projections}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={axisFormatter} />
                  <Tooltip formatter={returnFormatter} />
                  <Legend />
                  <Bar dataKey="value" name="Rendimiento Proyectado" barSize={40} fill="#8884d8" />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ff7300"
                    dot={{ r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Tendencia"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Recomendaciones</h4>
                <ul className="space-y-2">
                  {insights.futureOutlook.recommendations.map((recommendation: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-300">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Alternativas a Considerar</h4>
                <ul className="space-y-2">
                  {insights.futureOutlook.alternatives.map((alternative: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-white text-xs">→</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-300">{alternative}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
        Análisis generado con IA. Los datos son orientativos y no constituyen asesoramiento financiero.
      </div>
    </div>
  );
};