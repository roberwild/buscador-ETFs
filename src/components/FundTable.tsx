import { useState, useEffect } from 'react';
import { useFunds } from '@/hooks/useFunds';
import { Fund, RiskLevel } from '@/types/fund';

export type ColumnId = 
  | 'info' 
  | 'risk_level' 
  | 'ytd_return' 
  | 'one_year_return' 
  | 'three_year_return' 
  | 'five_year_return' 
  | 'management_fee' 
  | 'morningstar_rating'
  | 'focus_list';

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
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'info', title: 'Fondo', visible: true },
  { id: 'risk_level', title: 'Riesgo', visible: true },
  { id: 'ytd_return', title: 'Rentabilidad', subTitle: '2025', visible: true },
  { id: 'one_year_return', title: 'Rentabilidad', subTitle: '1 año', visible: true },
  { id: 'three_year_return', title: 'Rentabilidad', subTitle: '3 años', visible: true },
  { id: 'five_year_return', title: 'Rentabilidad', subTitle: '5 años', visible: true },
  { id: 'management_fee', title: 'Comisiones totales (TER)', visible: true },
  { id: 'morningstar_rating', title: 'Rating Morningstar', visible: true },
  { id: 'focus_list', title: 'Focus List', visible: true },
];

export function FundTable({ 
  isinSearch, 
  selectedCategories, 
  selectedCurrency,
  selectedRiskLevels,
  dataSource = 'fondos-gestion-activa',
  visibleColumns,
  focusListFilter = 'Todos'
}: FundTableProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('ytd_return');

  // Determinar qué columnas mostrar
  const columns = DEFAULT_COLUMNS.map(col => ({
    ...col,
    // Ya no condicionamos la visibilidad de Focus List al tipo de datos
    visible: visibleColumns ? visibleColumns.includes(col.id) : col.visible
  }));

  // Obtenemos los fondos
  const { funds: allFunds, total: totalAll, totalPages, isLoading, error } = useFunds({
    page,
    limit: 10,
    search: isinSearch,
    category: selectedCategories.join(','),
    currency: selectedCurrency,
    sortBy,
    riskLevels: selectedRiskLevels.join(','),
    dataSource
  });

  // Filtramos por focus list si es necesario
  const funds = allFunds.filter(fund => {
    if (focusListFilter === 'Todos') {
      return true;
    }
    return fund.focus_list === focusListFilter;
  });

  const total = focusListFilter !== 'Todos' ? funds.length : totalAll;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [isinSearch, selectedCategories, selectedCurrency, selectedRiskLevels, dataSource, focusListFilter]);

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
        <h2 className="text-2xl font-medium text-gray-900">{total.toLocaleString()} {tableTitle}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ordenar por</span>
          <select 
            className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[200px]"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="ytd_return">Rentabilidad año actual</option>
            <option value="one_year_return">Rentabilidad 1 año</option>
            <option value="three_year_return">Rentabilidad 3 años</option>
            <option value="morningstar_rating">Rating Morningstar</option>
            <option value="management_fee">Comisiones TER</option>
          </select>
        </div>
      </div>
      <table className="min-w-full table-fixed">
        <thead className="bg-gray-200">
          <tr>
            {columns.filter(col => col.visible).map((column) => (
              <th 
                key={column.id}
                className={`px-4 py-2 ${column.id === 'info' ? 'text-left' : 'text-center'} text-sm font-medium text-gray-700 ${
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
                className="px-4 py-2 bg-gray-200 text-center text-xs text-gray-700"
              >
                {column.subTitle || ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {funds.map((fund, index) => (
            <tr key={fund.isin} className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
              {columns.find(col => col.id === 'info')?.visible && (
                <td className="px-4 py-4 w-[440px] min-w-[440px] max-w-[440px]">
                  <div className="space-y-0.5 text-left">
                    <a 
                      href={`/fondos/${fund.isin}`}
                      className="text-[#D1472C] underline font-semibold block text-base"
                    >
                      {fund.name}
                    </a>
                    <div className="text-sm text-gray-900 text-left"><span className="font-bold">ISIN:</span> <span className="font-bold">{fund.isin}</span></div>
                    <div className="text-sm text-gray-500 text-left">{fund.category}</div>
                    <div className="text-sm text-gray-500 text-left">{fund.management_company}</div>
                  </div>
                </td>
              )}
              
              {columns.find(col => col.id === 'risk_level')?.visible && (
                <td className="px-4 py-4 text-center">
                  <div className="text-sm font-medium">
                    {fund.risk_level}
                  </div>
                </td>
              )}
              
              {columns.find(col => col.id === 'ytd_return')?.visible && (
                <td className="px-4 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">{fund.ytd_return.toFixed(2)}%</div>
                </td>
              )}
              
              {columns.find(col => col.id === 'one_year_return')?.visible && (
                <td className="px-4 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">{fund.one_year_return.toFixed(2)}%</div>
                </td>
              )}
              
              {columns.find(col => col.id === 'three_year_return')?.visible && (
                <td className="px-4 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">{fund.three_year_return.toFixed(2)}%</div>
                </td>
              )}
              
              {columns.find(col => col.id === 'five_year_return')?.visible && (
                <td className="px-4 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">{fund.five_year_return.toFixed(2)}%</div>
                </td>
              )}
              
              {columns.find(col => col.id === 'management_fee')?.visible && (
                <td className="px-4 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">{fund.management_fee.toFixed(2)}%</div>
                </td>
              )}
              
              {columns.find(col => col.id === 'morningstar_rating')?.visible && (
                <td className="px-4 py-4 text-center">
                  <div className="flex justify-center items-center">
                    {Array.from({ length: fund.morningstar_rating || 0 }).map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                    {Array.from({ length: 5 - (fund.morningstar_rating || 0) }).map((_, i) => (
                      <span key={i} className="text-gray-300">★</span>
                    ))}
                  </div>
                </td>
              )}

              {columns.find(col => col.id === 'focus_list')?.visible && (
                <td className="px-4 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {fund.focus_list === 'Y' ? 'Sí' : 'No'}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setPage(page > 1 ? page - 1 : 1)}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{((page - 1) * 10) + 1}</span> a{' '}
              <span className="font-medium">{Math.min(page * 10, total)}</span> de{' '}
              <span className="font-medium">{total}</span> resultados
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setPage(page > 1 ? page - 1 : 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Siguiente</span>
                &gt;
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 