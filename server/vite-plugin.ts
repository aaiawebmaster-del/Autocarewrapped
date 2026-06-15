import type { Plugin } from 'vite';
import { handleMockWrappedApi } from './mock-api';

/** Vite dev middleware — simulates Auto Care report API with cookie auth. */
export function mockWrappedApiPlugin(): Plugin {
  return {
    name: 'mock-wrapped-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (handleMockWrappedApi(req, res)) return;
        next();
      });
    },
  };
}
