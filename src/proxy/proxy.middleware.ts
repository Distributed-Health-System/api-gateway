import {
  Injectable,
  NestMiddleware,
  Logger,
  // OnModuleInit,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PUBLIC_ROUTES } from '../auth/public-routes.config';
import { ROUTE_PREFIXES, APP_ROLES } from './route-map.config';
import { ProxyRegistry } from './proxy-registry';
import { TokenVerifier } from './token-verifier';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProxyMiddleware.name);
  private readonly registry = new ProxyRegistry(this.logger);
  private readonly tokenVerifier = new TokenVerifier();

  // export class ProxyMiddleware implements NestMiddleware , OnModuleInit{
  // private readonly logger = new Logger(ProxyMiddleware.name);
  // private readonly registry = new ProxyRegistry(this.logger);
  // private readonly tokenVerifier = new TokenVerifier();

  // onModuleInit() {
  //   this.registry.build();
  // }

  constructor() {
    // CRITICAL FIX: NestJS does not execute lifecycle hooks (like onModuleInit)
    // for Middlewares. We must build the registry synchronously here.
    this.registry.build();
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    this.logger.log(
      `Incoming ${req.method} ${req.originalUrl} from ${clientIp}`,
    );

    const matchedPrefix = Object.keys(ROUTE_PREFIXES).find((prefix) =>
      req.originalUrl.startsWith(prefix),
    );

    if (!matchedPrefix) {
      this.logger.warn(
        `No route match for path: ${req.originalUrl} — passing through`,
      );
      return next();
    }

    const proxy = this.registry.get(matchedPrefix);
    if (!proxy) {
      this.logger.warn(`No proxy instance for prefix: ${matchedPrefix}`);
      return next();
    }

    const urlWithoutQuery = req.originalUrl.split('?')[0];
    const isPublic = PUBLIC_ROUTES.some((r) => {
      if (r.method !== req.method) return false;
      return r.exact
        ? urlWithoutQuery === r.path
        : urlWithoutQuery.startsWith(r.path);
    });

    if (!isPublic) {
      const token = req.cookies?.accessToken as string | undefined;

      if (!token) {
        res.status(401).json({ message: 'Missing access token' });
        return;
      }

      try {
        const user = await this.tokenVerifier.verify(token);
        req.headers['x-user-id'] = user.sub;
        req.headers['x-user-role'] =
          user.realm_access?.roles.find((r) => APP_ROLES.includes(r)) ?? '';
        req.headers['authorization'] = `Bearer ${token}`;
      } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
      }
    }

    req.url = req.originalUrl;

    const target = process.env[ROUTE_PREFIXES[matchedPrefix]];
    this.logger.log(
      `Proxying ${req.method} ${req.originalUrl} → ${target}${req.originalUrl}`,
    );

    void proxy(req, res, next);
  }
}
