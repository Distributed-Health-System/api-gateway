import jwt, { JwtPayload } from 'jsonwebtoken';
import jwksRsa, { JwksClient } from 'jwks-rsa';

export interface KeycloakJwtPayload extends JwtPayload {
  realm_access?: { roles: string[] };
}

export class TokenVerifier {
  private readonly jwksClient: JwksClient;

  constructor() {
    this.jwksClient = jwksRsa({
      jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }

  verify(token: string): Promise<KeycloakJwtPayload> {
    return new Promise((resolve, reject) => {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        return reject(new Error('Invalid token format'));
      }

      this.jwksClient.getSigningKey(decoded.header.kid, (err, key) => {
        if (err ?? !key) return reject(err ?? new Error('Signing key not found'));

        jwt.verify(
          token,
          key.getPublicKey(),
          { algorithms: ['RS256'] },
          (verifyErr, payload) => {
            if (verifyErr) return reject(verifyErr);
            resolve(payload as KeycloakJwtPayload);
          },
        );
      });
    });
  }
}
