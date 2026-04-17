interface PublicRoute {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  exact?: boolean;
}

export const PUBLIC_ROUTES: PublicRoute[] = [
  { method: 'POST', path: '/auth/login', exact: true },
  { method: 'POST', path: '/auth/refresh', exact: true },
  { method: 'POST', path: '/auth/logout', exact: true },
  { method: 'POST', path: '/doctors', exact: true },
  { method: 'GET', path: '/doctors', exact: true },
  { method: 'POST', path: '/patients', exact: true },
];
