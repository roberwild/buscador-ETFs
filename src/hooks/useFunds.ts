import { useState, useEffect } from 'react';
import { Fund } from '@/types/fund';

interface UseFundsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  currency?: string | string[];
  sortBy?: string;
  riskLevels?: string;
  dataSource?: string;
  focusListFilter?: string;
  implicitAdvisoryFilter?: string;
  explicitAdvisoryFilter?: string;
  hedgeFilter?: string;
  dividendPolicyFilter?: string;
  replicationTypeFilter?: string;
  skipRequest?: boolean;
}

interface UseFundsResult {
  funds: Fund[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFunds({
  page = 1,
  limit = 10,
  search = '',
  category = '',
  currency = '',
  sortBy = '',
  riskLevels = '',
  dataSource = 'fondos-gestion-activa',
  focusListFilter = 'Todos',
  implicitAdvisoryFilter = 'Todos',
  explicitAdvisoryFilter = 'Todos',
  hedgeFilter = 'Todos',
  dividendPolicyFilter = 'Todos',
  replicationTypeFilter = 'Todos',
  skipRequest = false,
}: UseFundsParams = {}): UseFundsResult {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(!skipRequest);
  const [error, setError] = useState<string | null>(null);

  const fetchFunds = async () => {
    if (skipRequest) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);

      console.log('Enviando parámetros a la API:', {
        category,
        selectedCategories: category.split(',')
      });

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(currency && (Array.isArray(currency) ? currency.length > 0 : true) && { 
          currency: Array.isArray(currency) ? currency.join(',') : currency 
        }),
        ...(sortBy && { sortBy }),
        ...(riskLevels && { riskLevels }),
        dataSource,
        focusListFilter,
        implicitAdvisoryFilter,
        explicitAdvisoryFilter,
        hedgeFilter,
        dividendPolicyFilter,
        replicationTypeFilter,
      });

      const response = await fetch(`/api/funds?${params}`);
      
      if (!response.ok) {
        throw new Error('Error fetching funds');
      }

      const data = await response.json();
      
      // Ensure we have valid data before updating state
      if (data && data.funds) {
        setFunds(data.funds);
        setTotal(data.total || 0);
      } else {
        console.error('Invalid data format received from API:', data);
        setFunds([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Error in useFunds hook:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setFunds([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (skipRequest) {
      setIsLoading(false);
    }
  }, [skipRequest]);

  useEffect(() => {
    if (!skipRequest) {
      fetchFunds();
    }
  }, [page, limit, search, category, currency, sortBy, riskLevels, dataSource, focusListFilter, implicitAdvisoryFilter, explicitAdvisoryFilter, hedgeFilter, dividendPolicyFilter, replicationTypeFilter, skipRequest]);

  return {
    funds: funds || [], // Ensure funds is always an array
    total,
    page,
    totalPages: Math.ceil(total / limit),
    isLoading,
    error,
    refetch: fetchFunds,
  };
} 