/**
 * Stub for the `server-only` package.
 *
 * The real module throws on import outside a React Server Component, which is
 * exactly what makes it useful in the app — and exactly what stops Vitest from
 * loading a service module directly. Integration tests exercise those services
 * as plain functions, so the marker is aliased away here.
 */
export {};
