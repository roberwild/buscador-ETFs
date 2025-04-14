'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, X, ChevronLeft, ChevronRight, Columns, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { FundTable, ColumnId, DEFAULT_COLUMNS } from '@/components/FundTable'
import { RiskLevel } from '@/types/fund'
import Link from 'next/link'

type TabType = 'fondos-gestion-activa' | 'fondos-indexados' | 'etf-y-etc'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('fondos-gestion-activa')
  const [isinSearch, setIsinSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<RiskLevel[]>([]);
  const [focusListFilter, setFocusListFilter] = useState('Todos');
  const [implicitAdvisoryFilter, setImplicitAdvisoryFilter] = useState('Todos');
  const [explicitAdvisoryFilter, setExplicitAdvisoryFilter] = useState('Todos');
  const [hedgeFilter, setHedgeFilter] = useState('Todos');
  const [dividendPolicyFilter, setDividendPolicyFilter] = useState('Todos');
  const [replicationTypeFilter, setReplicationTypeFilter] = useState<'Todos' | 'Física' | 'Sintética'>('Todos');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterPanelCollapsed, setIsFilterPanelCollapsed] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(
    DEFAULT_COLUMNS.filter(col => col.visible && col.id !== 'factsheet_url').map(col => col.id)
  );
  
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

  // Efecto para inicializar las columnas visibles
  useEffect(() => {
    setVisibleColumns(DEFAULT_COLUMNS.filter(col => col.visible && col.id !== 'factsheet_url').map(col => col.id));
  }, []);

  // Manejar cambio de pestaña - resetear filtros
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setIsinSearch('')
    setSelectedCategories([])
    setSelectedCurrency('')
    setSelectedRiskLevels([])
    setFocusListFilter('Todos')
    setImplicitAdvisoryFilter('Todos')
    setExplicitAdvisoryFilter('Todos')
    setHedgeFilter('Todos')
    setDividendPolicyFilter('Todos')
    
    // Actualizar columnas visibles según la pestaña seleccionada
    if (tab === 'etf-y-etc') {
      // Si cambia a ETFs, asegurarse de que compartment_code y columnas de asesoramiento no estén visibles
      setVisibleColumns(prev => prev.filter(id => 
        id !== 'compartment_code' && 
        id !== 'implicit_advisory' && 
        id !== 'explicit_advisory' &&
        id !== 'currency'
      ));
    } else {
     
      setVisibleColumns(prev => {
        let newColumns = [...prev];
        
        // Comprobar y añadir compartment_code si es necesario
        if (!prev.includes('compartment_code') && DEFAULT_COLUMNS.find(col => col.id === 'compartment_code')?.visible) {
          newColumns.push('compartment_code');
        }
        
        // Comprobar y añadir implicit_advisory si es necesario
        if (!prev.includes('implicit_advisory') && DEFAULT_COLUMNS.find(col => col.id === 'implicit_advisory')?.visible) {
          newColumns.push('implicit_advisory');
        }
        
        // Comprobar y añadir explicit_advisory si es necesario
        if (!prev.includes('explicit_advisory') && DEFAULT_COLUMNS.find(col => col.id === 'explicit_advisory')?.visible) {
          newColumns.push('explicit_advisory');
        }
        
        // Comprobar y añadir currency si es necesario
        if (!prev.includes('currency') && DEFAULT_COLUMNS.find(col => col.id === 'currency')?.visible) {
          newColumns.push('currency');
        }
        
        // Comprobar y añadir hedge si es necesario
        if (!prev.includes('hedge') && DEFAULT_COLUMNS.find(col => col.id === 'hedge')?.visible) {
          newColumns.push('hedge');
        }
        
        return newColumns;
      });
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
      
      // Lógica para mostrar automáticamente las columnas de renta fija en ETFs
      if (activeTab === 'etf-y-etc' && category === 'Renta Fija') {
        if (!isSelected) {
          // Si se selecciona Renta Fija, añadir las columnas de rating y maturity_range
          setVisibleColumns(prev => {
            // Solo añadir si no están ya incluidas
            const newColumns = [...prev];
            if (!prev.includes('rating')) {
              newColumns.push('rating');
            }
            if (!prev.includes('maturity_range')) {
              newColumns.push('maturity_range');
            }
            return newColumns;
          });
        } else {
          // Si se deselecciona y no hay otras categorías seleccionadas, se pueden ocultar las columnas
          if (prev.length === 1) {
            setVisibleColumns(cols => cols.filter(col => col !== 'rating' && col !== 'maturity_range'));
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

  // Toggle para expandir/colapsar secciones
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleColumnToggle = (columnId: ColumnId) => {
    if (columnId === 'info') return; // No permitir deshabilitar la columna principal
    
    setVisibleColumns(prev => {
      const isVisible = prev.includes(columnId);
      if (isVisible) {
        return prev.filter(id => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  const handleToggleAllColumns = (show: boolean) => {
    if (show) {
      // Mostrar todas las columnas excepto factsheet_url
      // y compartment_code/asesoramiento si estamos en ETFs
      setVisibleColumns(
        DEFAULT_COLUMNS
          .filter(col => {
            if (col.id === 'factsheet_url') return false;
            if (activeTab === 'etf-y-etc' && (
                col.id === 'compartment_code' || 
                col.id === 'implicit_advisory' || 
                col.id === 'explicit_advisory' ||
                col.id === 'currency'
              )) return false;
            return true;
          })
          .map(col => col.id)
      );
    } else {
      // Mantener solo las columnas obligatorias
      setVisibleColumns(['info']);
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

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold dark:text-white">Buscador de Fondos de Inversión</h1>
            <div className="flex items-center gap-3">
              <Link 
                href="/admin/upload"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                Administrar datos
              </Link>
              <Link 
                href="https://www.selfbank.es/"
                className="bg-[#D1472C] text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                ¡EMPIEZA A OPERAR CON FONDOS YA!
              </Link>
            </div>
          </div>
          
          {/* Pestañas de navegación */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('fondos-gestion-activa')}
                className={`${
                  activeTab === 'fondos-gestion-activa'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm sm:text-base`}
              >
                Fondos gestión activa
              </button>
              <button
                onClick={() => handleTabChange('fondos-indexados')}
                className={`${
                  activeTab === 'fondos-indexados'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm sm:text-base`}
              >
                Fondos indexados
              </button>
              <button
                onClick={() => handleTabChange('etf-y-etc')}
                className={`${
                  activeTab === 'etf-y-etc'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm sm:text-base`}
              >
                ETF y ETC
              </button>
            </nav>
          </div>

          {/* Enlace para descargar CSV */}
          <div className="flex justify-end mb-4">
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
          </div>

          {/* Botón para mostrar/ocultar filtros en móvil */}
          <button
            onClick={toggleFilterPanel}
            className="md:hidden flex items-center gap-2 mb-4 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-md"
          >
            <Filter size={20} />
            <span className="dark:text-white">{isFilterPanelOpen ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Panel lateral de filtros */}
            <div className={`
              ${isFilterPanelCollapsed ? 'md:w-12' : 'md:w-72'}
              md:flex-shrink-0
              fixed md:static inset-0 z-30 bg-white dark:bg-gray-900 md:bg-transparent
              transition-all duration-300 ease-in-out
              ${isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              {/* Botón para contraer/expandir en desktop */}
              <button
                onClick={toggleFilterPanelCollapse}
                className="hidden md:flex absolute -right-4 top-12 items-center justify-center h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-md z-10 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 focus:outline-none"
              >
                {isFilterPanelCollapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronLeft size={16} />
                )}
              </button>

              <div className={`bg-white dark:bg-gray-800 h-full md:h-auto overflow-y-auto md:rounded-lg md:shadow p-6 ${isFilterPanelCollapsed ? 'overflow-hidden' : ''}`}>
                <div className="flex justify-between items-center mb-6 md:hidden">
                  <h2 className="text-xl font-semibold dark:text-white">Filtros</h2>
                  <button onClick={toggleFilterPanel} className="p-2 dark:text-gray-300">
                    <X size={24} />
                  </button>
                </div>

                {!isFilterPanelCollapsed && (
                  <>
                    <h2 className="hidden md:block text-xl font-semibold mb-6 dark:text-white">
                      {activeTab === 'fondos-gestion-activa' && 'Filtrar fondos de inversión'}
                      {activeTab === 'fondos-indexados' && 'Filtrar fondos indexados'}
                      {activeTab === 'etf-y-etc' && 'Filtrar ETFs y ETCs'}
                    </h2>
                    
                    {/* Sección Búsqueda con acordeón */}
                    <div className="mb-4 border-b dark:border-gray-700 pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('search')}
                      >
                        <h3 className="font-medium dark:text-white">Buscar</h3>
                        <button className="text-gray-500 dark:text-gray-400">
                          {expandedSections.search ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {expandedSections.search && (
                        <div className="mt-2 pb-2">
                          <input
                            type="text"
                            placeholder="ISIN"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                            value={isinSearch}
                            onChange={(e) => setIsinSearch(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Categorías - Adaptadas según la pestaña activa - con acordeón */}
                    <div className="mb-4 border-b dark:border-gray-700 pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('category')}
                      >
                        <h3 className="font-medium dark:text-white">Categoría</h3>
                        <button className="text-gray-500 dark:text-gray-400">
                          {expandedSections.category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {expandedSections.category && (
                        <div className="mt-2 space-y-2 pb-2">
                          {/* Categorías para fondos de gestión activa */}
                          {activeTab === 'fondos-gestion-activa' && [
                            'Renta Fija',
                            'Renta Variable',
                            'Mixtos',
                            'Monetario',
                            'Gestion Alternativa',
                            'Convertibles',
                            'Inmobiliario',
                            'Materias Primas',
                            'Otros'
                          ].map(category => (
                            <label key={category} className="flex items-center">
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-red-600"
                                checked={selectedCategories.includes(category)}
                                onChange={() => handleCategoryChange(category)}
                              />
                              <span className="ml-2 text-sm dark:text-gray-300">{category}</span>
                            </label>
                          ))}
                          
                          {/* Categorías para fondos indexados */}
                          {activeTab === 'fondos-indexados' && [
                            'Renta Fija',
                            'Renta Variable',
                            'Mixtos',
                            'Global',
                            'Europa',
                            'Estados Unidos',
                            'Emergentes',
                            'Sectorial'
                          ].map(category => (
                            <label key={category} className="flex items-center">
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-red-600"
                                checked={selectedCategories.includes(category)}
                                onChange={() => handleCategoryChange(category)}
                              />
                              <span className="ml-2 text-sm dark:text-gray-300">{category}</span>
                            </label>
                          ))}
                          
                          {/* Categorías para ETFs */}
                          {activeTab === 'etf-y-etc' && [
                            'Renta Fija',
                            'Renta Variable',
                            'Índice',
                            'Sectorial',
                            'Geográfico',
                            'Materias primas',
                            'Bonos',
                            'Monetarios',
                            'Oro y Metales Preciosos',
                            'Comunicaciones',
                            'Tecnología',
                            'Salud',
                            'Servicios Públicos',
                            'Energía',
                            'Apalancados',
                            'Inversos'
                          ].map(category => (
                            <label key={category} className="flex items-center">
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-red-600"
                                checked={selectedCategories.includes(category)}
                                onChange={() => handleCategoryChange(category)}
                              />
                              <span className="ml-2 text-sm dark:text-gray-300">{category}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Riesgo - con acordeón */}
                    <div className="mb-4 border-b dark:border-gray-700 pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('risk')}
                      >
                        <h3 className="font-medium dark:text-white">Riesgo</h3>
                        <button className="text-gray-500 dark:text-gray-400">
                          {expandedSections.risk ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {expandedSections.risk && (
                        <div className="mt-2 space-y-2 pb-2">
                          {[
                            'Sin valorar',
                            'Riesgo bajo',
                            'Riesgo moderado',
                            'Riesgo medio-alto',
                            'Riesgo alto',
                            'Riesgo muy alto'
                          ].map(risk => (
                            <label key={risk} className="flex items-center">
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-red-600"
                                checked={selectedRiskLevels.includes(risk as RiskLevel)}
                                onChange={() => handleRiskLevelChange(risk as RiskLevel)}
                              />
                              <span className="ml-2 text-sm dark:text-gray-300">{risk}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Divisa con acordeón */}
                    <div className="mb-4 border-b dark:border-gray-700 pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('currency')}
                      >
                        <h3 className="font-medium dark:text-white">Divisa</h3>
                        <button className="text-gray-500 dark:text-gray-400">
                          {expandedSections.currency ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {expandedSections.currency && (
                        <div className="mt-2 space-y-2 pb-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="currency-all"
                              name="currency"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={selectedCurrency === ''}
                              onChange={() => setSelectedCurrency('')}
                            />
                            <label htmlFor="currency-all" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                              Todas
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="currency-eur"
                              name="currency"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={selectedCurrency === 'EUR'}
                              onChange={() => setSelectedCurrency('EUR')}
                            />
                            <label htmlFor="currency-eur" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                              EUR
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="currency-usd"
                              name="currency"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={selectedCurrency === 'USD'}
                              onChange={() => setSelectedCurrency('USD')}
                            />
                            <label htmlFor="currency-usd" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                              USD
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filtro Focus List - Disponible en todas las pestañas */}
                    <div className="mb-4 border-b dark:border-gray-700 pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('focusList')}
                      >
                        <h3 className="font-medium dark:text-white">Focus List</h3>
                        <button className="text-gray-500 dark:text-gray-400">
                          {expandedSections.focusList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {expandedSections.focusList && (
                        <div className="mt-2 space-y-2 pb-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="focus-all"
                              name="focus"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={focusListFilter === 'Todos'}
                              onChange={() => setFocusListFilter('Todos')}
                            />
                            <label htmlFor="focus-all" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                              Todos
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="focus-yes"
                              name="focus"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={focusListFilter === 'Sí'}
                              onChange={() => setFocusListFilter('Sí')}
                            />
                            <label htmlFor="focus-yes" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                              Sí
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="focus-no"
                              name="focus"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={focusListFilter === 'No'}
                              onChange={() => setFocusListFilter('No')}
                            />
                            <label htmlFor="focus-no" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                              No
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filtro Disponible para asesoramiento con cobro implícito - No disponible para ETFs */}
                    {activeTab !== 'etf-y-etc' && (
                      <div className="mb-4 border-b dark:border-gray-700 pb-2">
                        <div 
                          className="flex justify-between items-center cursor-pointer py-2"
                          onClick={() => toggleSection('implicitAdvisory')}
                        >
                          <h3 className="font-medium dark:text-white">Asesoramiento con cobro implícito</h3>
                          <button className="text-gray-500 dark:text-gray-400">
                            {expandedSections.implicitAdvisory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                        {expandedSections.implicitAdvisory && (
                          <div className="mt-2 space-y-2 pb-2">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="implicit-all"
                                name="implicit-advisory"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={implicitAdvisoryFilter === 'Todos'}
                                onChange={() => setImplicitAdvisoryFilter('Todos')}
                              />
                              <label htmlFor="implicit-all" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                Todos
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="implicit-yes"
                                name="implicit-advisory"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={implicitAdvisoryFilter === 'Sí'}
                                onChange={() => setImplicitAdvisoryFilter('Sí')}
                              />
                              <label htmlFor="implicit-yes" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                Sí
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="implicit-no"
                                name="implicit-advisory"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={implicitAdvisoryFilter === 'No'}
                                onChange={() => setImplicitAdvisoryFilter('No')}
                              />
                              <label htmlFor="implicit-no" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                No
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Filtro Disponible para asesoramiento con cobro explícito - No disponible para ETFs */}
                    {activeTab !== 'etf-y-etc' && (
                      <div className="mb-4 border-b dark:border-gray-700 pb-2">
                        <div 
                          className="flex justify-between items-center cursor-pointer py-2"
                          onClick={() => toggleSection('explicitAdvisory')}
                        >
                          <h3 className="font-medium dark:text-white">Asesoramiento con cobro explícito</h3>
                          <button className="text-gray-500 dark:text-gray-400">
                            {expandedSections.explicitAdvisory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                        {expandedSections.explicitAdvisory && (
                          <div className="mt-2 space-y-2 pb-2">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="explicit-all"
                                name="explicit-advisory"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={explicitAdvisoryFilter === 'Todos'}
                                onChange={() => setExplicitAdvisoryFilter('Todos')}
                              />
                              <label htmlFor="explicit-all" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                Todos
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="explicit-yes"
                                name="explicit-advisory"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={explicitAdvisoryFilter === 'Sí'}
                                onChange={() => setExplicitAdvisoryFilter('Sí')}
                              />
                              <label htmlFor="explicit-yes" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                Sí
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="explicit-no"
                                name="explicit-advisory"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={explicitAdvisoryFilter === 'No'}
                                onChange={() => setExplicitAdvisoryFilter('No')}
                              />
                              <label htmlFor="explicit-no" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                No
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Filtro Hedge - No disponible para ETFs */}
                    {activeTab !== 'etf-y-etc' && (
                      <div className="mb-4 border-b dark:border-gray-700 pb-2">
                        <div 
                          className="flex justify-between items-center cursor-pointer py-2"
                          onClick={() => toggleSection('hedge')}
                        >
                          <h3 className="font-medium dark:text-white">Hedge</h3>
                          <button className="text-gray-500 dark:text-gray-400">
                            {expandedSections.hedge ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                        {expandedSections.hedge && (
                          <div className="mt-2 space-y-2 pb-2">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="hedge-all"
                                name="hedge"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={hedgeFilter === 'Todos'}
                                onChange={() => setHedgeFilter('Todos')}
                              />
                              <label htmlFor="hedge-all" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                Todos
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="hedge-yes"
                                name="hedge"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={hedgeFilter === 'Sí'}
                                onChange={() => setHedgeFilter('Sí')}
                              />
                              <label htmlFor="hedge-yes" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                Sí
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="hedge-no"
                                name="hedge"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={hedgeFilter === 'No'}
                                onChange={() => setHedgeFilter('No')}
                              />
                              <label htmlFor="hedge-no" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                No
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Filtro de Política de dividendos */}
                    <div className="mb-4 border-b dark:border-gray-700 pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('dividendPolicy')}
                      >
                        <h3 className="font-medium dark:text-white">Política de dividendos</h3>
                        <button className="text-gray-500 dark:text-gray-400">
                          {expandedSections.dividendPolicy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {expandedSections.dividendPolicy && (
                        <div className="mt-2 space-y-2 pb-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="dividend-all"
                              name="dividend-policy"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={dividendPolicyFilter === 'Todos'}
                              onChange={() => setDividendPolicyFilter('Todos')}
                            />
                            <label htmlFor="dividend-all" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                              Todos
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="dividend-accumulation"
                              name="dividend-policy"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={dividendPolicyFilter === 'Acumulación'}
                              onChange={() => setDividendPolicyFilter('Acumulación')}
                            />
                            <label htmlFor="dividend-accumulation" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                              Acumulación
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="dividend-distribution"
                              name="dividend-policy"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={dividendPolicyFilter === 'Distribución'}
                              onChange={() => setDividendPolicyFilter('Distribución')}
                            />
                            <label htmlFor="dividend-distribution" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                              Distribución
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filtro de Tipo de Réplica (solo visible en ETFs y ETCs) */}
                    {activeTab === 'etf-y-etc' && (
                      <div className="mb-4 border-b dark:border-gray-700 pb-2">
                        <div 
                          className="flex justify-between items-center cursor-pointer py-2"
                          onClick={() => toggleSection('replicationType')}
                        >
                          <h3 className="font-medium dark:text-white">Tipo de Réplica</h3>
                          <button className="text-gray-500 dark:text-gray-400">
                            {expandedSections.replicationType ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                        {expandedSections.replicationType && (
                          <div className="mt-2 space-y-2 pb-2">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="replication-all"
                                name="replication-type"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={replicationTypeFilter === 'Todos'}
                                onChange={() => setReplicationTypeFilter('Todos')}
                              />
                              <label htmlFor="replication-all" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                Todos
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="replication-fisica"
                                name="replication-type"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={replicationTypeFilter === 'Física'}
                                onChange={() => setReplicationTypeFilter('Física')}
                              />
                              <label htmlFor="replication-fisica" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                Física
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="replication-sintetica"
                                name="replication-type"
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                checked={replicationTypeFilter === 'Sintética'}
                                onChange={() => setReplicationTypeFilter('Sintética')}
                              />
                              <label htmlFor="replication-sintetica" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                                Sintética
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selector de columnas visibles - con acordeón */}
                    <div className="mb-4">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('columns')}
                      >
                        <h3 className="font-medium dark:text-white">Columnas visibles</h3>
                        <button className="text-gray-500 dark:text-gray-400">
                          {expandedSections.columns ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {expandedSections.columns && (
                        <div className="mt-2 pb-2">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleToggleAllColumns(true)}
                                className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1"
                                title="Mostrar todas las columnas"
                              >
                                <Eye size={14} />
                                <span>Todas</span>
                              </button>
                              <button 
                                onClick={() => handleToggleAllColumns(false)}
                                className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1"
                                title="Ocultar todas las columnas"
                              >
                                <EyeOff size={14} />
                                <span>Ninguna</span>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {DEFAULT_COLUMNS
                              .filter(column => {
                                // No mostrar URL Ficha Comercial
                                if (column.id === 'factsheet_url') return false;
                                
                                // No mostrar columnas específicas en ETFs
                                if (activeTab === 'etf-y-etc' && (
                                    column.id === 'compartment_code' || 
                                    column.id === 'implicit_advisory' || 
                                    column.id === 'explicit_advisory' ||
                                    column.id === 'currency'
                                  )) return false;
                                
                                return true;
                              })
                              .map(column => (
                              <label key={column.id} className="flex items-center justify-between">
                                <span className="text-sm dark:text-gray-300">{column.title} {column.subTitle ? `(${column.subTitle})` : ''}</span>
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-red-600"
                                  checked={visibleColumns.includes(column.id)}
                                  onChange={() => handleColumnToggle(column.id)}
                                  disabled={column.id === 'info'}
                                />
                              </label>
                            ))}

                            {/* Columnas específicas para ETFs */}
                            {activeTab === 'etf-y-etc' && (
                              <div className="space-y-2 mt-2 border-t pt-2">
                                <div className="font-medium text-sm text-gray-700 mb-1 dark:text-gray-300">Columnas para ETFs de Renta Fija:</div>
                                <label className="flex items-center justify-between">
                                  <span className="text-sm dark:text-gray-300">Calificación</span>
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-red-600"
                                    checked={visibleColumns.includes('rating')}
                                    onChange={() => handleColumnToggle('rating')}
                                  />
                                </label>
                                <label className="flex items-center justify-between">
                                  <span className="text-sm dark:text-gray-300">Rango de vencimientos</span>
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-red-600"
                                    checked={visibleColumns.includes('maturity_range')}
                                    onChange={() => handleColumnToggle('maturity_range')}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
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

            {/* Overlay para cerrar el panel en móvil */}
            {isFilterPanelOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                onClick={toggleFilterPanel}
              />
            )}

            {/* Contenido principal */}
            <div className="flex-1">
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
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 