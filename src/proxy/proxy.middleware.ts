import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { JwtPayload } from 'jsonwebtoken';

interface KeycloakJwtPayload extends JwtPayload {
  realm_access?: { roles: string[] };
}

const ROUTE_MAP: Record<string, string | undefined> = {
  '/patients': process.env.PATIENT_SERVICE_URL,
  '/doctors': process.env.DOCTOR_SERVICE_URL,
  '/appointments': process.env.APPOINTMENT_SERVICE_URL,
  '/telemedicine': process.env.TELEMEDICINE_SERVICE_URL,
  '/notifications': process.env.NOTIFICATION_SERVICE_URL,
};

const APP_ROLES = ['patient', 'doctor', 'admin'];

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProxyMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const matchedPrefix = Object.keys(ROUTE_MAP).find((prefix) =>
      req.path.startsWith(prefix),
    );

    if (!matchedPrefix) {
      return next();
    }

    const target = ROUTE_MAP[matchedPrefix];
    if (!target) {
      this.logger.warn(`No target URL configured for prefix: ${matchedPrefix}`);
      return next();
    }

    const user = req['user'] as KeycloakJwtPayload | undefined;
    if (user) {
      req.headers['x-user-id'] = user.sub;
      req.headers['x-user-role'] =
        user.realm_access?.roles.find((r) => APP_ROLES.includes(r)) ?? '';
    }

    this.logger.log(`Proxying ${req.method} ${req.path} → ${target}`);

    void createProxyMiddleware({
      target,
      changeOrigin: true,
    })(req, res, next);
  }
}
