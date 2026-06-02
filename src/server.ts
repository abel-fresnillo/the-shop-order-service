import './instrumentation';
import { createApp } from './app';
import { startEventLoopMonitoring } from './observability/metrics';
import { logger } from './observability/logger';

const app = createApp();
const port = process.env.PORT ?? 3001;

if (process.env.NODE_ENV !== 'test') {
  startEventLoopMonitoring();
}

app.listen(port, () => logger.info(`Order service running on http://localhost:${port}`));
