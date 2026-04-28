// Vercel serverless: POST /api/send-email
// Sender e-post via Resend (https://resend.com)
//
// Krever miljøvariabler i Vercel:
//   RESEND_API_KEY  – API-nøkkel fra resend.com/api-keys
//   RESEND_FROM     – f.eks. "Zewo Kalkulator <noreply@zewo.no>"
//                     (domenet må være verifisert i Resend; ellers bruk
//                      "onboarding@resend.dev" – men da kan du kun
//                      sende til din egen Resend-konto-e-post)

export const config = {
  api: { bodyParser: { sizeLimit: '6mb' } }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  // CORS / metode
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, replyTo, subject, html, text, pdfBase64, pdfFilename } = req.body || {}

  // Validering
  if (!to || !EMAIL_RE.test(String(to))) {
    return res.status(400).json({ error: 'Ugyldig mottaker-e-post' })
  }
  if (!subject || String(subject).length > 200) {
    return res.status(400).json({ error: 'Emne mangler eller er for langt' })
  }
  if (!html && !text) {
    return res.status(400).json({ error: 'Innhold mangler' })
  }
  if (pdfBase64 && pdfBase64.length > 8 * 1024 * 1024) {
    return res.status(400).json({ error: 'PDF for stort vedlegg (>6MB base64)' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'E-posttjeneste er ikke konfigurert (mangler RESEND_API_KEY).' })
  }

  const from = process.env.RESEND_FROM || 'Zewo Kalkulator <onboarding@resend.dev>'

  const body = {
    from,
    to: [String(to)],
    subject: String(subject).slice(0, 200),
    html: html ? String(html) : undefined,
    text: text ? String(text) : undefined
  }

  if (replyTo && EMAIL_RE.test(String(replyTo))) {
    body.reply_to = String(replyTo)
  }

  if (pdfBase64) {
    body.attachments = [{
      filename: (pdfFilename || 'Zewo_Rapport.pdf').slice(0, 120),
      content: String(pdfBase64)
    }]
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const txt = await resp.text()
    let data
    try { data = JSON.parse(txt) } catch { data = { raw: txt } }

    if (!resp.ok) {
      const msg = data?.message || data?.error || data?.raw || 'Ukjent feil fra Resend'
      return res.status(resp.status).json({ error: msg })
    }

    return res.status(200).json({ ok: true, id: data?.id })
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}
