import { Server } from 'http';
import cors from 'cors';
import express, { Express } from 'express';
import { QueryBus } from '@albertoficial/backend-shared';
import { ProductRoutes } from '@albertoficial/api-contracts';
import { GetProductListQuery, GetProductListQueryHandler } from '@application';
import { ProductQueryController } from '@presentation';
import { ProductRepositoryAdapter } from '@infrastructure';
import { observability } from './Observability';
import { Infrastructure } from './Infrastructure';

export class Application {
  private app: Express;
  private server?: Server;

  constructor(infrastructure: Infrastructure) {
    this.app = express();

    if (process.env.NODE_ENV === 'development') {
      this.app.use(cors());
    }
    this.app.use(express.json());

    this.app.use(observability.getTracingMiddleware());

    this.app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
    this.app.get('/metrics', observability.getMetrics());

    const queryBus = new QueryBus();
    const productRepository = infrastructure.getProductRepository();

    queryBus.registerMany([
      {
        type: GetProductListQuery,
        handler: new GetProductListQueryHandler(productRepository),
      },
    ]);

    const productQueryController = new ProductQueryController(queryBus);

    // Product routes
    this.app.get(ProductRoutes.getAll, (req, res) =>
      productQueryController.getAll(req, res)
    );
  }

  async start(): Promise<void> {
    const PORT = process.env.PORT || 3005;
    const logger = observability.getRootLogger();

    this.server = this.app.listen(PORT, () => {
      logger.info({ port: PORT }, `Product Service running on port ${PORT}`);
    });
  }

  async shutdown(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
  }
}
