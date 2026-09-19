import {
  isPublicRoute,
  loadPublicRoutes,
  publicRoutesFromOpenApi,
  templateToPattern,
} from './public-routes.js';

describe('public routes', () => {
  it('derives exactly the public auth and health operations from the generated OpenAPI document', () => {
    const routes = loadPublicRoutes()
      .map((r) => `${r.method} ${r.template}`)
      .sort();
    expect(routes).toEqual([
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'POST /api/auth/refresh',
    ]);
  });

  it('matches path templates with parameters', () => {
    expect(
      templateToPattern('/api/companies/{companyId}/guidelines').test(
        '/api/companies/abc-1/guidelines',
      ),
    ).toBe(true);
    expect(
      templateToPattern('/api/companies/{companyId}').test('/api/companies/abc/guidelines'),
    ).toBe(false);
    expect(templateToPattern('/api/health').test('/api/health/')).toBe(true);
  });

  it('treats operations without an explicit empty security list as protected', () => {
    const routes = publicRoutesFromOpenApi({
      paths: {
        '/a': { get: { security: [] }, post: {} },
        '/b': { get: { security: [{ bearer: [] }] } },
      },
    });
    expect(isPublicRoute(routes, 'GET', '/a')).toBe(true);
    expect(isPublicRoute(routes, 'POST', '/a')).toBe(false);
    expect(isPublicRoute(routes, 'GET', '/b')).toBe(false);
  });
});
