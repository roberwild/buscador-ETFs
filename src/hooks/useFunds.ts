import { useState, useEffect } from 'react';
import { Fund } from '@/types/fund';

interface UseFundsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  currency?: string;
  sortBy?: string;
  riskLevels?: string;
  dataSource?: string;
  focusListFilter?: string;
  implicitAdvisoryFilter?: string;
  explicitAdvisoryFilter?: string;
  hedgeFilter?: string;
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
}: UseFundsParams = {}): UseFundsResult {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFunds = async () => {
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
        ...(currency && { currency }),
        ...(sortBy && { sortBy }),
        ...(riskLevels && { riskLevels }),
        dataSource,
        focusListFilter,
        implicitAdvisoryFilter,
        explicitAdvisoryFilter,
        hedgeFilter,
      });

      const response = await fetch(`/api/funds?${params}`);
      
      if (!response.ok) {
        throw new Error('Error fetching funds');
      }

      const data = await response.json();
      setFunds(data.funds);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [page, limit, search, category, currency, sortBy, riskLevels, dataSource, focusListFilter, implicitAdvisoryFilter, explicitAdvisoryFilter, hedgeFilter]);

  return {
    funds,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    isLoading,
    error,
    refetch: fetchFunds,
  };
} 