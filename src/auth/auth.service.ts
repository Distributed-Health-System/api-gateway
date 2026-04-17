import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  private get tokenUrl() {
    return `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
  }

  private get logoutUrl() {
    return `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`;
  }

  async login(email: string, password: string) {
    const res = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: process.env.KEYCLOAK_CLIENT_ID ?? 'health-system-client',
        username: email,
        password,
      }),
    });

    if (res.status === 401)
      throw new UnauthorizedException('Invalid credentials');
    if (!res.ok)
      throw new InternalServerErrorException('Keycloak login failed');

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async logout(refreshToken: string) {
    const res = await fetch(this.logoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID ?? 'health-system-client',
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok)
      throw new InternalServerErrorException('Keycloak logout failed');
  }
}
