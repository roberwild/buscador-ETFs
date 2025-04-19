import { useState, useEffect, useMemo, useRef } from 'react';
import { useFunds } from '@/hooks/useFunds';
import { Fund, RiskLevel } from '@/types/fund';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  FilterFn,
  getFilteredRowModel,
  ColumnFiltersState,
  FilterFnOption,
  ColumnResizeMode,
} from '@tanstack/react-table';
import { Search, X, GripVertical, Columns } from 'lucide-react';

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
  | 'replication_type'
  | 'req';

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
  { id: 'req', title: 'REQ', visible: false },
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
  const [showNoFactsheetModal, setShowNoFactsheetModal] = useState(false);
  const [showNoKiidModal, setShowNoKiidModal] = useState(false);
  const [selectedFund, setSelectedFund] = useState<{name: string, isin: string} | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'ytd_return', desc: true }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [previousData, setPreviousData] = useState<Fund[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isChangingSort, setIsChangingSort] = useState(false);
  const [lastQueryParams, setLastQueryParams] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnResizeMode, setColumnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [columnSizing, setColumnSizing] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [isColumnSelectOpen, setIsColumnSelectOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hasManualColumnChanges, setHasManualColumnChanges] = useState(false);
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Monitor container width and update when resized
  useEffect(() => {
    if (!tableContainerRef.current) return;

    const updateWidth = () => {
      if (tableContainerRef.current) {
        setContainerWidth(tableContainerRef.current.offsetWidth);
      }
    };

    // Initial width
    updateWidth();

    // Update width on resize
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(tableContainerRef.current);

    return () => {
      if (tableContainerRef.current) {
        resizeObserver.unobserve(tableContainerRef.current);
      }
    };
  }, []);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isColumnSelectOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsColumnSelectOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColumnSelectOpen]);

  // Initialize column visibility based on visibleColumns prop
  useEffect(() => {
    if (!visibleColumns || hasManualColumnChanges) return;
    
    const initialVisibility: Record<string, boolean> = {};
    
    // Start with all columns hidden
    DEFAULT_COLUMNS.forEach(col => {
      initialVisibility[col.id] = false;
    });
    
    // Set visibility based on visibleColumns prop
    visibleColumns.forEach(colId => {
      initialVisibility[colId] = true;
    });
    
    // Always show info column
    initialVisibility['info'] = true;
    
    setColumnVisibility(initialVisibility);
  }, [visibleColumns, hasManualColumnChanges]);

  // Dynamically adjust column visibility based on available space
  useEffect(() => {
    if (containerWidth === 0 || !visibleColumns || hasManualColumnChanges) return;

    // Map of priority for columns (lower number = higher priority)
    const columnPriority: Record<string, number> = {
      'info': 1, // Always show
      'risk_level': 2,
      'ytd_return': 3,
      'one_year_return': 4,
      'focus_list': 5,
      'dividend_policy': 6,
      'three_year_return': 7,
      'five_year_return': 8,
      'management_fee': 9,
      'category': 10,
      // Lower priority columns
      'rating': 11,
      'maturity_range': 12,
      'currency': 13,
      'hedge': 14,
      'replication_type': 15,
      'implicit_advisory': 16,
      'explicit_advisory': 17,
      'compartment_code': 18,
      'req': 19
    };

    // Sort columns by priority
    const sortedColumns = [...visibleColumns].sort((a, b) => 
      (columnPriority[a] || 99) - (columnPriority[b] || 99)
    );

    // Estimate the fixed size needed for high priority columns
    // Main info column (440px) + minimum for 2-3 important columns
    const baseWidth = 440 + (120 * 3);
    
    // Available width for other columns
    const remainingWidth = Math.max(0, containerWidth - baseWidth);
    
    // Average width per column (excluding main info column)
    const avgColWidth = 120;
    
    // How many additional columns can we fit?
    const additionalCols = Math.max(0, Math.floor(remainingWidth / avgColWidth));
    
    // Total visible columns (info column + additional columns)
    const totalVisibleCols = 1 + additionalCols;
    
    // Set visibility based on priority and available space
    const newVisibility: Record<string, boolean> = {};
    
    sortedColumns.forEach((col, index) => {
      // Always show the info column
      if (col === 'info') {
        newVisibility[col] = true;
        return;
      }
      
      // Show columns until we hit the limit
      newVisibility[col] = index < totalVisibleCols;
    });
    
    setColumnVisibility(newVisibility);
  }, [containerWidth, visibleColumns, hasManualColumnChanges]);

  // Create a query params string to detect when only sort/page changes vs filter changes
  const currentQueryParams = useMemo(() => {
    return `${isinSearch}-${selectedCategories.join(',')}-${selectedCurrency}-${selectedRiskLevels.join(',')}-${dataSource}-${focusListFilter}-${implicitAdvisoryFilter}-${explicitAdvisoryFilter}-${hedgeFilter}-${dividendPolicyFilter}-${replicationTypeFilter}`;
  }, [isinSearch, selectedCategories, selectedCurrency, selectedRiskLevels, dataSource, focusListFilter, implicitAdvisoryFilter, explicitAdvisoryFilter, hedgeFilter, dividendPolicyFilter, replicationTypeFilter]);

  // Obtenemos los fondos
  const { funds, total, totalPages, isLoading, error } = useFunds({
    page: currentPage + 1, // API uses 1-based paging
    limit: pageSize,
    search: isinSearch,
    category: selectedCategories.join(','),
    currency: selectedCurrency,
    sortBy: sorting.length > 0 ? sorting[0].id : 'ytd_return',
    riskLevels: selectedRiskLevels.join(','),
    dataSource,
    focusListFilter,
    implicitAdvisoryFilter,
    explicitAdvisoryFilter,
    hedgeFilter,
    dividendPolicyFilter,
    replicationTypeFilter
  });

  // Detect if we're changing sort/page vs changing filters
  useEffect(() => {
    const isSortingOrPaging = lastQueryParams === currentQueryParams && lastQueryParams !== '';
    setIsChangingSort(isLoading && isSortingOrPaging);
    
    // Update the last query params if we have completed loading
    if (!isLoading) {
      setLastQueryParams(currentQueryParams);
    }
  }, [isLoading, currentQueryParams, lastQueryParams]);

  // Save previous data to avoid flicker during loading
  useEffect(() => {
    if (!isLoading && funds.length > 0) {
      setPreviousData(funds);
      setIsInitialLoading(false);
    }
  }, [isLoading, funds]);

  // Detect when filters change (not just sort/page)
  useEffect(() => {
    // When actual filters change (not just sorting or pagination)
    if (lastQueryParams !== '' && lastQueryParams !== currentQueryParams) {
      setCurrentPage(0);
      setIsInitialLoading(true);
    }
  }, [currentQueryParams, lastQueryParams]);

  // The actual data to display
  const tableData = useMemo(() => {
    if (isChangingSort) {
      return previousData;
    }
    return funds.length > 0 ? funds : (isInitialLoading ? [] : previousData);
  }, [funds, previousData, isChangingSort, isInitialLoading]);

  // Get sort by string for API from sorting state
  const sortBy = useMemo(() => {
    if (sorting.length === 0) return 'ytd_return';
    const sortField = sorting[0].id;
    return sortField;
  }, [sorting]);

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

  // Global search filter
  const fuzzyFilter: FilterFn<Fund> = (row, columnId, value, addMeta) => {
    // Skip empty values
    if (!value || typeof value !== 'string') return true;
    
    const searchLower = value.toLowerCase();
    
    // Search in all visible text fields
    const fund = row.original;
    const searchableText = [
      fund.name, 
      fund.isin, 
      fund.category, 
      fund.management_company,
      fund.risk_level,
      fund.dividend_policy === 'C' ? 'acumulación' : 
        fund.dividend_policy === 'D' ? 'distribución' : fund.dividend_policy,
      fund.replication_type || '',
      fund.rating || '',
      fund.maturity_range || '',
      fund.compartment_code || '',
      fund.focus_list === 'Y' ? 'focus list' : '',
      fund.hedge === 'Y' ? 'hedge' : '',
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchableText.includes(searchLower);
  };

  const columnHelper = createColumnHelper<Fund>();

  // Create columns based on visible columns with default sizes
  const columns = useMemo(() => {
    const cols: any[] = [];

    if (visibleColumns?.includes('info') || true) { // Always include info column
      cols.push(
        columnHelper.accessor('name', {
          id: 'info',
          header: 'Fondo',
          size: 440,
          minSize: 250,
          maxSize: 600,
          cell: ({ row }) => {
            const fund = row.original;
  return (
                            <div className="space-y-0.5 text-left">
                              <div className="flex justify-between items-start">
                                <button 
                                  onClick={() => handleFundNameClick(fund)}
                                  className="text-[#D1472C] underline font-semibold block text-base text-left cursor-pointer"
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
                <div className="text-sm text-gray-900 dark:text-gray-200 text-left">
                  <span className="font-bold">ISIN:</span> <span className="font-bold">{fund.isin}</span>
                </div>
                              <div className="text-sm text-gray-500 dark:text-gray-300 text-left">{fund.category}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-300 text-left">{fund.management_company}</div>
                            </div>
            );
          }
        })
      );
    }

    if (visibleColumns?.includes('category')) {
      cols.push(
        columnHelper.accessor('category', {
          header: 'Categoría',
          size: 140,
          minSize: 100,
          maxSize: 300,
          cell: info => <div className="text-center">{info.getValue()}</div>
        })
      );
    }

    // Add minSize and maxSize to all other columns
    // Defining standard sizes for each column type
    const standardColumnProps = {
      minSize: 100,
      maxSize: 300,
    };

    if (visibleColumns?.includes('implicit_advisory')) {
      cols.push(
        columnHelper.accessor('available_for_implicit_advisory', {
          header: 'Disponible para asesoramiento con cobro implícito',
          size: 200,
          ...standardColumnProps,
          cell: info => <div className="text-center">{info.getValue() ? 'Sí' : 'No'}</div>
        })
      );
    }

    if (visibleColumns?.includes('explicit_advisory')) {
      cols.push(
        columnHelper.accessor('available_for_explicit_advisory', {
          header: 'Disponible para asesoramiento con cobro explícito',
          size: 200,
          ...standardColumnProps,
          cell: info => <div className="text-center">{info.getValue() ? 'Sí' : 'No'}</div>
        })
      );
    }

    if (visibleColumns?.includes('currency')) {
      cols.push(
        columnHelper.accessor('currency', {
          header: 'Divisa',
          size: 100,
          ...standardColumnProps,
          cell: info => <div className="text-center">{info.getValue()}</div>
        })
      );
    }

    if (visibleColumns?.includes('hedge')) {
      cols.push(
        columnHelper.accessor('hedge', {
          header: 'Hedge',
          size: 100,
          ...standardColumnProps,
          cell: info => <div className="text-center">{info.getValue() === 'Y' ? 'Sí' : 'No'}</div>
        })
      );
    }

    if (visibleColumns?.includes('risk_level')) {
      cols.push(
        columnHelper.accessor('risk_level', {
          header: 'Riesgo',
          size: 140,
          ...standardColumnProps,
          cell: info => {
            const riskLevel = info.getValue();
            let riskColor = 'bg-gray-100 text-gray-700';
            
            // Assign colors based on risk level
            if (riskLevel === 'Riesgo bajo') {
              riskColor = 'bg-green-100 text-green-800';
            } else if (riskLevel === 'Riesgo moderado') {
              riskColor = 'bg-blue-100 text-blue-800';
            } else if (riskLevel === 'Riesgo medio-alto') {
              riskColor = 'bg-yellow-100 text-yellow-800';
            } else if (riskLevel === 'Riesgo alto') {
              riskColor = 'bg-orange-100 text-orange-800';
            } else if (riskLevel === 'Riesgo muy alto') {
              riskColor = 'bg-red-100 text-red-800';
            }
            
                        return (
              <div className="text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskColor}`}>
                  {riskLevel}
                </span>
                            </div>
            );
          }
        })
      );
    }

    if (visibleColumns?.includes('req')) {
      cols.push(
        columnHelper.accessor('req', {
          header: 'REQ',
          size: 100,
          ...standardColumnProps,
          cell: info => <div className="text-center">{info.getValue()}</div>
        })
      );
    }

    if (visibleColumns?.includes('dividend_policy')) {
      cols.push(
        columnHelper.accessor('dividend_policy', {
          header: 'Política de dividendos',
          size: 200,
          ...standardColumnProps,
          cell: info => {
            const value = info.getValue();
            const isAccumulation = value === 'C';
            const isDistribution = value === 'D';
            
            if (isAccumulation) {
                        return (
                <div className="text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Acumulación
                  </span>
                            </div>
                        );
            } else if (isDistribution) {
                        return (
                <div className="text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    Distribución
                  </span>
                            </div>
              );
            }
            
            return <div className="text-center">{value}</div>;
          }
        })
      );
    }

    if (visibleColumns?.includes('replication_type')) {
      cols.push(
        columnHelper.accessor('replication_type', {
          header: 'Tipo de Réplica',
          size: 140,
          ...standardColumnProps,
          cell: info => <div className="text-center">{info.getValue() || '-'}</div>
        })
      );
    }

    if (visibleColumns?.includes('ytd_return')) {
      cols.push(
        columnHelper.accessor('ytd_return', {
          header: () => (
            <div>
              <div>Rentabilidad</div>
              <div className="text-xs">2025</div>
            </div>
          ),
          size: 120,
          ...standardColumnProps,
          cell: info => {
            const value = info.getValue();
            const color = value >= 0 ? 'text-green-600' : 'text-red-600';
            const formattedValue = value.toFixed(2);
                        return (
              <div className={`text-center font-medium ${color}`}>
                {formattedValue}%
                {value >= 0 ? 
                  <span className="inline-block ml-1">▲</span> :
                  <span className="inline-block ml-1">▼</span>
                }
                            </div>
            );
          }
        })
      );
    }

    if (visibleColumns?.includes('one_year_return')) {
      cols.push(
        columnHelper.accessor('one_year_return', {
          header: () => (
            <div>
              <div>Rentabilidad</div>
              <div className="text-xs">1 año</div>
            </div>
          ),
          size: 120,
          ...standardColumnProps,
          cell: info => {
            const value = info.getValue();
            const color = value >= 0 ? 'text-green-600' : 'text-red-600';
            const formattedValue = value.toFixed(2);
                        return (
              <div className={`text-center font-medium ${color}`}>
                {formattedValue}%
                {value >= 0 ? 
                  <span className="inline-block ml-1">▲</span> :
                  <span className="inline-block ml-1">▼</span>
                }
                            </div>
            );
          }
        })
      );
    }

    if (visibleColumns?.includes('three_year_return')) {
      cols.push(
        columnHelper.accessor('three_year_return', {
          header: () => (
            <div>
              <div>Rentabilidad</div>
              <div className="text-xs">3 años</div>
            </div>
          ),
          size: 120,
          ...standardColumnProps,
          cell: info => {
            const value = info.getValue();
            const color = value >= 0 ? 'text-green-600' : 'text-red-600';
            const formattedValue = value.toFixed(2);
                        return (
              <div className={`text-center font-medium ${color}`}>
                {formattedValue}%
                {value >= 0 ? 
                  <span className="inline-block ml-1">▲</span> :
                  <span className="inline-block ml-1">▼</span>
                }
                            </div>
            );
          }
        })
      );
    }

    if (visibleColumns?.includes('five_year_return')) {
      cols.push(
        columnHelper.accessor('five_year_return', {
          header: () => (
            <div>
              <div>Rentabilidad</div>
              <div className="text-xs">5 años</div>
            </div>
          ),
          size: 120,
          ...standardColumnProps,
          cell: info => {
            const value = info.getValue();
            const color = value >= 0 ? 'text-green-600' : 'text-red-600';
            const formattedValue = value.toFixed(2);
                        return (
              <div className={`text-center font-medium ${color}`}>
                {formattedValue}%
                {value >= 0 ? 
                  <span className="inline-block ml-1">▲</span> :
                  <span className="inline-block ml-1">▼</span>
                }
                            </div>
            );
          }
        })
      );
    }

    if (visibleColumns?.includes('management_fee')) {
      cols.push(
        columnHelper.accessor('management_fee', {
          header: 'Comisiones totales (TER)',
          size: 140,
          ...standardColumnProps,
          cell: info => {
            const value = info.getValue();
            // Apply color gradient based on fee amount
            let color = 'text-gray-900';
            if (value < 0.5) color = 'text-green-600';
            else if (value < 1.0) color = 'text-emerald-600';
            else if (value < 1.5) color = 'text-amber-600';
            else if (value < 2.0) color = 'text-orange-600';
            else color = 'text-red-600';
            
                        return (
              <div className={`text-center font-medium ${color} dark:text-opacity-90`}>
                {value.toFixed(2)}%
                            </div>
            );
          }
        })
      );
    }

    if (visibleColumns?.includes('rating')) {
      cols.push(
        columnHelper.accessor('rating', {
          header: 'Calificación',
          size: 140,
          ...standardColumnProps,
          cell: info => {
            const rating = info.getValue();
            if (!rating) return <div className="text-center text-gray-400">-</div>;
            
            // Apply styles based on credit rating
            let badgeClass = 'text-xs font-medium px-2.5 py-0.5 rounded';
            
            // Investment grade
            if(['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-'].includes(rating)) {
              badgeClass += ' bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            } 
            // Non-investment grade
            else if(['BB+', 'BB', 'BB-', 'B+', 'B', 'B-'].includes(rating)) {
              badgeClass += ' bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            }
            // Highly speculative
            else {
              badgeClass += ' bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            }
            
            return <div className="text-center"><span className={badgeClass}>{rating}</span></div>;
          }
        })
      );
    }

    if (visibleColumns?.includes('maturity_range')) {
      cols.push(
        columnHelper.accessor('maturity_range', {
          header: 'Rango de vencimientos',
          size: 140,
          ...standardColumnProps,
          cell: info => <div className="text-center">{info.getValue() || '-'}</div>
        })
      );
    }

    if (visibleColumns?.includes('focus_list')) {
      cols.push(
        columnHelper.accessor('focus_list', {
          header: 'Focus List',
          size: 140,
          ...standardColumnProps,
          cell: info => {
            const isFocusList = info.getValue() === 'Y';
                        return (
              <div className="text-center">
                {isFocusList ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Sí
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No</span>
                )}
                            </div>
            );
          }
        })
      );
    }

    if (visibleColumns?.includes('compartment_code')) {
      cols.push(
        columnHelper.accessor('compartment_code', {
          header: 'Código de compartimento',
          size: 140,
          ...standardColumnProps,
          cell: info => <div className="text-center">{info.getValue()}</div>
        })
      );
    }

    return cols;
  }, [visibleColumns, columnHelper]);

  const table = useReactTable({
    data: tableData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnSizing,
      columnVisibility,
    },
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: fuzzyFilter,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updater) => {
      setSorting(updater);
    },
    debugTable: true,
    enableColumnResizing: true,
    columnResizeDirection: 'ltr',
  });

  // Create a dropdown to toggle column visibility
  const renderColumnToggle = () => {
    return (
      <div className="relative ml-2" ref={dropdownRef}>
        <button 
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-white flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            setIsColumnSelectOpen(!isColumnSelectOpen);
          }}
        >
          <Columns size={16} className="mr-1" />
          <span>Columnas</span>
        </button>
        
        {isColumnSelectOpen && (
          <div 
            className="fixed mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-2 z-50 min-w-[200px]"
            style={{
              top: (dropdownRef.current?.getBoundingClientRect().bottom ?? 0) + window.scrollY + 5,
              right: window.innerWidth - ((dropdownRef.current?.getBoundingClientRect().right ?? 0) + window.scrollX),
            }}
          >
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Columnas visibles
              </div>
              <div className="flex gap-2">
                <button
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setHasManualColumnChanges(true);
                    table.toggleAllColumnsVisible(true);
                  }}
                >
                  Todas
                </button>
                <button
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setHasManualColumnChanges(true);
                    // First hide all columns
                    table.toggleAllColumnsVisible(false);
                    // Then show only the info column
                    table.getColumn('info')?.toggleVisibility(true);
                  }}
                >
                  Ninguna
                </button>
              </div>
            </div>
            
            {table.getAllLeafColumns().map(column => {
              // Skip the info column as it should always be visible
              if (column.id === 'info') return null;
              
              return (
                <div key={column.id} className="flex items-center py-1">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHasManualColumnChanges(true);
                      column.toggleVisibility();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label 
                    className="text-sm text-gray-700 dark:text-gray-300 flex-1 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHasManualColumnChanges(true);
                      column.toggleVisibility();
                    }}
                  >
                    {column.columnDef.header instanceof Function 
                      ? (column.columnDef.header as any)().props?.children[0]?.props?.children || column.id
                      : column.columnDef.header?.toString() || column.id}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Personalizar el título según la fuente de datos
  let tableTitle = 'resultados';

  if (error) {
                        return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error: {error}
                            </div>
                        );
  }

  // Only show full loading state on initial load with no previous data
  if (isInitialLoading && previousData.length === 0) {
                        return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                            </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 w-full sm:w-auto max-w-lg">
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="pl-10 pr-10 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                         focus:border-red-500 focus:ring-1 focus:ring-red-500 
                         bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Buscar en la tabla..."
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            {globalFilter && (
              <button 
                onClick={() => setGlobalFilter('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {globalFilter && (
              <span>
                {table.getFilteredRowModel().rows.length} resultado{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''} encontrado{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <h2 className="text-base font-medium text-gray-900 dark:text-white hidden sm:block">{total.toLocaleString()} {tableTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Ordenar por</span>
          <select 
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm md:min-w-[200px] dark:bg-gray-800 dark:text-white"
            value={sortBy}
            onChange={(e) => {
              const newSortField = e.target.value;
              setSorting([{ id: newSortField, desc: true }]);
            }}
            disabled={isLoading} // Prevent changing sort while loading
          >
            <option value="ytd_return">Rentabilidad año actual</option>
            <option value="one_year_return">Rentabilidad 1 año</option>
            <option value="three_year_return">Rentabilidad 3 años</option>
            <option value="management_fee">Comisiones TER</option>
          </select>
          {renderColumnToggle()}
          {isLoading && (
            <div className="ml-2 animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
          )}
        </div>
      </div>
      
      {/* Mobile title - only visible on small screens */}
      <div className="sm:hidden mb-4 overflow-hidden">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">{total.toLocaleString()} {tableTitle}</h2>
      </div>
        
      {/* Always show the table container even when loading */}
      <div className="relative overflow-hidden shadow-md sm:rounded-lg mb-6">
        {/* Use more visible loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/40 dark:bg-gray-800/40 backdrop-blur-[1px] z-[5] pointer-events-none flex items-center justify-center">
            {isInitialLoading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 dark:border-gray-300"></div>
            )}
          </div>
        )}

        <div 
          className="w-full" 
          ref={tableContainerRef}
        >
          <div className="relative w-full overflow-auto">
            <table 
              className="w-full border-separate border-spacing-0 table-auto"
            >
              <thead className="bg-gray-100 dark:bg-gray-700">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id}
                        className={`
                          sticky top-0 z-10
                          px-4 py-3 
                          ${header.id.includes('info') ? 'text-left' : 'text-center'} 
                          text-sm font-medium text-gray-700 dark:text-gray-200
                          border-b border-gray-200 dark:border-gray-600
                          border-r border-gray-200 dark:border-gray-600
                          bg-gray-100 dark:bg-gray-700
                          relative
                          group
                        `}
                        style={{
                          width: header.getSize(),
                          maxWidth: header.getSize(),
                        }}
                        colSpan={header.colSpan}
                      >
                        <div className="flex items-center justify-between h-full">
                          <div 
                            className={`${!header.id.includes('info') ? 'mx-auto' : ''} truncate`}
                            onClick={header.column.getToggleSortingHandler()}
                            style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                            title={header.column.columnDef.header instanceof Function 
                              ? (header.column.columnDef.header as any)().props?.children[0]?.props?.children 
                              : header.column.columnDef.header?.toString()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="ml-1">
                                {{
                                  asc: <span className="text-slate-700 dark:text-slate-300">↑</span>,
                                  desc: <span className="text-slate-700 dark:text-slate-300">↓</span>,
                                }[header.column.getIsSorted() as string] ?? 
                                (header.column.getCanSort() ? <span className="text-slate-400 dark:text-slate-500">⇅</span> : null)}
                              </span>
                            )}
                          </div>
                        </div>
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="absolute top-0 right-0 h-full w-2 cursor-col-resize select-none touch-none z-10"
                          >
                            <div className="absolute right-0 h-full w-px bg-gray-300 dark:bg-gray-600 opacity-100"></div>
                          </div>
                        )}
                      </th>
                    ))}
                </tr>
              ))}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-600 bg-white dark:bg-gray-800">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, index) => (
                    <tr 
                      key={row.id} 
                      className={`
                        ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} 
                        hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150
                        ${(row.original.focus_list === 'Y') ? 'ring-1 ring-inset ring-purple-100 dark:ring-purple-900' : ''}
                      `}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td 
                          key={cell.id}
                          className={`
                            px-4 py-4 
                            ${cell.column.id.includes('info') ? 'text-left' : 'text-center'} 
                            border-b border-gray-100 dark:border-gray-700
                            border-r border-gray-100 dark:border-gray-700
                          `}
                          style={{
                            width: cell.column.getSize(),
                            maxWidth: cell.column.getSize(),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={table.getAllColumns().length} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {globalFilter ? 'No se encontraron resultados para esta búsqueda' : 'No se encontraron fondos que coincidan con los criterios de búsqueda'}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">
                {currentPage * pageSize + 1}
              </span> a{' '}
              <span className="font-medium">
                {Math.min((currentPage + 1) * pageSize, total)}
              </span> de{' '}
              <span className="font-medium">{total}</span> resultados
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
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
                  pageNum = i;
                } else if (currentPage <= 2) {
                  pageNum = i;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNum
                        ? 'z-10 bg-gray-900 dark:bg-red-700 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700'
                        : 'text-gray-900 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
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