import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Proxy plugin: forwards /api/tts?text=한 to Google Translate TTS
// so the browser doesn't get blocked by missing Referer header.
function koTtsProxy() {
  return {
    name: 'ko-tts-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const text = url.searchParams.get('text')
        if (!text) {
          res.writeHead(400)
          res.end('Missing text param')
          return
        }
        try {
          const encoded = encodeURIComponent(text)
          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q=${encoded}`
          const response = await fetch(ttsUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://translate.google.com/',
            },
          })
          if (!response.ok) {
            res.writeHead(response.status)
            res.end('TTS fetch failed')
            return
          }
          res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
          })
          const buffer = await response.arrayBuffer()
          res.end(Buffer.from(buffer))
        } catch (err) {
          res.writeHead(500)
          res.end('Proxy error')
        }
      })
    },
  }
}

export default defineConfig({
  base: '/hangulr/',
  plugins: [react(), tailwindcss(), koTtsProxy()],
})
