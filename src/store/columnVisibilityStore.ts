import { create } from 'zustand';
import { ColumnId, DEFAULT_COLUMNS } from '@/components/FundTable';

interface ColumnVisibilityState {
  // Visible column IDs
  visibleColumns: ColumnId[];
  
  // Set which columns are visible
  setVisibleColumns: (columns: ColumnId[]) => void;
  
  // Toggle a specific column's visibility
  toggleColumnVisibility: (columnId: ColumnId) => void;
  
  // Show all columns
  showAllColumns: () => void;
  
  // Hide all columns except info
  hideAllColumns: () => void;
  
  // Check if a column is visible
  isColumnVisible: (columnId: ColumnId) => boolean;
  
  // Initialize columns based on default settings
  initializeColumns: () => void;
  
  // Apply column visibility based on data source type
  updateForDataSource: (dataSource: 'fondos-gestion-activa' | 'fondos-indexados' | 'etf-y-etc') => void;
}

export const useColumnVisibilityStore = create<ColumnVisibilityState>((set, get) => ({
  visibleColumns: [],
  
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),
  
  toggleColumnVisibility: (columnId) => {
    set((state) => {
      if (columnId === 'info') return state; // Info column should always be visible
      
      const isVisible = state.visibleColumns.includes(columnId);
      
      if (isVisible) {
        return { visibleColumns: state.visibleColumns.filter(id => id !== columnId) };
      } else {
        return { visibleColumns: [...state.visibleColumns, columnId] };
      }
    });
  },
  
  showAllColumns: () => {
    const allVisibleColumns = DEFAULT_COLUMNS
      .filter(col => col.id !== 'factsheet_url') // Never show factsheet_url column
      .map(col => col.id);
    
    set({ visibleColumns: allVisibleColumns });
  },
  
  hideAllColumns: () => {
    set({ visibleColumns: ['info'] }); // Only keep info column visible
  },
  
  isColumnVisible: (columnId) => {
    return get().visibleColumns.includes(columnId);
  },
  
  initializeColumns: () => {
    const defaultVisibleColumns = DEFAULT_COLUMNS
      .filter(col => col.visible && col.id !== 'factsheet_url')
      .map(col => col.id);
    
    set({ visibleColumns: defaultVisibleColumns });
  },
  
  updateForDataSource: (dataSource) => {
    set((state) => {
      let newColumns = [...state.visibleColumns];
      
      // Remove columns that shouldn't be visible for ETFs
      if (dataSource === 'etf-y-etc') {
        newColumns = newColumns.filter(id => 
          id !== 'compartment_code' && 
          id !== 'implicit_advisory' && 
          id !== 'explicit_advisory' &&
          id !== 'currency'
        );
      } else {
        // For other data sources, ensure certain columns are added if they're in DEFAULT_COLUMNS visible setting
        const columnsToCheck = [
          'compartment_code',
          'implicit_advisory',
          'explicit_advisory',
          'currency',
          'hedge'
        ];
        
        columnsToCheck.forEach(id => {
          const columnDef = DEFAULT_COLUMNS.find(col => col.id === id as ColumnId);
          if (columnDef?.visible && !newColumns.includes(id as ColumnId)) {
            newColumns.push(id as ColumnId);
          }
        });
      }
      
      return { visibleColumns: newColumns };
    });
  }
})); 