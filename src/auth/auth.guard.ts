import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import jwksRsa, { JwksClient } from 'jwks-rsa';

@Injectable()
export class AuthGuard implements CanActivate {
  private jwksClient: JwksClient;

  constructor() {
    const keycloakUrl = process.env.KEYCLOAK_URL;
    const realm = process.env.KEYCLOAK_REALM;

    this.jwksClient = jwksRsa({
      jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const decoded = await this.verifyToken(token);
      request['user'] = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }

  private verifyToken(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        return reject(new Error('Invalid token format'));
      }

      this.jwksClient.getSigningKey(decoded.header.kid, (err, key) => {
        if (err ?? !key) return reject(err ?? new Error('Signing key not found'));

        jwt.verify(
          token,
          key!.getPublicKey(),
          { algorithms: ['RS256'] },
          (verifyErr, payload) => {
            if (verifyErr) return reject(verifyErr);
            resolve(payload as JwtPayload);
          },
        );
      });
    });
  }
}
