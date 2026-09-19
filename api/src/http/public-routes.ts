/**
 * Derives the list of operations callable without authentication from the OpenAPI document
 * generated from the Smithy model: an operation with `security: []` (Smithy `@auth([])`) is public.
 * The adapter uses this to reject unauthenticated requests *before* the request body is parsed,
 * so callers cannot probe validation rules without a token.
 */
import { asOperation, loadOpenApiDocument, type OpenApiDocument } from './openapi-document.js';

export interface RouteMatcher {
  method: string;
  template: string;
  pattern: RegExp;
}

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'patch', 'head', 'options']);

export function templateToPattern(template: string): RegExp {
  const escaped = template
    .split('/')
    .map((seg) => (/^\{[^}]+\}$/.test(seg) ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return new RegExp(`^${escaped}/?$`);
}

export function publicRoutesFromOpenApi(doc: OpenApiDocument): RouteMatcher[] {
  const out: RouteMatcher[] = [];
  for (const [template, ops] of Object.entries(doc.paths)) {
    for (const [method, value] of Object.entries(ops)) {
      if (!HTTP_METHODS.has(method)) continue;
      const op = asOperation(value);
      if (op && Array.isArray(op.security) && op.security.length === 0) {
        out.push({ method: method.toUpperCase(), template, pattern: templateToPattern(template) });
      }
    }
  }
  return out;
}

export const loadPublicRoutes = (): RouteMatcher[] =>
  publicRoutesFromOpenApi(loadOpenApiDocument());

export const isPublicRoute = (routes: RouteMatcher[], method: string, path: string) =>
  routes.some((r) => r.method === method.toUpperCase() && r.pattern.test(path));
