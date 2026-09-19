/**
 * Loads the OpenAPI document generated from the Smithy model and validates the parts we rely on
 * at runtime (public-route derivation). Fails fast at startup if the document is malformed.
 */
import { createRequire } from 'node:module';

import { z } from 'zod';

const operationSchema = z.object({ security: z.array(z.unknown()).optional() }).passthrough();
const documentSchema = z
  .object({ paths: z.record(z.string(), z.record(z.string(), z.unknown())) })
  .passthrough();

export type OpenApiDocument = z.infer<typeof documentSchema>;
export type OpenApiOperation = z.infer<typeof operationSchema>;

const require = createRequire(import.meta.url);

/** Absolute path of the JSON file (Swagger UI serves it from disk). */
export const openApiDocumentPath = require.resolve('@app/openapi/openapi.json');

export function loadOpenApiDocument(): OpenApiDocument {
  return documentSchema.parse(require('@app/openapi/openapi.json'));
}

/** Narrow an entry of `paths[template]` to an operation object (skips non-method keys). */
export function asOperation(value: unknown): OpenApiOperation | undefined {
  const parsed = operationSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
