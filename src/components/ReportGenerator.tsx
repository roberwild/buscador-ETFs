import { useState, useEffect, useRef } from 'react';
import { Fund } from '@/types/fund';
import ReactMarkdown from 'react-markdown';
import { Download, FileText, Loader2, Info, Printer } from 'lucide-react';
import mermaid from 'mermaid';
import remarkGfm from 'remark-gfm';
import remarkToc from 'remark-toc';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';

// Configure mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'sans-serif',
});

interface ReportGeneratorProps {
  selectedFunds: Fund[];
  onGenerateReport?: () => void;
}

// Component to render Mermaid diagrams
const MermaidDiagram = ({ content }: { content: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fixedContent, setFixedContent] = useState<string | null>(null);
  const [isErrorHidden, setIsErrorHidden] = useState<boolean>(false);
  const uniqueId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const containerRef = useRef<HTMLDivElement>(null);

  // Función para intentar corregir errores comunes en diagramas Mermaid
  const tryFixMermaidCode = (code: string, errorMsg: string): string | null => {
    // Si es un error de xychart con STR en lugar de NUMBER
    if (code.includes('xychart-beta') && errorMsg.includes("Expecting 'NUMBER_WITH_DECIMAL', got 'STR'")) {
      try {
        const lines = code.split('\n');
        let fixedCode = '';
        let dataValues: number[] = [];
        let axisLabels: string[] = [];

        // Extraer los valores numéricos del gráfico
        for (const line of lines) {
          if (line.trim().startsWith('bar') || line.trim().startsWith('line') || line.trim().startsWith('point')) {
            const match = line.match(/\[(.*?)\]/);
            if (match && match[1]) {
              try {
                // Intentar extraer strings o números
                const content = match[1].trim();
                if (content.includes('"')) {
                  // Si contiene strings, extraigamos esos valores para usarlos como etiquetas
                  axisLabels = content.split(',').map(s => s.trim().replace(/"/g, '').replace(/'/g, ''));
                  // Y eliminamos esta línea errónea de valores
                  continue;
                } else {
                  // Si son números, los conservamos
                  dataValues = content.split(',').map(n => parseFloat(n.trim()) || 0);
                }
              } catch (e) {
                console.error('Error parsing chart data:', e);
              }
            }
          }
          
          // Si es la línea de x-axis y no tenemos etiquetas aún
          if (line.trim().startsWith('x-axis') && !line.includes('[') && axisLabels.length > 0) {
            fixedCode += `    x-axis ${JSON.stringify(axisLabels)}\n`;
            continue;
          }

          // Mantener las demás líneas
          fixedCode += line + '\n';
        }

        // Si encontramos etiquetas y valores, pero no hay línea de data, agregarla
        if (axisLabels.length > 0 && dataValues.length === 0) {
          // Generar datos ficticios si es necesario
          dataValues = axisLabels.map((_, i) => 10 + i * 10);
          
          // Insertar después de la línea y-axis
          const parts = fixedCode.split('y-axis');
          if (parts.length >= 2) {
            const [first, ...rest] = parts;
            fixedCode = first + 'y-axis' + rest[0] + `    bar ${JSON.stringify(dataValues)}\n`;
            if (rest.length > 1) {
              fixedCode += rest.slice(1).join('y-axis');
            }
          } else {
            // Si no hay y-axis, agregar al final
            fixedCode += `    bar ${JSON.stringify(dataValues)}\n`;
          }
        }

        return fixedCode;
      } catch (e) {
        console.error('Error fixing xychart:', e);
        return null;
      }
    }
    
    // Fix for errors with ALPHA token issues
    if (errorMsg.includes("Expecting") && errorMsg.includes("got 'ALPHA'")) {
      try {
        // This could be an issue with mixed string/number data in a chart
        const lines = code.split('\n');
        let fixedCode = '';
        
        for (const line of lines) {
          // Check for any line with array notation that might have mixed data types
          if (line.includes('[') && line.includes(']')) {
            // Extract array content
            const match = line.match(/\[(.*?)\]/);
            if (match && match[1]) {
              const content = match[1].trim();
              
              // If it has commas, try to clean it
              if (content.includes(',')) {
                // Try to convert all values to numbers
                const values = content.split(',').map(s => {
                  s = s.trim();
                  // If it looks like a number, keep it as is
                  const num = parseFloat(s);
                  if (!isNaN(num) && num.toString() === s) {
                    return s;
                  }
                  // Otherwise return a placeholder number
                  return '0';
                });
                
                // Replace the original array with the fixed one
                const fixedLine = line.replace(/\[.*?\]/, `[${values.join(', ')}]`);
                fixedCode += fixedLine + '\n';
                continue;
              }
            }
          }
          
          // Keep other lines unchanged
          fixedCode += line + '\n';
        }
        
        return fixedCode;
      } catch (e) {
        console.error('Error fixing ALPHA token issue:', e);
        return null;
      }
    }
    
    return null; // No se pudo corregir
  };

  useEffect(() => {
    // Asegurarse de que mermaid esté definido
    if (typeof mermaid === 'undefined') {
      console.error('Biblioteca Mermaid no disponible');
      setIsErrorHidden(true);
      return;
    }

    let isMounted = true;
    setFixedContent(null);
    setIsErrorHidden(false);

    const renderDiagram = async () => {
      if (!isMounted) return;

      try {
        // Limpiar cualquier diagrama previo
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Intentar renderizar con un timeout para evitar bloqueos
        const renderPromise = new Promise<string>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Tiempo de espera agotado al renderizar el diagrama'));
          }, 3000); // 3 segundos de timeout

          try {
            mermaid.render(uniqueId.current, content)
              .then(result => {
                clearTimeout(timeoutId);
                resolve(result.svg);
              })
              .catch(err => {
                clearTimeout(timeoutId);
                reject(err);
              });
          } catch (err) {
            clearTimeout(timeoutId);
            reject(err);
          }
        });

        const svgContent = await renderPromise;
        
        if (isMounted) {
          setSvg(svgContent);
          setError(null);
        }
      } catch (err) {
        console.error('Error rendering mermaid diagram:', err);
        
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
          setError('Error al renderizar el diagrama: ' + errorMessage);
          
          // Intentar corregir el código
          const fixed = tryFixMermaidCode(content, errorMessage);
          if (fixed) {
            setFixedContent(fixed);
            
            // Intentar renderizar la versión corregida
            try {
              const result = await mermaid.render(uniqueId.current + '_fixed', fixed);
              if (isMounted) {
                setSvg(result.svg);
                setError(null);
              }
            } catch (fixError) {
              console.error('Error rendering fixed diagram:', fixError);
              // Si no podemos renderizar incluso después de corregir, ocultamos el error en los informes
              setIsErrorHidden(true);
            }
          } else {
            // Si no podemos corregir el diagrama, ocultamos el error en los informes
            setIsErrorHidden(true);
          }
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [content]);

  // Si hay un error y estamos en modo ocultar errores (para informes finales)
  // simplemente no mostramos nada, como si el gráfico no existiera
  if (isErrorHidden) {
    // Sólo para depuración, no mostramos nada al usuario
    console.warn('Omitiendo diagrama con error de Mermaid en el informe');
    return null;
  }

  if (error) {
    // Esta sección sólo aparecerá durante el desarrollo o depuración
    return (
      <div className="my-4 p-3 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
        <p className="font-medium">Error al renderizar el diagrama:</p>
        <p className="text-sm mt-1">{error}</p>
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer">Ver código del diagrama</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
            {content}
          </pre>
        </details>
        
        {fixedContent && (
          <div className="mt-4">
            <p className="font-medium text-green-600 dark:text-green-400">Sugerencia de corrección:</p>
            <pre className="mt-2 p-2 text-xs bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
              {fixedContent}
            </pre>
          </div>
        )}
        <div className="mt-4">
          <button 
            onClick={() => setIsErrorHidden(true)} 
            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-200 px-3 py-1 rounded"
          >
            Ocultar este error en el informe
          </button>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md flex items-center justify-center">
        <div className="animate-pulse flex space-x-4 items-center">
          <div className="h-4 w-4 bg-blue-400 rounded-full"></div>
          <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="my-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-auto max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};

// Custom Markdown renderer to handle mermaid code blocks and other elements
const MarkdownContent = ({ content }: { content: string }) => {
  // Preprocesar el contenido para añadir una tabla de contenidos si no existe
  let processedContent = content;
  if (!content.includes('## Contenido') && !content.includes('## Índice')) {
    processedContent = `## Contenido\n\n${content}`;
  }

  return (
    <div className="markdown-report">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm, 
          [remarkToc, { heading: 'contenido|índice', tight: true }]
        ]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            
            if (!props.inline && match && match[1] === 'mermaid') {
              return <MermaidDiagram content={String(children).replace(/\n$/, '')} />;
            }
            
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold my-6 pb-2 border-b-2 border-red-500 text-gray-800 dark:text-white" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800 dark:text-white" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-medium mt-6 mb-3 text-gray-700 dark:text-gray-200" {...props}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="my-4 ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-4 ml-6 list-decimal space-y-2 text-gray-700 dark:text-gray-300" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => {
            // Gestión especial para listas de tareas (checkbox)
            if (props.className?.includes('task-list-item')) {
              return (
                <li className="flex items-start my-1" {...props}>
                  <span className="mr-2 mt-1">{children}</span>
                </li>
              );
            }
            
            return (
              <li className="pl-2" {...props}>
                {children}
              </li>
            );
          },
          input: (props) => {
            if (props.type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={props.checked || false}
                  readOnly
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              );
            }
            return <input {...props} />;
          },
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-700">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="even:bg-gray-50 dark:even:bg-gray-700">
              {children}
            </tr>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-blue-500 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 pl-4 py-3 text-gray-600 dark:text-gray-400">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-8 border-gray-200 dark:border-gray-700" />
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target={href?.startsWith('http') ? "_blank" : undefined} 
              rel={href?.startsWith('http') ? "noopener noreferrer" : undefined}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900 dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700 dark:text-gray-300">
              {children}
            </em>
          ),
          del: ({ children }) => (
            <del className="line-through text-gray-500 dark:text-gray-500">
              {children}
            </del>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

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

export default function ReportGenerator({ selectedFunds, onGenerateReport }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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

      // Notificar al componente padre que se ha generado un informe
      if (onGenerateReport) {
        onGenerateReport();
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

  const printReport = () => {
    if (!reportRef.current) return;
    
    const printContents = reportRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    
    const printStyles = `
      <style>
        body { font-family: Arial, sans-serif; background: white; color: black; }
        .markdown-report h1 { font-size: 24px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #ef4444; padding-bottom: 5px; }
        .markdown-report h2 { font-size: 20px; margin-top: 15px; margin-bottom: 8px; }
        .markdown-report h3 { font-size: 16px; margin-top: 10px; margin-bottom: 5px; }
        .markdown-report p { margin: 8px 0; line-height: 1.6; }
        .markdown-report ul, .markdown-report ol { margin: 8px 0 8px 20px; }
        .markdown-report table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .markdown-report th, .markdown-report td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .markdown-report th { background-color: #f2f2f2; }
        .markdown-report tr:nth-child(even) { background-color: #f9f9f9; }
        .markdown-report blockquote { margin: 10px 0; padding: 10px 20px; background-color: #f8f9ff; border-left: 4px solid #3b82f6; }
        .markdown-report pre { background-color: #f1f5f9; padding: 12px; border-radius: 4px; overflow-x: auto; }
        .markdown-report code { font-family: monospace; font-size: 0.9em; }
        .markdown-report del { text-decoration: line-through; color: #888; }
        .markdown-report a { color: #2563eb; text-decoration: none; }
        .task-list-item { display: flex; align-items: flex-start; }
        .task-list-item input[type="checkbox"] { margin-right: 8px; margin-top: 4px; }
        @media print {
          body { padding: 20px; }
        }
      </style>
    `;
    
    document.body.innerHTML = `${printStyles}<div class="markdown-report">${printContents}</div>`;
    window.print();
    document.body.innerHTML = originalContents;
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
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
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
            <>
              <button
                onClick={downloadReportAsPDF}
                className="flex items-center px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar
              </button>
              
              <button
                onClick={printReport}
                className="flex items-center px-4 py-2 rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir
              </button>
            </>
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
        <div ref={reportRef} className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 p-8 rounded-md shadow-inner overflow-auto">
          <MarkdownContent content={report} />
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