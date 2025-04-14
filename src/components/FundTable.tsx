import { useState, useEffect } from 'react';
import { useFunds } from '@/hooks/useFunds';
import { Fund, RiskLevel } from '@/types/fund';

export type ColumnId = 
  | 'info' 
  | 'implicit_advisory'
  | 'explicit_advisory'
  | 'currency'
  | 'hedge'
  | 'risk_level' 
  | 'ytd_return' 
  | 'one_year_return' 
  | 'three_year_return' 
  | 'five_year_return' 
  | 'management_fee' 
  | 'focus_list'
  | 'factsheet_url'
  | 'compartment_code'
  | 'category'
  | 'maturity_range'
  | 'rating'
  | 'dividend_policy'
  | 'replication_type';

export interface ColumnConfig {
  id: ColumnId;
  title: string;
  subTitle?: string;
  visible: boolean;
}

interface FundTableProps {
  isinSearch: string;
  selectedCategories: string[];
  selectedCurrency: string;
  selectedRiskLevels: RiskLevel[];
  dataSource?: string;
  visibleColumns?: ColumnId[];
  focusListFilter?: string;
  implicitAdvisoryFilter?: string;
  explicitAdvisoryFilter?: string;
  hedgeFilter?: string;
  dividendPolicyFilter?: string;
  replicationTypeFilter?: 'Todos' | 'Física' | 'Sintética';
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'info', title: 'Fondo', visible: true },
  { id: 'category', title: 'Categoría', visible: true },
  { id: 'implicit_advisory', title: 'Disponible para asesoramiento con cobro implícito', visible: false },
  { id: 'explicit_advisory', title: 'Disponible para asesoramiento con cobro explícito', visible: false },
  { id: 'currency', title: 'Divisa', visible: false },
  { id: 'hedge', title: 'Hedge', visible: false },
  { id: 'risk_level', title: 'Riesgo', visible: true },
  { id: 'dividend_policy', title: 'Política de dividendos', visible: true },
  { id: 'replication_type', title: 'Tipo de Réplica', visible: false },
  { id: 'ytd_return', title: 'Rentabilidad', subTitle: '2025', visible: true },
  { id: 'one_year_return', title: 'Rentabilidad', subTitle: '1 año', visible: true },
  { id: 'three_year_return', title: 'Rentabilidad', subTitle: '3 años', visible: true },
  { id: 'five_year_return', title: 'Rentabilidad', subTitle: '5 años', visible: true },
  { id: 'management_fee', title: 'Comisiones totales (TER)', visible: true },
  { id: 'rating', title: 'Calificación', visible: false },
  { id: 'maturity_range', title: 'Rango de vencimientos', visible: false },
  { id: 'focus_list', title: 'Focus List', visible: true },
  { id: 'factsheet_url', title: 'URL Ficha Comercial', visible: false },
  { id: 'compartment_code', title: 'Código de compartimento', visible: false },
];

// Componente para el modal de aviso cuando no hay ficha comercial
interface NoFactsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundName: string;
  fundIsin: string;
}

function NoFactsheetModal({ isOpen, onClose, fundName, fundIsin }: NoFactsheetModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No se encuentra ficha comercial</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
            No hay ficha comercial disponible para el fondo {fundName} ({fundIsin}).
          </p>
        </div>

        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#D1472C] text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            onClick={onClose}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para el modal de aviso cuando no hay documento KIID disponible
interface NoKiidModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundName: string;
  fundIsin: string;
}

