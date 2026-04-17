import { Logger } from '@nestjs/common';
import { Response } from 'express';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { ROUTE_PREFIXES } from './route-map.config';

export class ProxyRegistry {
  private readonly proxies = new Map<string, RequestHandler>();

  constructor(private readonly logger: Logger) {}

  build(): void {
    for (const [prefix, envKey] of Object.entries(ROUTE_PREFIXES)) {
      const target = process.env[envKey];
      if (target) {
        const logger = this.logger;
        this.proxies.set(
          prefix,
          createProxyMiddleware({
            target,
            changeOrigin: true,
            selfHandleResponse: false,
            ws: false,
            on: {
              proxyReq: (_proxyReq, req) => {
                logger.log(
                  `→ Forwarding ${req.method} ${req.url} to ${target}`,
                );
              },
              proxyRes: (proxyRes, req) => {
                logger.log(
                  `← Response ${proxyRes.statusCode} from ${target}${req.url}`,
                );
              },
              error: (err, req, res) => {
                logger.error(`Proxy error for ${req.url}: ${err.message}`);
                if (!('headersSent' in res) || !(res as Response).headersSent) {
                  (res as Response)
                    .status(502)
                    .json({ message: 'Bad Gateway' });
                }
              },
            },
          }),
        );
        this.logger.log(`Proxy registered: ${prefix} → ${target}`);
      } else {
        this.logger.warn(`No target URL for ${prefix} (${envKey} not set)`);
      }
    }
  }

  get(prefix: string): RequestHandler | undefined {
    return this.proxies.get(prefix);
  }
}
