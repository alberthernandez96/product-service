import { MetricsFactory } from '@albertoficial/observability-shared';

const metricsFactory = new MetricsFactory('product-service', '1.0.0');

export interface ProductMetricsType {
  productsRetrieved: { add: (value: number, attributes?: Record<string, string>) => void };
  productRetrieveDuration: { record: (value: number, attributes?: Record<string, string>) => void };
}

export const productMetrics: ProductMetricsType = {
  productsRetrieved: metricsFactory.createCounter('products.retrieved', {
    description: 'Total number of products retrieved',
  }),

  productRetrieveDuration: metricsFactory.createHistogram('products.retrieve.duration', {
    description: 'Duration of product retrieval operations in milliseconds',
    unit: 'ms',
  }),
};
