import { useState } from 'react';
import { Fund } from '@/types/fund';
import ReactMarkdown from 'react-markdown';
import { Download, FileText, Loader2, Info } from 'lucide-react';

interface ReportGeneratorProps {
  selectedFunds: Fund[];
}

interface DebugInfo {
  extraction_attempts: Array<{
    fund: string;
    document: string;
    status: string;
    url?: string;
    contentType?: string;
    contentLength?: string;
    statusCode?: number;
    error?: string;
  }>;
  pdf_metadata: Array<{
    fund: string;
    document_type: string;
    url: string;
    status: string;
    metadata: {
      contentType: string;
      contentLength: string;
    };
  }>;
}

export default function ReportGenerator({ selectedFunds }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const generateReport = async () => {
    if (selectedFunds.length === 0) {
      setError('Seleccione al menos un fondo para generar un informe');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setReport(null);
    setDebugInfo(null);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ funds: selectedFunds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el informe');
      }

      const data = await response.json();
      setReport(data.report);
      
      // Store debug info if available
      if (data.debug) {
        setDebugInfo(data.debug);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al generar el informe');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReportAsPDF = () => {
    // In a real implementation, this would convert markdown to PDF
    // For now, we'll create a text file with the markdown
    if (!report) return;

    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `informe-fondos-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(prev => !prev);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Análisis de Fondos Seleccionados
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Genere un informe detallado de los fondos seleccionados utilizando IA
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={generateReport}
            disabled={isGenerating || selectedFunds.length === 0}
            className={`flex items-center px-4 py-2 rounded-md text-white transition-colors ${
              isGenerating || selectedFunds.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Generar Informe
              </>
            )}
          </button>

          {report && (
            <button
              onClick={downloadReportAsPDF}
              className="flex items-center px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              Descargar Informe
            </button>
          )}
          
          {debugInfo && (
            <button
              onClick={toggleDebugInfo}
              className="flex items-center px-4 py-2 rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Info className="w-5 h-5 mr-2" />
              {showDebugInfo ? 'Ocultar Detalles' : 'Ver Detalles'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}
      
      {/* Debug Information Panel */}
      {showDebugInfo && debugInfo && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 mb-6 rounded-md border border-gray-200 dark:border-gray-700 overflow-auto">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Información de Procesamiento</h3>
          
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Intentos de Acceso a Documentos</h4>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ISIN</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Documento</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detalles</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {debugInfo.extraction_attempts.map((attempt, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                    <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">{attempt.fund}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">{attempt.document}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">{attempt.status}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">
                      {attempt.contentType && <>Content-Type: {attempt.contentType}<br /></>}
                      {attempt.contentLength && <>Content-Length: {attempt.contentLength}<br /></>}
                      {attempt.statusCode && <>Status Code: {attempt.statusCode}<br /></>}
                      {attempt.error && <>Error: {attempt.error}<br /></>}
                      {attempt.url && (
                        <a href={attempt.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          Ver documento
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Documentos Disponibles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {debugInfo.pdf_metadata.map((doc, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
                  <h5 className="font-medium text-gray-700 dark:text-gray-300">{doc.fund}</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{doc.document_type}</p>
                  <div className="mt-2">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Ver documento
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {report ? (
        <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-6 rounded-md overflow-auto">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-md">
          <FileText className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mt-4">
            {selectedFunds.length === 0
              ? 'Seleccione fondos para generar un informe'
              : 'Haga clic en "Generar Informe" para analizar los fondos seleccionados'}
          </p>
          {selectedFunds.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {selectedFunds.length} {selectedFunds.length === 1 ? 'fondo seleccionado' : 'fondos seleccionados'}
            </p>
          )}
        </div>
      )}
    </div>
  );
} 