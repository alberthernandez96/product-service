import { v4 as uuidv4 } from 'uuid';
import { BaseTracedQuery } from '../BaseTracedQuery';
import { productMetrics } from '@infrastructure';
import { type TracedHandlerContext } from '@albertoficial/observability-shared';

interface GetProductListQueryMetrics {
  counter: { add: (value: number, attributes?: Record<string, string>) => void };
  histogram: { record: (value: number, attributes?: Record<string, string>) => void };
  counterLabels: Record<string, string>;
  histogramLabels: Record<string, string>;
}

export class GetProductListQuery extends BaseTracedQuery<GetProductListQuery, unknown> {
  readonly queryId = uuidv4();
  readonly createdAt = new Date();
  readonly correlationId?: string;
  readonly page: number;
  readonly limit: number;

  protected readonly queryName = 'GetProductListQuery';
  protected readonly metrics: GetProductListQueryMetrics = {
    counter: productMetrics.productsRetrieved,
    histogram: productMetrics.productRetrieveDuration,
    counterLabels: { type: 'list' },
    histogramLabels: { type: 'list' },
  };

  constructor(page: number, limit: number, correlationId?: string) {
    super();
    this.page = page;
    this.limit = limit;
    this.correlationId = correlationId;
  }

  protected onSuccess(
    result: unknown,
    _duration: number,
    span: TracedHandlerContext['span']
  ): void {
    const response = result as { items?: unknown[]; total?: number };
    if (response?.items) {
      span.setAttribute('products.count', response.items.length);
    }
    if (response?.total !== undefined) {
      span.setAttribute('products.total', response.total);
    }
  }
}