function NoKiidModal({ isOpen, onClose, fundName, fundIsin }: NoKiidModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">KIID PRIIPS No disponible</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
            No hay documento KIID PRIIPS disponible para el fondo {fundName} ({fundIsin}).
          </p>
        </div>

        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#D1472C] text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            onClick={onClose}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export function FundTable({ 
  isinSearch, 
  selectedCategories, 
  selectedCurrency,
  selectedRiskLevels,
  dataSource = 'fondos-gestion-activa',
  visibleColumns,
  focusListFilter = 'Todos',
  implicitAdvisoryFilter = 'Todos',
  explicitAdvisoryFilter = 'Todos',
  hedgeFilter = 'Todos',
  dividendPolicyFilter = 'Todos',
  replicationTypeFilter = 'Todos'
}: FundTableProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('ytd_return');
  const [showNoFactsheetModal, setShowNoFactsheetModal] = useState(false);
  const [showNoKiidModal, setShowNoKiidModal] = useState(false);
  const [selectedFund, setSelectedFund] = useState<{name: string, isin: string} | null>(null);

  // Determinar qué columnas mostrar
  const columns = DEFAULT_COLUMNS.map(col => ({
    ...col,
    // Ya no condicionamos la visibilidad de Focus List al tipo de datos
    visible: visibleColumns ? visibleColumns.includes(col.id) : col.visible
  }));

  // Obtenemos los fondos
  const { funds, total, totalPages, isLoading, error } = useFunds({
    page,
    limit: 20,
    search: isinSearch,
    category: selectedCategories.join(','),
    currency: selectedCurrency,
    sortBy,
    riskLevels: selectedRiskLevels.join(','),
    dataSource,
    focusListFilter,
    implicitAdvisoryFilter,
    explicitAdvisoryFilter,
    hedgeFilter,
    dividendPolicyFilter,
    replicationTypeFilter
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [isinSearch, selectedCategories, selectedCurrency, selectedRiskLevels, dataSource, focusListFilter, implicitAdvisoryFilter, explicitAdvisoryFilter, hedgeFilter, dividendPolicyFilter, replicationTypeFilter]);

  // Función para manejar el clic en el nombre del fondo
  const handleFundNameClick = (fund: Fund) => {
    if (fund.factsheet_url) {
      // Si tiene URL de ficha comercial, abrir en nueva pestaña
      window.open(fund.factsheet_url, '_blank', 'noopener,noreferrer');
    } else {
      // Si no tiene URL, mostrar el modal
      setSelectedFund({ name: fund.name, isin: fund.isin });
      setShowNoFactsheetModal(true);
    }
  };

  // Función para manejar el clic en el botón KIID
  const handleKiidClick = (e: React.MouseEvent, fund: Fund) => {
    e.stopPropagation();
    
    // Para depuración
    console.log(`KIID click for ${fund.isin}:`, fund.kiid_url);
    
    if (fund.kiid_url && fund.kiid_url.trim() !== '') {
      // Si tiene URL de KIID, abrir en nueva pestaña
      try {
        window.open(fund.kiid_url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Error opening KIID URL:', error);
        // Si hay error al abrir, mostrar el modal
        setSelectedFund({ name: fund.name, isin: fund.isin });
        setShowNoKiidModal(true);
      }
    } else {
      // Si no tiene URL, mostrar el modal
      setSelectedFund({ name: fund.name, isin: fund.isin });
      setShowNoKiidModal(true);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  // Personalizar el título según la fuente de datos
  let tableTitle = 'Fondos de inversión';
  if (dataSource === 'etf-y-etc') {
    tableTitle = 'ETFs y ETCs';
  } else if (dataSource === 'fondos-indexados') {
    tableTitle = 'Fondos indexados';
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-white">{total.toLocaleString()} {tableTitle}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">Ordenar por</span>
          <select 
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm min-w-[200px] dark:bg-gray-800 dark:text-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="ytd_return">Rentabilidad año actual</option>
            <option value="one_year_return">Rentabilidad 1 año</option>
            <option value="three_year_return">Rentabilidad 3 años</option>
            <option value="management_fee">Comisiones TER</option>
          </select>
        </div>
      </div>
      <div className="relative overflow-hidden shadow-md sm:rounded-lg mb-6">
        <div className="overflow-x-auto pb-3" style={{ 
          maxWidth: '100%',
          scrollbarWidth: 'thin', 
          scrollbarColor: '#d1d5db #f3f4f6',
          WebkitOverflowScrolling: 'touch'
        }}>
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                {columns.filter(col => col.visible).map((column) => (
                  <th 
                    key={column.id}
                    className={`px-4 py-2 ${column.id === 'info' ? 'text-left' : 'text-center'} text-sm font-medium text-gray-700 dark:text-gray-200 ${
                      column.id === 'info' ? 'w-[440px] min-w-[440px] max-w-[440px]' : ''
                    }`}
                    colSpan={column.id === 'ytd_return' || column.id === 'one_year_return' || column.id === 'three_year_return' || column.id === 'five_year_return' ? 1 : undefined}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
              {/* Subtítulos para columnas de rentabilidad */}
              <tr>
                {columns.filter(col => col.visible).map((column) => (
                  <th 
                    key={`sub-${column.id}`}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-center text-xs text-gray-700 dark:text-gray-200"
                  >
                    {column.subTitle || ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
              {funds.map((fund, index) => (
                <tr key={fund.isin} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}>
                  {columns.filter(col => col.visible).map(column => {
                    switch(column.id) {
                      case 'info':
                        return (
                          <td key={column.id} className="px-4 py-4 w-[440px] min-w-[440px] max-w-[440px]">
                            <div className="space-y-0.5 text-left">
                              <div className="flex justify-between items-start">
                                <button 
                                  onClick={() => handleFundNameClick(fund)}
                                  className="text-[#D1472C] underline font-semibold block text-base text-left cursor-pointer"
                                  style={{ textAlign: 'left' }}
                                >
                                  {fund.name}
                                </button>
                                <button 
                                  onClick={(e) => handleKiidClick(e, fund)}
                                  className="text-[#D1472C] border border-[#D1472C] rounded px-2 py-1 ml-2 flex-shrink-0 cursor-pointer"
                                >
                                  KIID
                                </button>
                              </div>
                              <div className="text-sm text-gray-900 dark:text-gray-200 text-left"><span className="font-bold">ISIN:</span> <span className="font-bold">{fund.isin}</span></div>
                              <div className="text-sm text-gray-500 dark:text-gray-300 text-left">{fund.category}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-300 text-left">{fund.management_company}</div>
                            </div>
                          </td>
                        );
                      case 'risk_level':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.risk_level}
                            </div>
                          </td>
                        );
                      case 'ytd_return':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{fund.ytd_return.toFixed(2)}%</div>
                          </td>
                        );
                      case 'one_year_return':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{fund.one_year_return.toFixed(2)}%</div>
                          </td>
                        );
                      case 'three_year_return':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{fund.three_year_return.toFixed(2)}%</div>
                          </td>
                        );
                      case 'five_year_return':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{fund.five_year_return.toFixed(2)}%</div>
                          </td>
                        );
                      case 'management_fee':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{fund.management_fee.toFixed(2)}%</div>
                          </td>
                        );
                      case 'focus_list':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.focus_list === 'Y' ? 'Sí' : 'No'}
                            </div>
                          </td>
                        );
                      case 'implicit_advisory':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.available_for_implicit_advisory ? 'Sí' : 'No'}
                            </div>
                          </td>
                        );
                      case 'explicit_advisory':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.available_for_explicit_advisory ? 'Sí' : 'No'}
                            </div>
                          </td>
                        );
                      case 'currency':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.currency}
                            </div>
                          </td>
                        );
                      case 'hedge':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.hedge === 'Y' ? 'Sí' : 'No'}
                            </div>
                          </td>
                        );
                      case 'compartment_code':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.compartment_code}
                            </div>
                          </td>
                        );
                      case 'category':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.category}
                            </div>
                          </td>
                        );
                      case 'rating':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.rating}
                            </div>
                          </td>
                        );
                      case 'maturity_range':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.maturity_range}
                            </div>
                          </td>
                        );
                      case 'dividend_policy':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.dividend_policy === 'C' ? 'Acumulación' : 
                               fund.dividend_policy === 'D' ? 'Distribución' : 
                               fund.dividend_policy}
                            </div>
                          </td>
                        );
                      case 'replication_type':
                        return (
                          <td key={column.id} className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              {fund.replication_type || '-'}
                            </div>
                          </td>
                        );
                      default:
                        return null;
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sticky bottom-0 left-0 right-0 h-2 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div className="h-full w-full overflow-x-scroll" aria-hidden="true"></div>
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setPage(page > 1 ? page - 1 : 1)}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">
                {((page - 1) * 20) + 1}
              </span> a{' '}
              <span className="font-medium">
                {Math.min(page * 20, total)}
              </span> de{' '}
              <span className="font-medium">{total}</span> resultados
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setPage(page > 1 ? page - 1 : 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Anterior</span>
                &lt;
              </button>

              {/* Páginas centrales */}
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum;
                // Mostrar 5 páginas centradas en la actual si es posible
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === pageNum
                        ? 'z-10 bg-gray-900 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Siguiente</span>
                &gt;
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Modal para mostrar cuando no hay ficha comercial */}
      {selectedFund && (
        <NoFactsheetModal
          isOpen={showNoFactsheetModal}
          onClose={() => setShowNoFactsheetModal(false)}
          fundName={selectedFund.name}
          fundIsin={selectedFund.isin}
        />
      )}

      {/* Modal para mostrar cuando no hay documento KIID */}
      {selectedFund && (
        <NoKiidModal
          isOpen={showNoKiidModal}
          onClose={() => setShowNoKiidModal(false)}
          fundName={selectedFund.name}
          fundIsin={selectedFund.isin}
        />
      )}
    </div>
  );
} 