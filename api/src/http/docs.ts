import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { type FastifyInstance } from 'fastify';

import { loadOpenApiDocument, openApiDocumentPath } from './openapi-document.js';

/** Serves the OpenAPI document generated from the Smithy model, plus Swagger UI. Public. */
export async function registerDocs(app: FastifyInstance) {
  // Static mode reads the JSON file itself, so no OpenAPI typings need to be asserted here.
  await app.register(swagger, {
    mode: 'static',
    specification: { path: openApiDocumentPath, baseDir: '/' },
  });
  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: { docExpansion: 'list', persistAuthorization: true },
  });
  const document = loadOpenApiDocument();
  app.get('/api/openapi.json', () => document);
}
