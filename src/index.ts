import { serve } from '@hono/node-server';
import app from './routes/index.ts';
import { config } from './config.ts';
import { logger } from './utils/logger.ts';
import { requestLogMiddleware } from './middleware/request-log.ts';

// 添加请求日志中间件
app.use('*', requestLogMiddleware);

// 错误处理
app.onError((err, c) => {
  logger.error(`未捕获的错误: ${err.message}`);
  return c.json({ error: '内部服务器错误' }, 500);
});

// 启动服务器
serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    logger.info(`🚀 服务已启动，监听端口 ${info.port}`);
    logger.info(`📋 健康检查: http://localhost:${info.port}/health`);
    logger.info(`🔐 订阅接口: http://localhost:${info.port}/subscription`);
  }
);
