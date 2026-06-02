import { trace, Tracer } from "@opentelemetry/api";

export function getTracer(): Tracer {
  return trace.getTracer("the-shop-order-service");
}
