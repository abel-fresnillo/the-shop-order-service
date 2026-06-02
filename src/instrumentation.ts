import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const grafanaInstanceId = process.env.GRAFANA_INSTANCE_ID;
const grafanaApiToken = process.env.GRAFANA_API_TOKEN;

const otlpHeaders: Record<string, string> =
  grafanaInstanceId && grafanaApiToken
    ? {
        Authorization: `Basic ${Buffer.from(
          `${grafanaInstanceId}:${grafanaApiToken}`
        ).toString("base64")}`,
      }
    : {};

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]:
    process.env.OTEL_SERVICE_NAME ?? "the-shop-order-service",
  [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? "0.0.0",
  "deployment.environment": process.env.NODE_ENV ?? "development",
});

const traceExporter = new OTLPTraceExporter({
  url: otlpEndpoint ? `${otlpEndpoint}/v1/traces` : undefined,
  headers: otlpHeaders,
});

const metricExporter = new OTLPMetricExporter({
  url: otlpEndpoint ? `${otlpEndpoint}/v1/metrics` : undefined,
  headers: otlpHeaders,
});

export const sdk = new NodeSDK({
  resource,
  // SimpleSpanProcessor required for Vercel: process exits before BatchSpanProcessor can flush
  spanProcessors: [new SimpleSpanProcessor(traceExporter)],
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 30_000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
      "@opentelemetry/instrumentation-net": { enabled: false },
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: (req) => req.url === "/health",
      },
    }),
  ],
});

if (process.env.NODE_ENV !== "test") {
  sdk.start();
}

const shutdown = () => sdk.shutdown().finally(() => process.exit(0));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
