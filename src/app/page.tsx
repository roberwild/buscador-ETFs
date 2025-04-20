'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Filter, X, ChevronLeft, ChevronRight, Columns, Eye, EyeOff, ChevronDown, ChevronUp, Download, Plus } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { FundTable, ColumnId, DEFAULT_COLUMNS } from '@/components/FundTable'
import { RiskLevel, Fund } from '@/types/fund'
import Link from 'next/link'
import { useColumnVisibilityStore } from '@/store/columnVisibilityStore'
import ReportGenerator from '@/components/ReportGenerator'

type TabType = 'fondos-gestion-activa' | 'fondos-indexados' | 'etf-y-etc' | 'seleccionados'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('fondos-gestion-activa')
  const [isinSearch, setIsinSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string[]>([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<RiskLevel[]>([]);
  const [focusListFilter, setFocusListFilter] = useState('Todos');
  const [implicitAdvisoryFilter, setImplicitAdvisoryFilter] = useState('Todos');
  const [explicitAdvisoryFilter, setExplicitAdvisoryFilter] = useState('Todos');
  const [hedgeFilter, setHedgeFilter] = useState('Todos');
  const [dividendPolicyFilter, setDividendPolicyFilter] = useState('Todos');
  const [replicationTypeFilter, setReplicationTypeFilter] = useState<'Todos' | 'Física' | 'Sintética'>('Todos');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterPanelCollapsed, setIsFilterPanelCollapsed] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  
  // Selected funds state
  const [selectedFunds, setSelectedFunds] = useState<Fund[]>([]);
  
  // Get visibility state from store
  const { 
    visibleColumns, 
    setVisibleColumns, 
    toggleColumnVisibility, 
    showAllColumns, 
    hideAllColumns, 
    initializeColumns,
    updateForDataSource,
  } = useColumnVisibilityStore();
  
  // Estado para el acordeón de secciones
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    category: true,
    risk: true,
    currency: true,
    focusList: true,
    implicitAdvisory: true,
    explicitAdvisory: true,
    hedge: true,
    dividendPolicy: true,
    columns: true,
    replicationType: true
  });

  const [filterCounts, setFilterCounts] = useState({
    categories: {} as Record<string, number>,
    riskLevels: {} as Record<string, number>,
    currencies: {} as Record<string, number>,
    focusList: { 'Sí': 0, 'No': 0 },
    implicitAdvisory: { 'Sí': 0, 'No': 0 },
    explicitAdvisory: { 'Sí': 0, 'No': 0 },
    hedge: { 'Sí': 0, 'No': 0 },
    dividendPolicy: { 'Acumulación': 0, 'Distribución': 0 },
    replicationType: { 'Física': 0, 'Sintética': 0 }
  });
  const [allFunds, setAllFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize columns on first render
  useEffect(() => {
    initializeColumns();
  }, [initializeColumns]);

  // Handle fund selection/deselection
  const handleSelectFund = (fund: Fund, isSelected: boolean) => {
    if (isSelected) {
      // Add fund to selected list if not already there
      setSelectedFunds(prev => {
        const exists = prev.some(f => f.isin === fund.isin);
        if (exists) return prev;
        return [...prev, fund];
      });
    } else {
      // Remove fund from selected list
      setSelectedFunds(prev => prev.filter(f => f.isin !== fund.isin));
    }
  };

  // Export selected funds as CSV
  const handleExportSelected = () => {
    if (selectedFunds.length === 0) return;
    
    // Create CSV content
    const headers = [
      'ISIN', 
      'Nombre', 
      'Categoría', 
      'Divisa', 
      'Gestora', 
      'Nivel de Riesgo',
      'Rentabilidad YTD',
      'Rentabilidad 1 año',
      'Rentabilidad 3 años',
      'Rentabilidad 5 años',
      'Comisiones TER'
    ];
    
    const rows = selectedFunds.map(fund => [
      fund.isin,
      fund.name,
      fund.category,
      fund.currency,
      fund.management_company,
      fund.risk_level,
      fund.ytd_return.toFixed(2) + '%',
      fund.one_year_return.toFixed(2) + '%',
      fund.three_year_return.toFixed(2) + '%',
      fund.five_year_return.toFixed(2) + '%',
      fund.management_fee.toFixed(2) + '%'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fondos_seleccionados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch fund data and calculate filter counts
  const fetchFundsAndCountFilters = useCallback(async (tab: TabType) => {
    if (tab === 'seleccionados') return;
    
    setIsLoading(true);
    try {
      console.log('Fetching data for tab:', tab);
      // Add a very large limit to get all funds at once, and set page=1
      const response = await fetch(`/api/funds?dataSource=${tab}&limit=10000&page=1`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      // Extract funds array from response or use the direct array
      let fundsArray: Fund[] = [];
      
      if (data && data.funds && Array.isArray(data.funds)) {
        // The API returned the expected structure with funds property
        console.log(`Fetched ${data.funds.length} funds from API response`);
        fundsArray = data.funds;
      } else if (Array.isArray(data)) {
        // The API returned a direct array of funds
        console.log(`Fetched ${data.length} funds from direct array`);
        fundsArray = data;
      } else {
        console.error('Invalid data format:', data);
        setAllFunds([]);
        setFilterCounts({
          categories: {},
          riskLevels: {},
          currencies: {},
          focusList: { 'Sí': 0, 'No': 0 },
          implicitAdvisory: { 'Sí': 0, 'No': 0 },
          explicitAdvisory: { 'Sí': 0, 'No': 0 },
          hedge: { 'Sí': 0, 'No': 0 },
          dividendPolicy: { 'Acumulación': 0, 'Distribución': 0 },
          replicationType: { 'Física': 0, 'Sintética': 0 }
        });
        return;
      }
      
      // Apply hardcoded filters that are also used in table display
      // These should match the filters in handleVisibilityCheck
      fundsArray = fundsArray.filter(fund => {
        // Apply datatype-specific filters
        if (tab === 'etf-y-etc') {
          // For ETFs, certain properties should be hidden/filtered
          return true; // No filters that would remove entire funds
        } else if (tab === 'fondos-indexados') {
          return true; // No filters that would remove entire funds
        } else if (tab === 'fondos-gestion-activa') {
          return true; // No filters that would remove entire funds
        }
        
        return true; // Default case
      });
      
      // For cases where the API is expected to return specific categorical subsets
      // that might not have been correctly filtered on the server
      if (tab === 'etf-y-etc') {
        // Ensure only ETFs are shown
        fundsArray = fundsArray.filter(fund => 
          fund.category?.toLowerCase().includes('etf') || 
          fund.category?.toLowerCase().includes('etc') || 
          fund.name?.toLowerCase().includes('etf') || 
          fund.name?.toLowerCase().includes('etc')
        );
      } else if (tab === 'fondos-indexados') {
        // Ensure only index funds are shown
        fundsArray = fundsArray.filter(fund =>
          fund.category?.toLowerCase().includes('index') || 
          fund.name?.toLowerCase().includes('index') ||
          fund.category?.toLowerCase().includes('indice') || 
          fund.name?.toLowerCase().includes('indice') ||
          fund.category?.toLowerCase().includes('índice') || 
          fund.name?.toLowerCase().includes('índice')
        );
      } else if (tab === 'fondos-gestion-activa') {
        // Exclude ETFs and index funds
        fundsArray = fundsArray.filter(fund =>
          !(fund.category?.toLowerCase().includes('etf') || 
            fund.name?.toLowerCase().includes('etf') ||
            fund.category?.toLowerCase().includes('etc') || 
            fund.name?.toLowerCase().includes('etc') ||
            fund.category?.toLowerCase().includes('index') || 
            fund.name?.toLowerCase().includes('index') ||
            fund.category?.toLowerCase().includes('indice') || 
            fund.name?.toLowerCase().includes('indice') ||
            fund.category?.toLowerCase().includes('índice') || 
            fund.name?.toLowerCase().includes('índice'))
        );
      }
      
      setAllFunds(fundsArray);
      
      // Calculate counts for each filter
      const counts = {
        categories: {} as Record<string, number>,
        riskLevels: {} as Record<string, number>,
        currencies: {} as Record<string, number>,
        focusList: { 'Sí': 0, 'No': 0 },
        implicitAdvisory: { 'Sí': 0, 'No': 0 },
        explicitAdvisory: { 'Sí': 0, 'No': 0 },
        hedge: { 'Sí': 0, 'No': 0 },
        dividendPolicy: { 'Acumulación': 0, 'Distribución': 0 },
        replicationType: { 'Física': 0, 'Sintética': 0 }
      };
      
      // Process funds for counts
      fundsArray.forEach((fund: Fund) => {
        // Count categories
        if (fund && fund.category) {
          counts.categories[fund.category] = (counts.categories[fund.category] || 0) + 1;
        }
        
        // Count risk levels
        if (fund && fund.risk_level) {
          counts.riskLevels[fund.risk_level] = (counts.riskLevels[fund.risk_level] || 0) + 1;
        }
        
        // Count currencies - only if visible for this tab
        if (fund && fund.currency && !(tab === 'etf-y-etc')) {
          counts.currencies[fund.currency] = (counts.currencies[fund.currency] || 0) + 1;
        }
        
        // Count focus list
        if (fund && fund.focus_list !== undefined) {
          const focusValue = fund.focus_list ? 'Sí' : 'No';
          counts.focusList[focusValue] = (counts.focusList[focusValue] || 0) + 1;
        }
        
        // Count advisory options (only for non-ETFs)
        if (tab !== 'etf-y-etc' && fund) {
          // Check if these properties exist on fund
          if (fund.implicit_advisory !== undefined) {
            const implicitValue = fund.implicit_advisory ? 'Sí' : 'No';
            counts.implicitAdvisory[implicitValue] = (counts.implicitAdvisory[implicitValue] || 0) + 1;
          }
          
          if (fund.explicit_advisory !== undefined) {
            const explicitValue = fund.explicit_advisory ? 'Sí' : 'No';
            counts.explicitAdvisory[explicitValue] = (counts.explicitAdvisory[explicitValue] || 0) + 1;
          }
          
          if (fund.hedge !== undefined) {
            // Hide hedge for fondos-gestion-activa
            if (tab !== 'fondos-gestion-activa') {
              const hedgeValue = fund.hedge ? 'Sí' : 'No';
              counts.hedge[hedgeValue] = (counts.hedge[hedgeValue] || 0) + 1;
            }
          }
        }
        
        // Count dividend policy
        if (fund && fund.dividend_policy) {
          if (fund.dividend_policy === 'Acumulación' || fund.dividend_policy === 'Distribución') {
            counts.dividendPolicy[fund.dividend_policy] = (counts.dividendPolicy[fund.dividend_policy] || 0) + 1;
          }
        }
        
        // Count replication type (only for ETFs)
        if (tab === 'etf-y-etc' && fund && fund.replication_type) {
          if (fund.replication_type === 'Física' || fund.replication_type === 'Sintética') {
            counts.replicationType[fund.replication_type] = (counts.replicationType[fund.replication_type] || 0) + 1;
          }
        }
      });
      
      console.log('Filter counts calculated:', counts);
      setFilterCounts(counts);
    } catch (error) {
      console.error('Error fetching funds data:', error);
      // Reset to empty state on error
      setAllFunds([]);
      setFilterCounts({
        categories: {},
        riskLevels: {},
        currencies: {},
        focusList: { 'Sí': 0, 'No': 0 },
        implicitAdvisory: { 'Sí': 0, 'No': 0 },
        explicitAdvisory: { 'Sí': 0, 'No': 0 },
        hedge: { 'Sí': 0, 'No': 0 },
        dividendPolicy: { 'Acumulación': 0, 'Distribución': 0 },
        replicationType: { 'Física': 0, 'Sintética': 0 }
      });
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch data when tab changes
  useEffect(() => {
    fetchFundsAndCountFilters(activeTab);
  }, [activeTab, fetchFundsAndCountFilters]);

  // Manejar cambio de pestaña - resetear filtros solo si no es la pestaña seleccionados
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    
    // Don't reset filters when switching to selected tab
    if (tab !== 'seleccionados') {
      setIsinSearch('')
      setSelectedCategories([])
      setSelectedCurrency([])
      setSelectedRiskLevels([])
      setFocusListFilter('Todos')
      setImplicitAdvisoryFilter('Todos')
      setExplicitAdvisoryFilter('Todos')
      setHedgeFilter('Todos')
      setDividendPolicyFilter('Todos')
      setReplicationTypeFilter('Todos')
      
      // Update column visibility for this tab type
      updateForDataSource(tab);
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
      
      // Lógica para mostrar automáticamente las columnas de renta fija en ETFs
      if (activeTab === 'etf-y-etc' && category === 'Renta Fija') {
        if (!isSelected) {
          // Si se selecciona Renta Fija, añadir las columnas de rating y maturity_range
          const updatedColumns = [...visibleColumns];
          if (!visibleColumns.includes('rating')) {
            updatedColumns.push('rating');
          }
          if (!visibleColumns.includes('maturity_range')) {
            updatedColumns.push('maturity_range');
          }
          setVisibleColumns(updatedColumns);
        } else {
          // Si se deselecciona y no hay otras categorías seleccionadas, se pueden ocultar las columnas
          if (prev.length === 1) {
            setVisibleColumns(visibleColumns.filter(col => col !== 'rating' && col !== 'maturity_range'));
          }
        }
      }
      
      if (isSelected) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleRiskLevelChange = (riskLevel: RiskLevel) => {
    setSelectedRiskLevels(prev => {
      const isSelected = prev.includes(riskLevel);
      if (isSelected) {
        return prev.filter(r => r !== riskLevel);
      } else {
        return [...prev, riskLevel];
      }
    });
  };

  const toggleFilterPanel = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  const toggleFilterPanelCollapse = () => {
    setIsFilterPanelCollapsed(!isFilterPanelCollapsed);
  };

  // Helper function to check if any currencies are selected
  const hasSelectedCurrencies = () => {
    return selectedCurrency.length > 0;
  };

  // Toggle para expandir/colapsar secciones
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleColumnToggle = (column: ColumnId) => {
    if (column === 'info') return; // No permitir deshabilitar la columna principal
    toggleColumnVisibility(column);
  };

  const handleToggleAllColumns = (show: boolean) => {
    if (show) {
      showAllColumns();
    } else {
      hideAllColumns();
    }
  };

  const handleVisibilityCheck = useCallback((column: ColumnId) => {
    if (activeTab === 'fondos-gestion-activa' && (
      column === 'hedge'
    )) return false;
    
    if (activeTab === 'etf-y-etc' && (
      column === 'compartment_code' || 
      column === 'implicit_advisory' || 
      column === 'explicit_advisory' ||
      column === 'currency'
    )) return false;
    
    return true;
  }, [activeTab]);

  // Create a query params string to detect when only sort/page changes vs filter changes
  const currentQueryParams = useMemo(() => {
    const currencyParam = Array.isArray(selectedCurrency) && selectedCurrency.length > 0 
      ? selectedCurrency.join(',') 
      : '';
      
    return `${isinSearch}-${selectedCategories.join(',')}-${currencyParam}-${selectedRiskLevels.join(',')}-${activeTab}-${focusListFilter}-${implicitAdvisoryFilter}-${explicitAdvisoryFilter}-${hedgeFilter}-${dividendPolicyFilter}-${replicationTypeFilter}`;
  }, [isinSearch, selectedCategories, selectedCurrency, selectedRiskLevels, activeTab, focusListFilter, implicitAdvisoryFilter, explicitAdvisoryFilter, hedgeFilter, dividendPolicyFilter, replicationTypeFilter]);

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900 py-2 overflow-hidden">
      <Header />
      
      <main className="flex-grow w-full overflow-hidden">
        <div className="w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
          {/* Pestañas de navegación */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <nav className="-mb-px flex space-x-4 sm:space-x-6" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('fondos-gestion-activa')}
                className={`${
                  activeTab === 'fondos-gestion-activa'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm sm:text-base`}
              >
                Fondos gestión activa
              </button>
              <button
                onClick={() => handleTabChange('fondos-indexados')}
                className={`${
                  activeTab === 'fondos-indexados'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm sm:text-base`}
              >
                Fondos indexados
              </button>
              <button
                onClick={() => handleTabChange('etf-y-etc')}
                className={`${
                  activeTab === 'etf-y-etc'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm sm:text-base`}
              >
                ETF y ETC
              </button>
              <button
                onClick={() => handleTabChange('seleccionados')}
                className={`${
                  activeTab === 'seleccionados'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm sm:text-base ml-auto`}
              >
                Seleccionados {selectedFunds.length > 0 && `(${selectedFunds.length})`}
              </button>
            </nav>
          </div>

          {/* Enlace para descargar CSV */}
          <div className="flex justify-end mb-3">
            {activeTab !== 'seleccionados' ? (
              <a 
                href={`/api/funds?dataSource=${activeTab}&download=true`}
                className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 text-sm"
                download
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Descargar datos CSV
              </a>
            ) : (
              <button
                onClick={handleExportSelected}
                disabled={selectedFunds.length === 0}
                className={`text-sm flex items-center gap-1 ${
                  selectedFunds.length > 0 
                    ? 'text-green-600 hover:text-green-700' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Download size={18} />
                Exportar seleccionados ({selectedFunds.length})
              </button>
            )}
          </div>

          {/* Botón para mostrar/ocultar filtros en móvil */}
          <button
            onClick={toggleFilterPanel}
            className="md:hidden flex items-center gap-2 mb-3 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md"
          >
            <Filter size={20} />
            <span className="dark:text-white">{isFilterPanelOpen ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
          </button>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Panel lateral de filtros - hide on selected tab */}
            {activeTab !== 'seleccionados' && (
              <div className={`
                ${isFilterPanelCollapsed ? 'md:w-10' : 'md:w-64'}
                md:flex-shrink-0
                fixed md:static inset-0 z-30 bg-white dark:bg-gray-900 md:bg-transparent
                transition-all duration-300 ease-in-out
                ${isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              `}>
                {/* Botón para contraer/expandir en desktop */}
                <button
                  onClick={toggleFilterPanelCollapse}
                  className="hidden md:flex absolute -right-3 top-12 items-center justify-center h-6 w-6 rounded-full bg-white dark:bg-gray-800 shadow-md z-10 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 focus:outline-none"
                >
                  {isFilterPanelCollapsed ? (
                    <ChevronRight size={14} />
                  ) : (
                    <ChevronLeft size={14} />
                  )}
                </button>

                <div className={`bg-white dark:bg-gray-800 h-full md:h-auto overflow-y-auto md:rounded-lg md:shadow p-4 ${isFilterPanelCollapsed ? 'overflow-hidden' : ''}`}>
                  <div className="flex justify-between items-center mb-6 md:hidden">
                    <h2 className="text-xl font-semibold dark:text-white">Filtros</h2>
                    <button onClick={toggleFilterPanel} className="p-2 dark:text-gray-300">
                      <X size={24} />
                    </button>
                  </div>

                  {/* Loading indicator */}
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">Cargando...</span>
                    </div>
                  ) : (
                    !isFilterPanelCollapsed && (
                      <>
                        <h2 className="hidden md:block text-xl font-semibold mb-6 dark:text-white">
                          {activeTab === 'fondos-gestion-activa' && 'Filtrar fondos de inversión'}
                          {activeTab === 'fondos-indexados' && 'Filtrar fondos indexados'}
                          {activeTab === 'etf-y-etc' && 'Filtrar ETFs y ETCs'}
                        </h2>
                        
                        {/* Sección Búsqueda con acordeón */}
                        <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                          <div 
                            className="flex justify-between items-center cursor-pointer py-1.5"
                            onClick={() => toggleSection('search')}
                          >
                            <h3 className="font-medium dark:text-white text-sm">Buscar</h3>
                            <button className="text-gray-500 dark:text-gray-400">
                              {expandedSections.search ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                          <div className={`filter-content ${expandedSections.search ? 'expanded' : ''}`}>
                            <div className="mt-1 pb-1.5">
                              <input
                                type="text"
                                placeholder="ISIN"
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                value={isinSearch}
                                onChange={(e) => setIsinSearch(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sección Categorías */}
                        <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                          <div 
                            className="flex justify-between items-center cursor-pointer py-1.5"
                            onClick={() => toggleSection('category')}
                          >
                            <h3 className="font-medium dark:text-white text-sm">Categorías</h3>
                            <button className="text-gray-500 dark:text-gray-400">
                              {expandedSections.category ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                          <div className={`filter-content ${expandedSections.category ? 'expanded' : ''}`}>
                            <div className="mt-1 pb-1 space-y-1.5">
                              {Object.entries(filterCounts.categories).map(([category, count]) => (
                                <div key={category} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <input
                                      id={`category-${category}`}
                                      type="checkbox"
                                      className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                      checked={selectedCategories.includes(category)}
                                      onChange={() => handleCategoryChange(category)}
                                    />
                                    <label htmlFor={`category-${category}`} className="ml-1.5 text-sm text-gray-700 dark:text-gray-300">
                                      {category}
                                    </label>
                                  </div>
                                  {/* Count and percentage hidden but kept for future use */}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Sección Niveles de Riesgo */}
                        <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                          <div 
                            className="flex justify-between items-center cursor-pointer py-1.5"
                            onClick={() => toggleSection('risk')}
                          >
                            <h3 className="font-medium dark:text-white text-sm">Niveles de Riesgo</h3>
                            <button className="text-gray-500 dark:text-gray-400">
                              {expandedSections.risk ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                          <div className={`filter-content ${expandedSections.risk ? 'expanded' : ''}`}>
                            <div className="mt-1 pb-1 space-y-1.5">
                              {Object.entries(filterCounts.riskLevels).map(([risk, count]) => (
                                <div key={risk} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <input
                                      id={`risk-${risk}`}
                                      type="checkbox"
                                      className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                      checked={selectedRiskLevels.includes(risk as RiskLevel)}
                                      onChange={() => handleRiskLevelChange(risk as RiskLevel)}
                                    />
                                    <label htmlFor={`risk-${risk}`} className="ml-1.5 text-sm text-gray-700 dark:text-gray-300">
                                      {risk}
                                    </label>
                                  </div>
                                  {/* Count and percentage hidden but kept for future use */}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Sección Divisas */}
                        {activeTab !== 'etf-y-etc' && (
                          <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                            <div 
                              className="flex justify-between items-center cursor-pointer py-1.5"
                              onClick={() => toggleSection('currency')}
                            >
                              <h3 className="font-medium dark:text-white text-sm">Divisas</h3>
                              <button className="text-gray-500 dark:text-gray-400">
                                {expandedSections.currency ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                            <div className={`filter-content ${expandedSections.currency ? 'expanded' : ''}`}>
                              <div className="mt-1 pb-1 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <button
                                      className="ml-1.5 text-sm text-indigo-600 dark:text-indigo-400 underline"
                                      onClick={() => {
                                        // If no currencies are selected or not all currencies are selected, select all
                                        // Otherwise, deselect all
                                        const allCurrencies = Object.keys(filterCounts.currencies);
                                        const allSelected = allCurrencies.length > 0 && 
                                          allCurrencies.every(c => selectedCurrency.includes(c));
                                        
                                        if (allSelected) {
                                          setSelectedCurrency([]);  // Empty array = no filter
                                        } else {
                                          setSelectedCurrency([]);  // Changed to empty array - meaning no filter
                                        }
                                      }}
                                    >
                                      Mostrar todas
                                    </button>
                                  </div>
                                </div>
                                
                                {selectedCurrency.length === 0 && (
                                  <div className="text-xs text-green-600 dark:text-green-400 ml-1.5 mb-2">
                                    Mostrando todos los fondos (sin filtrar por divisa)
                                  </div>
                                )}
                                
                                {Object.entries(filterCounts.currencies).map(([currency, count]) => (
                                  <div key={currency} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <input
                                        id={`currency-${currency}`}
                                        type="checkbox"
                                        className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                        checked={selectedCurrency.length > 0 && selectedCurrency.includes(currency)}
                                        onChange={() => {
                                          if (selectedCurrency.length === 0) {
                                            // First selection - add only this currency
                                            setSelectedCurrency([currency]);
                                          } else if (selectedCurrency.includes(currency)) {
                                            // If already selected, remove it
                                            const newSelection = selectedCurrency.filter(c => c !== currency);
                                            // If removing the last currency, clear the filter (show all)
                                            setSelectedCurrency(newSelection.length === 0 ? [] : newSelection);
                                          } else {
                                            // Add this currency to selection
                                            setSelectedCurrency([...selectedCurrency, currency]);
                                          }
                                        }}
                                      />
                                      <label htmlFor={`currency-${currency}`} className="ml-1.5 text-sm text-gray-700 dark:text-gray-300">
                                        {currency}
                                      </label>
                                    </div>
                                    {/* Count and percentage hidden but kept for future use */}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sección Listas de Enfoque */}
                        <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                          <div 
                            className="flex justify-between items-center cursor-pointer py-1.5"
                            onClick={() => toggleSection('focusList')}
                          >
                            <h3 className="font-medium dark:text-white text-sm">Listas de Enfoque</h3>
                            <button className="text-gray-500 dark:text-gray-400">
                              {expandedSections.focusList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                          <div className={`filter-content ${expandedSections.focusList ? 'expanded' : ''}`}>
                            <div className="mt-1 pb-1 space-y-1.5">
                              {Object.entries(filterCounts.focusList).map(([list, count]) => (
                                <div key={list} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <input
                                      id={`list-${list}`}
                                      type="checkbox"
                                      className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                      checked={focusListFilter === list}
                                      onChange={() => setFocusListFilter(list as 'Sí' | 'No')}
                                    />
                                    <label htmlFor={`list-${list}`} className="ml-1.5 text-sm text-gray-700 dark:text-gray-300">
                                      {list}
                                    </label>
                                  </div>
                                  {/* Count and percentage hidden but kept for future use */}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Sección Asesoramiento Implícito - only for non-ETFs */}
                        {activeTab !== 'etf-y-etc' && (
                          <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                            <div 
                              className="flex justify-between items-center cursor-pointer py-1.5"
                              onClick={() => toggleSection('implicitAdvisory')}
                            >
                              <h3 className="font-medium dark:text-white text-sm">Asesoramiento Implícito</h3>
                              <button className="text-gray-500 dark:text-gray-400">
                                {expandedSections.implicitAdvisory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                            <div className={`filter-content ${expandedSections.implicitAdvisory ? 'expanded' : ''}`}>
                              <div className="mt-1 pb-1 space-y-1.5">
                                {Object.entries(filterCounts.implicitAdvisory).map(([value, count]) => (
                                  <div key={value} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <input
                                        id={`implicit-${value}`}
                                        type="checkbox"
                                        className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                        checked={implicitAdvisoryFilter === value}
                                        onChange={() => setImplicitAdvisoryFilter(value as 'Sí' | 'No')}
                                      />
                                      <label htmlFor={`implicit-${value}`} className="ml-1.5 text-sm text-gray-700 dark:text-gray-300">
                                        {value}
                                      </label>
                                    </div>
                                    {/* Count and percentage hidden but kept for future use */}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Sección Asesoramiento Explícito - only for non-ETFs */}
                        {activeTab !== 'etf-y-etc' && (
                          <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                            <div 
                              className="flex justify-between items-center cursor-pointer py-1.5"
                              onClick={() => toggleSection('explicitAdvisory')}
                            >
                              <h3 className="font-medium dark:text-white text-sm">Asesoramiento Explícito</h3>
                              <button className="text-gray-500 dark:text-gray-400">
                                {expandedSections.explicitAdvisory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                            <div className={`filter-content ${expandedSections.explicitAdvisory ? 'expanded' : ''}`}>
                              <div className="mt-1 pb-1 space-y-1.5">
                                {Object.entries(filterCounts.explicitAdvisory).map(([value, count]) => (
                                  <div key={value} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <input
                                        id={`explicit-${value}`}
                                        type="checkbox"
                                        className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                        checked={explicitAdvisoryFilter === value}
                                        onChange={() => setExplicitAdvisoryFilter(value as 'Sí' | 'No')}
                                      />
                                      <label htmlFor={`explicit-${value}`} className="ml-1.5 text-sm text-gray-700 dark:text-gray-300">
                                        {value}
                                      </label>
                                    </div>
                                    {/* Count and percentage hidden but kept for future use */}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Sección Hedge - hide for fondos-gestion-activa */}
                        {activeTab !== 'fondos-gestion-activa' && (
                          <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                            <div 
                              className="flex justify-between items-center cursor-pointer py-1.5"
                              onClick={() => toggleSection('hedge')}
                            >
                              <h3 className="font-medium dark:text-white text-sm">Hedge</h3>
                              <button className="text-gray-500 dark:text-gray-400">
                                {expandedSections.hedge ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                            <div className={`filter-content ${expandedSections.hedge ? 'expanded' : ''}`}>
                              <div className="mt-1 pb-1 space-y-1.5">
                                {Object.entries(filterCounts.hedge).map(([value, count]) => (
                                  <div key={value} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <input
                                        id={`hedge-${value}`}
                                        type="checkbox"
                                        className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                        checked={hedgeFilter === value}
                                        onChange={() => setHedgeFilter(value as 'Sí' | 'No')}
                                      />
                                      <label htmlFor={`hedge-${value}`} className="ml-1.5 text-sm text-gray-700 dark:text-gray-300">
                                        {value}
                                      </label>
                                    </div>
                                    {/* Count and percentage hidden but kept for future use */}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sección Política de Dividendos */}
                        <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                          <div 
                            className="flex justify-between items-center cursor-pointer py-1.5"
                            onClick={() => toggleSection('dividendPolicy')}
                          >
                            <h3 className="font-medium dark:text-white text-sm">Política de Dividendos</h3>
                            <button className="text-gray-500 dark:text-gray-400">
                              {expandedSections.dividendPolicy ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                          <div className={`filter-content ${expandedSections.dividendPolicy ? 'expanded' : ''}`}>
                            <div className="mt-1 pb-1 space-y-1.5">
                              {Object.entries(filterCounts.dividendPolicy).map(([value, count]) => (
                                <div key={value} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <input
                                      id={`dividend-${value}`}
                                      type="checkbox"
                                      className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                      checked={dividendPolicyFilter === value}
                                      onChange={() => setDividendPolicyFilter(value as 'Acumulación' | 'Distribución')}
                                    />
                                    <label htmlFor={`dividend-${value}`} className="ml-1.5 text-sm text-gray-700 dark:text-gray-300">
                                      {value}
                                    </label>
                                  </div>
                                  {/* Count and percentage hidden but kept for future use */}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Sección Tipo de Réplica - only for ETFs */}
                        {activeTab === 'etf-y-etc' && (
                          <div className="mb-3 border-b dark:border-gray-700 pb-1.5">
                            <div 
                              className="flex justify-between items-center cursor-pointer py-1.5"
                              onClick={() => toggleSection('replicationType')}
                            >
                              <h3 className="font-medium dark:text-white text-sm">Tipo de Réplica</h3>
                              <button className="text-gray-500 dark:text-gray-400">
                                {expandedSections.replicationType ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                            <div className={`filter-content ${expandedSections.replicationType ? 'expanded' : ''}`}>
                              <div className="mt-1 pb-1 space-y-1.5">
                                {Object.entries(filterCounts.replicationType).map(([value, count]) => (
                                  <div key={value} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <input
                                        id={`replication-${value}`}
                                        type="checkbox"
                                        className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                        checked={replicationTypeFilter === value}
                                        onChange={() => setReplicationTypeFilter(value as 'Física' | 'Sintética')}
                                      />
                                      <label htmlFor={`replication-${value}`} className="ml-1.5 text-sm text-gray-700 dark:text-gray-300">
                                        {value}
                                      </label>
                                    </div>
                                    {/* Count and percentage hidden but kept for future use */}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  )}

                  {/* Versión colapsada - Solo iconos */}
                  {isFilterPanelCollapsed && (
                    <div className="flex flex-col items-center space-y-6">
                      <button className="p-2 text-gray-500 hover:text-red-600" title="Buscar">
                        <Search size={20} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-red-600" title="Categorías">
                        <Filter size={20} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-red-600" title="Columnas">
                        <Columns size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overlay para cerrar el panel en móvil */}
            {isFilterPanelOpen && activeTab !== 'seleccionados' && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                onClick={toggleFilterPanel}
              />
            )}

            {/* Contenido principal - tabla de fondos */}
            <div className={`flex-1 w-full overflow-hidden ${activeTab === 'seleccionados' ? 'md:ml-0' : ''}`}>
              <div className="w-full overflow-auto">
                {activeTab !== 'seleccionados' ? (
                  <FundTable 
                    isinSearch={isinSearch}
                    selectedCategories={selectedCategories}
                    selectedCurrency={selectedCurrency}
                    selectedRiskLevels={selectedRiskLevels}
                    dataSource={activeTab}
                    visibleColumns={visibleColumns}
                    focusListFilter={focusListFilter}
                    implicitAdvisoryFilter={implicitAdvisoryFilter}
                    explicitAdvisoryFilter={explicitAdvisoryFilter}
                    hedgeFilter={hedgeFilter}
                    dividendPolicyFilter={dividendPolicyFilter}
                    replicationTypeFilter={replicationTypeFilter}
                    selectedFunds={selectedFunds}
                    onSelectFund={handleSelectFund}
                    setAnalysisMode={setAnalysisMode}
                  />
                ) : (
                  <div className="w-full">
                    {selectedFunds.length > 0 ? (
                      <>
                        <ReportGenerator selectedFunds={selectedFunds} />
                        <div className="mt-6">
                          <FundTable 
                            isinSearch=""
                            selectedCategories={[]}
                            selectedCurrency={[]}
                            selectedRiskLevels={[]}
                            dataSource=""
                            visibleColumns={visibleColumns}
                            selectedFunds={selectedFunds}
                            onSelectFund={handleSelectFund}
                            isSelectedTab={true}
                            key="selected-funds-table"
                            setAnalysisMode={setAnalysisMode}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="text-gray-500 dark:text-gray-400 mb-4">
                          No hay fondos seleccionados
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                          Selecciona fondos desde las otras pestañas utilizando el botón <Plus size={16} className="inline" /> 
                          y aparecerán aquí.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 