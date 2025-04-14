'use client'

import { useState, useEffect } from 'react'
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
    columns: true
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
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
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
      setVisibleColumns(
        DEFAULT_COLUMNS
          .filter(col => col.id !== 'factsheet_url')
          .map(col => col.id)
      );
    } else {
      // Mantener solo las columnas obligatorias
      setVisibleColumns(['info']);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold">Buscador de Fondos de Inversión</h1>
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
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('fondos-gestion-activa')}
                className={`${
                  activeTab === 'fondos-gestion-activa'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm sm:text-base`}
              >
                Fondos gestión activa
              </button>
              <button
                onClick={() => handleTabChange('fondos-indexados')}
                className={`${
                  activeTab === 'fondos-indexados'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm sm:text-base`}
              >
                Fondos indexados
              </button>
              <button
                onClick={() => handleTabChange('etf-y-etc')}
                className={`${
                  activeTab === 'etf-y-etc'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm sm:text-base`}
              >
                ETF y ETC
              </button>
            </nav>
          </div>

          {/* Botón para mostrar/ocultar filtros en móvil */}
          <button
            onClick={toggleFilterPanel}
            className="md:hidden flex items-center gap-2 mb-4 bg-gray-100 px-4 py-2 rounded-md"
          >
            <Filter size={20} />
            <span>{isFilterPanelOpen ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Panel lateral de filtros */}
            <div className={`
              ${isFilterPanelCollapsed ? 'md:w-12' : 'md:w-72'}
              md:flex-shrink-0
              fixed md:static inset-0 z-30 bg-white md:bg-transparent
              transition-all duration-300 ease-in-out
              ${isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              {/* Botón para contraer/expandir en desktop */}
              <button
                onClick={toggleFilterPanelCollapse}
                className="hidden md:flex absolute -right-4 top-12 items-center justify-center h-8 w-8 rounded-full bg-white shadow-md z-10 text-gray-600 hover:text-red-600 focus:outline-none"
              >
                {isFilterPanelCollapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronLeft size={16} />
                )}
              </button>

              <div className={`bg-white h-full md:h-auto overflow-y-auto md:rounded-lg md:shadow p-6 ${isFilterPanelCollapsed ? 'overflow-hidden' : ''}`}>
                <div className="flex justify-between items-center mb-6 md:hidden">
                  <h2 className="text-xl font-semibold">Filtros</h2>
                  <button onClick={toggleFilterPanel} className="p-2">
                    <X size={24} />
                  </button>
                </div>

                {!isFilterPanelCollapsed && (
                  <>
                    <h2 className="hidden md:block text-xl font-semibold mb-6">
                      {activeTab === 'fondos-gestion-activa' && 'Filtrar fondos de inversión'}
                      {activeTab === 'fondos-indexados' && 'Filtrar fondos indexados'}
                      {activeTab === 'etf-y-etc' && 'Filtrar ETFs y ETCs'}
                    </h2>
                    
                    {/* Sección Búsqueda con acordeón */}
                    <div className="mb-4 border-b pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('search')}
                      >
                        <h3 className="font-medium">Buscar</h3>
                        <button className="text-gray-500">
                          {expandedSections.search ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {expandedSections.search && (
                        <div className="mt-2 pb-2">
                          <input
                            type="text"
                            placeholder="ISIN"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={isinSearch}
                            onChange={(e) => setIsinSearch(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Categorías - Adaptadas según la pestaña activa - con acordeón */}
                    <div className="mb-4 border-b pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('category')}
                      >
                        <h3 className="font-medium">Categoría</h3>
                        <button className="text-gray-500">
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
                              <span className="ml-2 text-sm">{category}</span>
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
                              <span className="ml-2 text-sm">{category}</span>
                            </label>
                          ))}
                          
                          {/* Categorías para ETFs */}
                          {activeTab === 'etf-y-etc' && [
                            'Índice',
                            'Sectorial',
                            'Geográfico',
                            'Materias primas',
                            'Bonos',
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
                              <span className="ml-2 text-sm">{category}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Riesgo - con acordeón */}
                    <div className="mb-4 border-b pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('risk')}
                      >
                        <h3 className="font-medium">Riesgo</h3>
                        <button className="text-gray-500">
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
                              <span className="ml-2 text-sm">{risk}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Divisa con acordeón */}
                    <div className="mb-4 border-b pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('currency')}
                      >
                        <h3 className="font-medium">Divisa</h3>
                        <button className="text-gray-500">
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
                            <label htmlFor="currency-all" className="ml-2 block text-sm text-gray-700">
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
                            <label htmlFor="currency-eur" className="ml-2 block text-sm text-gray-700">
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
                            <label htmlFor="currency-usd" className="ml-2 block text-sm text-gray-700">
                              USD
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filtro Focus List - Disponible en todas las pestañas */}
                    <div className="mb-4 border-b pb-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('focusList')}
                      >
                        <h3 className="font-medium">Focus List</h3>
                        <button className="text-gray-500">
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
                            <label htmlFor="focus-all" className="ml-2 block text-sm text-gray-700">
                              Todos
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="focus-yes"
                              name="focus"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={focusListFilter === 'Y'}
                              onChange={() => setFocusListFilter('Y')}
                            />
                            <label htmlFor="focus-yes" className="ml-2 block text-sm text-gray-700">
                              Sí
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="focus-no"
                              name="focus"
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              checked={focusListFilter === 'N'}
                              onChange={() => setFocusListFilter('N')}
                            />
                            <label htmlFor="focus-no" className="ml-2 block text-sm text-gray-700">
                              No
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selector de columnas visibles - con acordeón */}
                    <div className="mb-4">
                      <div 
                        className="flex justify-between items-center cursor-pointer py-2"
                        onClick={() => toggleSection('columns')}
                      >
                        <h3 className="font-medium">Columnas visibles</h3>
                        <button className="text-gray-500">
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
                              .filter(column => column.id !== 'factsheet_url')
                              .map(column => (
                              <label key={column.id} className="flex items-center justify-between">
                                <span className="text-sm">{column.title} {column.subTitle ? `(${column.subTitle})` : ''}</span>
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-red-600"
                                  checked={visibleColumns.includes(column.id)}
                                  onChange={() => handleColumnToggle(column.id)}
                                  disabled={column.id === 'info'}
                                />
                              </label>
                            ))}
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
            <div className="flex-1 overflow-x-auto">
              <FundTable 
                isinSearch={isinSearch}
                selectedCategories={selectedCategories}
                selectedCurrency={selectedCurrency}
                selectedRiskLevels={selectedRiskLevels}
                dataSource={activeTab}
                visibleColumns={visibleColumns}
                focusListFilter={focusListFilter}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 