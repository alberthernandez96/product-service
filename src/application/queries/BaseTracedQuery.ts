import { v4 as uuidv4 } from 'uuid';
import { Query } from '@albertoficial/backend-shared';
import { type TracedHandlerContext } from '@albertoficial/observability-shared';
import { observability } from '../../setup/Observability';

export abstract class BaseTracedQuery<TQuery extends Query, TResult> implements Query {
  readonly queryId: string = uuidv4();
  readonly createdAt: Date = new Date();
  readonly correlationId?: string;

  protected abstract readonly queryName: string;
  protected abstract readonly metrics?: {
    counter?: { add: (value: number, attributes?: Record<string, string>) => void };
    histogram?: { record: (value: number, attributes?: Record<string, string>) => void };
    counterLabels?: Record<string, string>;
    histogramLabels?: Record<string, string>;
  };

  async executeWithTracing(
    handler: (query: TQuery, context: TracedHandlerContext) => Promise<TResult>
  ): Promise<TResult> {
    const tracer = observability.getTracer();
    const logger = observability.getLogger(this.queryName);

    const span = tracer.startSpan(`${this.queryName}.execute`, {
      attributes: {
        'query.name': this.queryName,
        'query.id': this.queryId,
        'correlation.id': this.correlationId || '',
        ...this.getSpanAttributes(),
      },
    });

    const startTime = Date.now();
    const context: TracedHandlerContext = {
      span,
      logger,
    };

    try {
      logger.info(
        {
          queryName: this.queryName,
          queryId: this.queryId,
          correlationId: this.correlationId,
          ...this.getSpanAttributes(),
        },
        `Processing ${this.queryName}`
      );

      const result = await handler(this as unknown as TQuery, context);
      const duration = Date.now() - startTime;

      this.onSuccess(result, duration, span);

      if (this.metrics?.counter) {
        this.metrics.counter.add(1, {
          status: 'success',
          ...(this.metrics.counterLabels ?? {}),
        });
      }

      if (this.metrics?.histogram) {
        this.metrics.histogram.record(duration, {
          status: 'success',
          ...(this.metrics.histogramLabels ?? {}),
        });
      }

      span.setStatus({ code: 1 });
      span.setAttribute('duration_ms', duration);

      logger.info(
        {
          queryName: this.queryName,
          queryId: this.queryId,
          duration,
          correlationId: this.correlationId,
          ...this.getSpanAttributes(),
        },
        `${this.queryName} completed successfully`
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as Error;

      span.recordException(err);
      span.setStatus({
        code: 2,
        message: err.message,
      });
      span.setAttribute('duration_ms', duration);

      if (this.metrics?.counter) {
        this.metrics.counter.add(1, {
          status: 'error',
          ...(this.metrics.counterLabels ?? {}),
        });
      }

      if (this.metrics?.histogram) {
        this.metrics.histogram.record(duration, {
          status: 'error',
          ...(this.metrics.histogramLabels ?? {}),
        });
      }

      observability.getBaseMetrics().errorsTotal.add(1, {
        query: this.queryName,
      });

      this.onError(err, duration, span);

      logger.error(
        {
          queryName: this.queryName,
          queryId: this.queryId,
          duration,
          error: err,
          correlationId: this.correlationId,
          ...this.getSpanAttributes(),
        },
        `${this.queryName} failed`
      );

      throw err;
    } finally {
      span.end();
    }
  }

  protected getSpanAttributes(): Record<string, string | number | boolean> {
    const attrs: Record<string, string | number | boolean> = {};
    if ('page' in this && this.page) attrs['query.page'] = this.page as number;
    if ('limit' in this && this.limit) attrs['query.limit'] = this.limit as number;
    return attrs;
  }

  protected onSuccess(
    _result: TResult,
    _duration: number,
    _span: TracedHandlerContext['span']
  ): void {}

  protected onError(
    _error: Error,
    _duration: number,
    _span: TracedHandlerContext['span']
  ): void {}
}
