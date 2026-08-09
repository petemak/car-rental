// Deployment-only file — Cloudflare Pages Function. Does not modify any
// application source under src/frontend/*.html or js/.
//
// js/config.js already supports a per-environment override via
// `window.__RR_API_ORIGIN__` (set before config.js loads) instead of
// hardcoding an origin in the file — see the comment block at the top of
// js/config.js. This middleware supplies that value at request time by
// injecting a tiny inline <script> into the <head> of every HTML
// response, reading the real value from a Cloudflare Pages environment
// variable (API_ORIGIN) so it can be changed later from the dashboard
// without a redeploy or any code edit.
//
// Setup required in the Cloudflare Pages dashboard (Settings ->
// Environment variables, for both Production and Preview):
//   API_ORIGIN = https://<your-render-service>.onrender.com
//
// If API_ORIGIN is not set, this middleware does nothing and js/config.js
// falls back to its own default (http://localhost:3000), so local/manual
// testing of the deployed static files isn't broken by this file's
// absence of configuration.

export async function onRequest(context) {
  const { request, next, env } = context;
  const response = await next();

  const apiOrigin = env.API_ORIGIN;
  const contentType = response.headers.get("content-type") || "";
  if (!apiOrigin || !contentType.includes("text/html")) {
    return response;
  }

  class HeadInjector {
    element(element) {
      const safeOrigin = JSON.stringify(apiOrigin);
      element.append(
        `<script>window.__RR_API_ORIGIN__ = ${safeOrigin};</script>`,
        { html: true }
      );
    }
  }

  return new HTMLRewriter().on("head", new HeadInjector()).transform(response);
}
