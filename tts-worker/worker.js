export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const url = new URL(request.url)
    const text = url.searchParams.get('text')
    if (!text) {
      return new Response('Missing text param', { status: 400 })
    }

    const encoded = encodeURIComponent(text)
    const speaker = url.searchParams.get('speaker') || 'kyuri'
    const speed = url.searchParams.get('speed') || '0'
    const ttsUrl = `https://dict.naver.com/api/nvoice?service=dictionary&speech_fmt=mp3&text=${encoded}&speaker=${speaker}&speed=${speed}`

    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://dict.naver.com/',
      },
    })

    if (!response.ok) {
      return new Response('TTS fetch failed', {
        status: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=604800',
        'X-TTS-Engine': 'naver',
      },
    })
  },
}
