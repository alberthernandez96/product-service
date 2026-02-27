# 📊 Stack de Observabilidad (compartido)

**Recomendado**: usar **un solo stack** para quote-service y product-service.

- Levanta el stack **una vez** desde **quote-service** (ahí está Prometheus, Grafana y Jaeger con ambos scrape jobs y todos los dashboards):
  ```bash
  cd ../quote-service && docker compose -f docker-compose.dev.yml up -d
  ```
- Luego inicia product-service (puerto 3005). Prometheus ya scrapea `host.docker.internal:3005` y en Grafana verás los dashboards **Product Service - Production Dashboard** y **Product Service - Traces Dashboard (Jaeger)**.

Si prefieres levantar solo los contenedores de observabilidad desde product-service (sin quote-service), puedes usar:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Este stack usa **puertos distintos** para no chocar con el de quote-service:
- **Jaeger UI**: 16687 | **OTLP gRPC**: 4319 | **OTLP HTTP**: 4320
- **Prometheus**: 9091
- **Grafana**: 3001

En tu `.env` de product-service, para enviar traces a este Jaeger usa:
`OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4319`

### 2. Configurar variables de entorno

Asegúrate de que tu `.env` tenga (por ejemplo):

```env
# OTLP para enviar traces a Jaeger (gRPC)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
SERVICE_VERSION=1.0.0
LOG_LEVEL=info
PORT=3005
```

### 3. Iniciar la aplicación

```bash
npm run start
```

O todo en uno (stack + app):

```bash
npm run dev:up
```

## 📈 Acceder a las herramientas

### **Jaeger UI** – Visualizar Traces
- **URL**: http://localhost:16686
- **Qué verás**:
  - Traces de las peticiones a product-service
  - Spans de GetProductListQuery
  - Tiempos y atributos (products.count, products.total)
  - Selecciona el servicio `product-service` para filtrar

### **Prometheus** – Métricas
- **URL**: http://localhost:9090
- **Qué verás**:
  - Métricas HTTP (requests, duración)
  - Métricas de negocio: products.retrieved, products.retrieve.duration
  - errors.total

### **Grafana** – Dashboards
- **URL**: http://localhost:3000
- **Credenciales**: usuario `admin`, contraseña `admin`
- **Dashboards disponibles**:
  - **Product Service - Production Dashboard**: métricas (Prometheus): productos recuperados, tasa de error, latencia P50/P95/P99, duración media de retrieve, HTTP por método.
  - **Product Service - Traces Dashboard (Jaeger)**: variable Trace ID y panel de traces con datasource Jaeger (o usar Explore → Jaeger y buscar por servicio `product-service`).

## 🔍 Queries útiles en Prometheus

- Total de productos recuperados: `products_retrieved_total` (o `products.retrieved` según exportador)
- Duración de retrieve: `products_retrieve_duration_ms_*` (histogram: _bucket, _sum, _count)
- Errores: `errors_total`
- HTTP: `http_requests_total`, `http_request_duration_*`

*(Si los nombres en Prometheus difieren –p. ej. por prefijo del servicio– compruébalos en Prometheus → Status → Targets y en la pestaña Graph.)*

## 📊 Métricas del servicio

- **Negocio**: `products.retrieved` (counter), `products.retrieve.duration` (histogram, ms)
- **Sistema**: `http_requests_total`, `http_request_duration_ms`, `errors_total`

## 🛑 Detener el stack

```bash
npm run dev:down
```

o:

```bash
docker compose -f docker-compose.dev.yml down
```

Para borrar volúmenes (datos de Prometheus/Grafana):

```bash
docker compose -f docker-compose.dev.yml down -v
```

## 📝 Notas

- Los traces se envían a Jaeger cuando la app recibe requests (p. ej. `GET /api/products`).
- Prometheus scrapea `/metrics` del product-service; el target en `prometheus.yml` es `host.docker.internal:3005` (ajusta el puerto si cambias `PORT` en `.env`).
