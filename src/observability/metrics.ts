import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("the-shop-order-service");

export const ordersCreated = meter.createCounter("orders.created.total", {
  description: "Total number of successfully created orders",
  unit: "{order}",
});

export const ordersFailed = meter.createCounter("orders.failed.total", {
  description: "Total number of failed order operations",
  unit: "{order}",
});

export const orderTotalValue = meter.createHistogram("orders.total_value", {
  description: "Distribution of order total values",
  unit: "USD",
  advice: { explicitBucketBoundaries: [0, 10, 25, 50, 100, 250, 500, 1000] },
});

const heapGauge = meter.createObservableGauge("nodejs.heap.used", {
  description: "V8 heap used bytes",
  unit: "By",
});

heapGauge.addCallback((result) => {
  result.observe(process.memoryUsage().heapUsed);
});

export function startEventLoopMonitoring(): void {
  const eventLoopLag = meter.createObservableGauge("nodejs.event_loop.lag", {
    description: "Event loop lag in milliseconds",
    unit: "ms",
  });

  let lag = 0;
  const measure = () => {
    const start = Date.now();
    setImmediate(() => {
      lag = Date.now() - start;
      setTimeout(measure, 1000);
    });
  };
  measure();

  eventLoopLag.addCallback((result) => {
    result.observe(lag);
  });
}
