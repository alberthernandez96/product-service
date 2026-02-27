import { Observability as ObservabilityShared } from '@albertoficial/observability-shared';

export const observability = new ObservabilityShared({
  serviceName: 'product-service',
  serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
  environment: process.env.NODE_ENV,
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined,
  otlpHeaders: process.env.OTEL_EXPORTER_OTLP_HEADERS
    ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
    : undefined,
  logLevel: (process.env.LOG_LEVEL as 'info' | 'debug' | 'warn' | 'error') || 'info',
  instrumentations: {
    express: true,
    pg: true,
    http: true,
    fs: false,
  },
  ignoreRoutes: ['/health', '/metrics'],
});

try {
  observability.initialize();
} catch (error: unknown) {
  const err = error as Error;
  if (
    err.message &&
    err.message.includes('duplicate registration') &&
    err.message.includes('metrics')
  ) {
    // ignore duplicate metrics registration
  } else {
    console.warn('Observability initialization warning:', err);
  }
}
