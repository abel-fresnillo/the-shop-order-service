import winston from "winston";
import LokiTransport from "winston-loki";

const transports: winston.transport[] = [
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === "development"
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json(),
  }),
];

if (process.env.LOKI_HOST && process.env.NODE_ENV !== "test") {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_HOST,
      basicAuth: `${process.env.LOKI_USER}:${process.env.GRAFANA_API_TOKEN}`,
      labels: { app: "the-shop-order-service" },
      json: true,
      batching: false,
      format: winston.format.json(),
      onConnectionError: (err) => console.error("Loki transport error:", err),
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  transports,
});
