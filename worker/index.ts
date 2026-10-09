export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  MAPBOX_TOKEN?: string
  MAPBOX_ACCESS_TOKEN?: string
  VITE_MAPBOX_TOKEN?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/config') {
      if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } })
      }
      const token = (env.MAPBOX_TOKEN || env.MAPBOX_ACCESS_TOKEN || env.VITE_MAPBOX_TOKEN || '').trim()
      // Mapbox GL needs a public token in the browser. Never expose a secret token.
      if (token && !token.startsWith('pk.')) {
        return Response.json({ error: 'Configure a public Mapbox browser token starting with pk.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
      }
      return Response.json({ mapboxToken: token }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    return env.ASSETS.fetch(request)
  },
}
