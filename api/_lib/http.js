// Tiny helpers so API handlers work as plain Node handlers — the same
// files run on Vercel (as serverless functions) and under the Vite dev
// middleware, without depending on Vercel-specific req/res sugar.

export function getQuery(req) {
  const url = new URL(req.url, 'http://local')
  return Object.fromEntries(url.searchParams)
}

export function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}
