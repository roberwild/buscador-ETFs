/**
 * This is your server's entry point to tRPC's type-safe API.
 */
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

/**
 * Context creation for tRPC
 */
export const createTRPCContext = (opts: CreateNextContextOptions) => {
  return {
    req: opts.req,
    res: opts.res,
  };
};

/**
 * tRPC API initialization
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure; 