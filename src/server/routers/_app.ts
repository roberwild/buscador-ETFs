import { router } from '../trpc';
import { analysisRouter } from './analysis';

export const appRouter = router({
  analysis: analysisRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter; 