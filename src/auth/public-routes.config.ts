interface PublicRoute {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
}

export const PUBLIC_ROUTES: PublicRoute[] = [
  { method: 'POST', path: '/auth/login' },
  { method: 'POST', path: '/auth/logout' },
  { method: 'POST', path: '/doctors' },
  { method: 'GET', path: '/doctors' },
  { method: 'GET', path: '/doctors/integration/availability' },
  { method: 'POST', path: '/patients' },
];
