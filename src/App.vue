<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

// ── UI-tilstand ───────────────────────────────────────────────────────────────
const tab    = ref('bro')
const pdfOk  = ref(false)
const csvOk  = ref(false)
const showMail = ref(false)

// ── Standardverdier (brukes ved nullstilling) ─────────────────────────────────
const DEFAULTS = {
  kunde: '', epost: '', fartoy: '', kontakt: '',
  nIDag: 15, fIDag: 20, nZewo: 13, fZewo: 18,
  dSBro: 1.5, dABro: 1.5, dFBro: 23,
  sSBro: 2.5, sABro: 2.0, sFBro: 90,
  ds1: 0,   da1: 1.5, df1: 5,
  ds2: 3.5, da2: 1.5, df2: 4,
  ss1: 4.6, sa1: 2.0, sf1: 8,
  ss2: 4.8, sa2: 2.0, sf2: 8.2,
  prisPerLiter: 45,
  vaskPerAr: 52
}

// ── Innstillinger ─────────────────────────────────────────────────────────────
const prisPerLiter = ref(DEFAULTS.prisPerLiter)
const vaskPerAr    = ref(DEFAULTS.vaskPerAr)

// ── Kunde ─────────────────────────────────────────────────────────────────────
const kunde   = ref(DEFAULTS.kunde)
const epost   = ref(DEFAULTS.epost)
const fartoy  = ref(DEFAULTS.fartoy)
const kontakt = ref(DEFAULTS.kontakt)

// ── BRO ───────────────────────────────────────────────────────────────────────
const nIDag = ref(DEFAULTS.nIDag), fIDag = ref(DEFAULTS.fIDag)
const nZewo = ref(DEFAULTS.nZewo), fZewo = ref(DEFAULTS.fZewo)
const dSBro = ref(DEFAULTS.dSBro), dABro = ref(DEFAULTS.dABro), dFBro = ref(DEFAULTS.dFBro)
const sSBro = ref(DEFAULTS.sSBro), sABro = ref(DEFAULTS.sABro), sFBro = ref(DEFAULTS.sFBro)

// ── DEKK ──────────────────────────────────────────────────────────────────────
const ds1 = ref(DEFAULTS.ds1), da1 = ref(DEFAULTS.da1), df1 = ref(DEFAULTS.df1)
const ds2 = ref(DEFAULTS.ds2), da2 = ref(DEFAULTS.da2), df2 = ref(DEFAULTS.df2)
const ss1 = ref(DEFAULTS.ss1), sa1 = ref(DEFAULTS.sa1), sf1 = ref(DEFAULTS.sf1)
const ss2 = ref(DEFAULTS.ss2), sa2 = ref(DEFAULTS.sa2), sf2 = ref(DEFAULTS.sf2)

// ── Beregninger ───────────────────────────────────────────────────────────────
const bro = computed(() => {
  const nrm = nZewo.value - nIDag.value, frm = fZewo.value - fIDag.value
  const nrp = nIDag.value ? 1 - nZewo.value / nIDag.value : 0
  const frp = fIDag.value ? 1 - fZewo.value / fIDag.value : 0
  const ddp = dSBro.value ? (dABro.value - dSBro.value) / dSBro.value : 0
  const sdp = sSBro.value ? (sABro.value - sSBro.value) / sSBro.value : 0
  return { nrm, frm, nrp, frp, ddp, sdp, ddl: dFBro.value * ddp, sdl: sFBro.value * sdp }
})

const dekk = computed(() => {
  const d1  = ds1.value ? (da1.value - ds1.value) / ds1.value : 0
  const d2  = ds2.value ? (da2.value - ds2.value) / ds2.value : 0
  const s1d = ss1.value ? (sa1.value - ss1.value) / ss1.value : 0
  const s2d = ss2.value ? (sa2.value - ss2.value) / ss2.value : 0
  const dl1 = df1.value * d1, dl2 = df2.value * d2
  const sl1 = sf1.value * s1d, sl2 = sf2.value * s2d
  return { d1, d2, s1d, s2d, dl1, dl2, sl1, sl2, tdf: df1.value + df2.value, tdl: dl1 + dl2, tsf: sf1.value + sf2.value, tsl: sl1 + sl2 }
})

const totSape   = computed(() => Math.abs(bro.value.sdl) + Math.abs(dekk.value.tsl))
const krPerVask = computed(() => totSape.value * prisPerLiter.value)
const krPerAr   = computed(() => krPerVask.value * vaskPerAr.value)

// ── Validering ────────────────────────────────────────────────────────────────
const warnings = computed(() => {
  const w = []
  if (!ds1.value) w.push('Desinfeksjon – Settpunkt 1 er 0 (beregning hoppes over)')
  if (!ds2.value) w.push('Desinfeksjon – Settpunkt 2 er 0 (beregning hoppes over)')
  if (!ss1.value) w.push('Skumsåpe – Settpunkt 1 er 0 (beregning hoppes over)')
  if (!ss2.value) w.push('Skumsåpe – Settpunkt 2 er 0 (beregning hoppes over)')
  return w
})

// ── Hjelpere ──────────────────────────────────────────────────────────────────
const fmt     = (v, d = 1) => isFinite(v) ? v.toFixed(d) : '–'
const fp      = (v)        => isFinite(v) ? (v * 100).toFixed(1) + '%' : '–'
const fmtKr   = (v)        => isFinite(v) ? Math.round(v).toLocaleString('nb-NO') + ' kr' : '–'
const diffCol = (v)        => v < 0 ? 'var(--zewo-green)' : v === 0 ? 'var(--zewo-text-dim)' : 'var(--zewo-red-neg)'
const resCol  = (v)        => v > 0 ? 'var(--zewo-red-neg)' : 'var(--zewo-green)'

// ── Nullstilling ──────────────────────────────────────────────────────────────
const LS_REFS = { kunde, epost, fartoy, kontakt, nIDag, fIDag, nZewo, fZewo, dSBro, dABro, dFBro, sSBro, sABro, sFBro, ds1, da1, df1, ds2, da2, df2, ss1, sa1, sf1, ss2, sa2, sf2, prisPerLiter, vaskPerAr }

function resetAll() {
  if (!confirm('Nullstille alle felt til standardverdier?')) return
  Object.entries(DEFAULTS).forEach(([k, v]) => { if (LS_REFS[k]) LS_REFS[k].value = v })
}

// ── localStorage ──────────────────────────────────────────────────────────────
const LS_KEY = 'zewo-kalkulator-v1'

function saveToLS() {
  const data = {}
  Object.entries(LS_REFS).forEach(([k, r]) => { data[k] = r.value })
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

onMounted(() => {
  // Last lagrede verdier
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    if (saved) Object.entries(LS_REFS).forEach(([k, r]) => { if (saved[k] !== undefined) r.value = saved[k] })
  } catch {}

  // Swipe-navigasjon mellom faner
  let tx = 0
  const order = ['bro', 'dekk', 'results']
  const el = document.querySelector('.content')
  el?.addEventListener('touchstart', e => { tx = e.touches[0].clientX }, { passive: true })
  el?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx
    if (Math.abs(dx) < 50) return
    const i = order.indexOf(tab.value)
    if (dx < 0 && i < 2) tab.value = order[i + 1]
    else if (dx > 0 && i > 0) tab.value = order[i - 1]
  }, { passive: true })
})

watch(Object.values(LS_REFS), saveToLS)

// ── CSV-eksport ───────────────────────────────────────────────────────────────
function exportCsv() {
  const b = bro.value, d = dekk.value
  const rows = [
    ['Felt', 'Verdi', 'Enhet'],
    ['BRO VASKETID'],
    ['Normalvask i dag',       nIDag.value,                 'min'],
    ['Normalvask Zewo',        nZewo.value,                 'min'],
    ['Normalvask reduksjon',   b.nrm,                       'min'],
    ['Normalvask reduksjon %', (b.nrp * 100).toFixed(1),    '%'],
    ['Fullskalavask i dag',    fIDag.value,                 'min'],
    ['Fullskalavask Zewo',     fZewo.value,                 'min'],
    ['Fullskalavask reduksjon',b.frm,                       'min'],
    ['BRO DOSERING'],
    ['Desinf. settpunkt',      dSBro.value,  '%'],
    ['Desinf. anbefaling',     dABro.value,  '%'],
    ['Desinf. forbruk',        dFBro.value,  'l'],
    ['Desinf. diff',           fmt(b.ddl),   'l'],
    ['Såpe settpunkt',         sSBro.value,  '%'],
    ['Såpe anbefaling',        sABro.value,  '%'],
    ['Såpe forbruk',           sFBro.value,  'l'],
    ['Såpe diff',              fmt(b.sdl),   'l'],
    ['DEKK'],
    ['Des.1 settpunkt', ds1.value,'%'], ['Des.1 anbefaling', da1.value,'%'], ['Des.1 forbruk', df1.value,'l'], ['Des.1 diff', fmt(d.dl1),'l'],
    ['Des.2 settpunkt', ds2.value,'%'], ['Des.2 anbefaling', da2.value,'%'], ['Des.2 forbruk', df2.value,'l'], ['Des.2 diff', fmt(d.dl2),'l'],
    ['Såpe1 settpunkt', ss1.value,'%'], ['Såpe1 anbefaling', sa1.value,'%'], ['Såpe1 forbruk', sf1.value,'l'], ['Såpe1 diff', fmt(d.sl1),'l'],
    ['Såpe2 settpunkt', ss2.value,'%'], ['Såpe2 anbefaling', sa2.value,'%'], ['Såpe2 forbruk', sf2.value,'l'], ['Såpe2 diff', fmt(d.sl2),'l'],
    ['TOTALER'],
    ['Total såpe spart per vask', fmt(totSape.value),  'l'],
    ['Pris per liter',            prisPerLiter.value,  'kr'],
    ['Vask per år',               vaskPerAr.value,     ''],
    ['Kostnadsbesparelse per vask', fmt(krPerVask.value, 0), 'kr'],
    ['Kostnadsbesparelse per år',   fmt(krPerAr.value,  0), 'kr'],
  ]
  const csv = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = 'Zewo_data_' + new Date().toISOString().slice(0, 10) + '.csv'
  a.click(); URL.revokeObjectURL(a.href)
  csvOk.value = true; setTimeout(() => csvOk.value = false, 2500)
}

// ── Logo-laster (med CORS-fallback) ──────────────────────────────────────────
function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// ── PDF ───────────────────────────────────────────────────────────────────────
async function makePdf() {
  const W = 595, H = 1020, SC = 2
  const logoImg = await loadImage('https://static.wixstatic.com/media/4acf40_03fd2b0a41244a7ca3e8273a936f2b18~mv2.png/v1/fill/w_460,h_128,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/zewo_smarter_cleaning_red_transparent_pn.png')

  const cv = document.createElement('canvas')
  cv.width = W * SC; cv.height = H * SC
  const c = cv.getContext('2d')
  c.scale(SC, SC)
  c.fillStyle = '#fff'; c.fillRect(0, 0, W, H)

  // Header – sort med rød understrek
  c.fillStyle = '#000'; c.fillRect(0, 0, W, 78)
  c.fillStyle = '#C8102E'; c.fillRect(0, 75, W, 3)
  if (logoImg) {
    c.drawImage(logoImg, 26, 12, 130, 36)
  } else {
    c.fillStyle = '#fff'; c.font = 'bold 22px Arial'; c.fillText('ZEWO CHEMICALS', 26, 36)
  }
  c.fillStyle = 'rgba(255,255,255,.65)'; c.font = '11px Arial'; c.fillText('Kalkulasjonsrapport – Vaskekjemi & dosering', 26, 56)
  c.fillStyle = 'rgba(255,255,255,.4)';  c.font = '9px Arial';  c.fillText('Generert: ' + new Date().toLocaleDateString('nb-NO'), 26, 70)

  let y = 98, m = 26
  const info = [
    kunde.value   && 'Kunde: '    + kunde.value,
    fartoy.value  && 'Fartøy: '   + fartoy.value,
    kontakt.value && 'Kontakt: '  + kontakt.value
  ].filter(Boolean)
  if (info.length) {
    c.fillStyle = '#f8f8fa'; c.fillRect(m, y, W - 52, info.length * 16 + 10)
    c.strokeStyle = '#e0e0e0'; c.lineWidth = 0.5; c.strokeRect(m, y, W - 52, info.length * 16 + 10)
    c.fillStyle = '#1A1A2E'; c.font = '11px Arial'
    info.forEach((t, i) => c.fillText(t, m + 8, y + 14 + i * 16))
    y += info.length * 16 + 18
  }

  const hd = t => { y += 6; c.fillStyle = '#C8102E'; c.font = 'bold 13px Arial'; c.fillText(t, m, y); y += 3; c.strokeStyle = '#C8102E'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(m, y); c.lineTo(m + 170, y); c.stroke(); y += 14 }
  const tb = (hs, rs, ws) => {
    const tw = ws.reduce((a, b) => a + b), rh = 19
    c.fillStyle = '#C8102E'; c.fillRect(m, y, tw, rh)
    c.fillStyle = '#fff'; c.font = 'bold 9px Arial'
    let x = m; hs.forEach((h, i) => { c.fillText(h, x + 4, y + 13); x += ws[i] }); y += rh
    rs.forEach((r, ri) => {
      c.fillStyle = ri % 2 ? '#fff' : '#faf8f8'; c.fillRect(m, y, tw, rh)
      c.font = '9px Arial'; let x2 = m
      r.forEach((cl, ci) => { c.fillStyle = String(cl).startsWith('-') ? '#16a34a' : '#333'; c.fillText(String(cl), x2 + 4, y + 13); x2 += ws[ci] })
      y += rh
    })
    c.strokeStyle = '#ddd'; c.lineWidth = .4; c.strokeRect(m, y - (rs.length + 1) * rh, tw, (rs.length + 1) * rh); y += 8
  }

  const b = bro.value, d = dekk.value
  hd('Tidsbesparelse – Bro')
  tb(['Type','I dag','Zewo','Red.','Red.%'], [['Normalvask', nIDag.value+'m', nZewo.value+'m', b.nrm+'m', fp(b.nrp)], ['Fullskala', fIDag.value+'m', fZewo.value+'m', b.frm+'m', fp(b.frp)]], [100,70,70,70,70])
  hd('Dosering – Bro')
  tb(['Kategori','Produkt','Sett.','Anb.','Diff%','Forb.','Diff l'], [['Desinf.','VigorOx',dSBro.value+'%',dABro.value+'%',fp(b.ddp),dFBro.value+'l',fmt(b.ddl)+'l'], ['Såpe','ZH-13',sSBro.value+'%',sABro.value+'%',fp(b.sdp),sFBro.value+'l',fmt(b.sdl)+'l']], [68,68,52,52,52,52,52])
  hd('Dosering – Dekk')
  tb(['Kategori','Sett.','Anb.','Diff%','Forb.','Diff l'], [['Des.1',ds1.value+'%',da1.value+'%',fp(d.d1),df1.value+'l',fmt(d.dl1)+'l'], ['Des.2',ds2.value+'%',da2.value+'%',fp(d.d2),df2.value+'l',fmt(d.dl2)+'l'], ['Såpe1',ss1.value+'%',sa1.value+'%',fp(d.s1d),sf1.value+'l',fmt(d.sl1)+'l'], ['Såpe2',ss2.value+'%',sa2.value+'%',fp(d.s2d),sf2.value+'l',fmt(d.sl2)+'l']], [70,60,60,60,60,60])
  tb(['','Forbruk','Differanse'], [['Tot.des.',fmt(d.tdf)+'l',fmt(d.tdl)+'l'], ['Tot.såpe',fmt(d.tsf)+'l',fmt(d.tsl)+'l']], [110,110,110])

  hd('Samlet besparelse per vask')
  c.fillStyle = '#f0fff4'; c.fillRect(m, y, W - 52, 110)
  c.strokeStyle = '#16a34a'; c.lineWidth = 1; c.strokeRect(m, y, W - 52, 110)
  c.fillStyle = '#1A1A2E'; c.font = '11px Arial'
  c.fillText('Normalvask: '  + fmt(Math.abs(b.nrm), 0) + ' min spart', m + 12, y + 18)
  c.fillText('Fullskala: '   + fmt(Math.abs(b.frm), 0) + ' min spart', m + 12, y + 34)
  c.fillText('Såpe bro: '    + fmt(Math.abs(b.sdl))    + ' l',          m + 12, y + 52)
  c.fillText('Såpe dekk: '   + fmt(Math.abs(d.tsl))    + ' l',          m + 12, y + 68)
  c.font = 'bold 12px Arial'; c.fillStyle = '#16a34a'
  c.fillText('Total såpe spart: ' + fmt(totSape.value) + ' l/vask', m + 12, y + 86)
  c.font = 'bold 13px Arial'; c.fillStyle = '#C8102E'
  c.fillText('Estimert besparelse: ' + Math.round(krPerAr.value).toLocaleString('nb-NO') + ' kr/år  (' + vaskPerAr.value + ' vask × ' + prisPerLiter.value + ' kr/l)', m + 12, y + 106)

  y += 120
  renderChart(c, m, y, W - 52, 185)
  y += 193

  // Bunntekst
  c.fillStyle = '#000'; c.fillRect(0, H - 28, W, 28)
  c.fillStyle = '#C8102E'; c.fillRect(0, H - 31, W, 3)
  c.fillStyle = 'rgba(255,255,255,.65)'; c.font = '8px Arial'
  c.fillText('Zewo Chemicals AS – Smarter Cleaning', m, H - 10)
  c.fillText(new Date().toLocaleString('nb-NO'), W - 130, H - 10)

  cv.toBlob(blob => {
    const rd = new FileReader()
    rd.onload = () => {
      const img = new Uint8Array(rd.result)
      const e = s => new TextEncoder().encode(s), ps = [], os = []
      let p = 0
      const wr = s => { const b = typeof s === 'string' ? e(s) : s; ps.push(b); p += b.length }
      const ob = (n, ct) => { os[n] = p; wr(n + ' 0 obj\n' + ct + '\nendobj\n') }
      wr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')
      ob(1, '<< /Type /Catalog /Pages 2 0 R >>')
      ob(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
      ob(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 4 0 R /Resources << /XObject << /I 5 0 R >> >> >>`)
      const s = `q ${W} 0 0 ${H} 0 0 cm /I Do Q`
      ob(4, '<< /Length ' + s.length + ' >>\nstream\n' + s + '\nendstream')
      os[5] = p
      wr('5 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + cv.width + ' /Height ' + cv.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.length + ' >>\nstream\n')
      wr(img); wr('\nendstream\nendobj\n')
      const xr = p; wr('xref\n0 6\n0000000000 65535 f \n')
      for (let i = 1; i <= 5; i++) wr(String(os[i]).padStart(10, '0') + ' 00000 n \n')
      wr('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF')
      const tot = ps.reduce((a, b) => a + b.length, 0), res = new Uint8Array(tot)
      let off = 0; for (const x of ps) { const u = x instanceof Uint8Array ? x : e(x); res.set(u, off); off += u.length }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([res], { type: 'application/pdf' }))
      const safeName = (fartoy.value || 'kalkulasjon').replace(/[^a-zA-Z0-9_\u00C0-\u024F\s-]/g, '').replace(/\s+/g, '_').slice(0, 50)
      a.download = 'Zewo_Rapport_' + safeName + '_' + new Date().toISOString().slice(0, 10) + '.pdf'
      a.click(); URL.revokeObjectURL(a.href)
      pdfOk.value = true; setTimeout(() => pdfOk.value = false, 2500)
    }
    rd.readAsArrayBuffer(blob)
  }, 'image/jpeg', 0.92)
}

// ── E-post ────────────────────────────────────────────────────────────────────
const sanitizeMailInput = s => s.replace(/[\r\n\t%]/g, '').trim()

function sendMail() {
  const b = bro.value, d = dekk.value
  const safeKunde   = sanitizeMailInput(kunde.value)
  const safeFartoy  = sanitizeMailInput(fartoy.value)
  const safeKontakt = sanitizeMailInput(kontakt.value)
  const subj = encodeURIComponent('Zewo – Kalkulasjonsresultat' + (safeFartoy ? ' ' + safeFartoy : ''))
  const body = encodeURIComponent(
    'Hei' + (safeKunde ? ' ' + safeKunde : '') + ',\n\n' +
    'Kalkulasjon fra Zewo Chemicals:' + (safeFartoy ? '\nFartøy: ' + safeFartoy : '') + '\n\n' +
    'TIDSBESPARELSE\n' +
    '• Normalvask: ' + fmt(Math.abs(b.nrm), 0) + ' min\n' +
    '• Fullskala: '  + fmt(Math.abs(b.frm), 0) + ' min\n\n' +
    'KJEMIBESPARELSE PER VASK\n' +
    '• Såpe bro: '   + fmt(Math.abs(b.sdl)) + ' l\n' +
    '• Såpe dekk: '  + fmt(Math.abs(d.tsl)) + ' l\n' +
    '• Total: '      + fmt(totSape.value)    + ' l/vask\n\n' +
    'ESTIMERT KOSTNADSBESPARELSE\n' +
    '• Per vask: ca. '                                          + Math.round(krPerVask.value).toLocaleString('nb-NO') + ' kr\n' +
    '• Per år (' + vaskPerAr.value + ' vask): ca. ' + Math.round(krPerAr.value).toLocaleString('nb-NO')   + ' kr\n\n' +
    'Se vedlagt PDF.\n\nMvh,\n' + (safeKontakt ? safeKontakt + '\n' : '') + 'Zewo Chemicals AS'
  )
  window.open('mailto:' + encodeURIComponent(epost.value) + '?subject=' + subj + '&body=' + body)
  showMail.value = false
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs = [
  { key: 'bro',     icon: '🚢', label: 'Bro'      },
  { key: 'dekk',    icon: '🦺', label: 'Dekk'     },
  { key: 'results', icon: '📊', label: 'Resultat'  }
]

// ── Graf ──────────────────────────────────────────────────────────────────────
const chartRef = ref(null)

function renderChart(ctx, ox, oy, cw, ch) {
  const M = 12
  const perMnd      = vaskPerAr.value / 12
  const broPerVask  = Math.abs(bro.value.sdl)
  const dekkPerVask = Math.abs(dekk.value.tsl)

  const broData  = Array.from({ length: M }, (_, i) => +((i + 1) * perMnd * broPerVask).toFixed(2))
  const dekkData = Array.from({ length: M }, (_, i) => +((i + 1) * perMnd * dekkPerVask).toFixed(2))
  const totData  = Array.from({ length: M }, (_, i) => +((i + 1) * perMnd * (broPerVask + dekkPerVask)).toFixed(2))

  const maxVal = Math.max(...totData, 1)
  const topVal = Math.ceil(maxVal / 10) * 10

  const pad  = { top: 34, right: 18, bottom: 30, left: 52 }
  const iw   = cw - pad.left - pad.right
  const ih   = ch - pad.top  - pad.bottom

  const barSlot = iw / M
  const barW    = Math.max(3, barSlot * 0.68)
  const bx  = i => ox + pad.left + barSlot * i + (barSlot - barW) / 2
  const by  = v => oy + pad.top  + ih * (1 - v / topVal)
  const bh  = v => ih * (v / topVal)
  const base    = oy + pad.top + ih

  ctx.fillStyle = '#fff'; ctx.fillRect(ox, oy, cw, ch)

  for (let j = 1; j <= 4; j++) {
    const yg = oy + pad.top + ih * (j / 4)
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(ox + pad.left, yg); ctx.lineTo(ox + pad.left + iw, yg); ctx.stroke()
    ctx.fillStyle = '#aaa'; ctx.font = '7px Arial'; ctx.textAlign = 'right'
    ctx.fillText(fmt(topVal * (1 - j / 4), 0) + ' l', ox + pad.left - 4, yg + 3)
  }

  for (let i = 0; i < M; i++) {
    const x = bx(i)
    if (dekkData[i] > 0) { ctx.fillStyle = '#374151'; ctx.fillRect(x, by(totData[i]),  barW, bh(dekkData[i])) }
    if (broData[i]  > 0) { ctx.fillStyle = '#C8102E'; ctx.fillRect(x, by(broData[i]),  barW, bh(broData[i]))  }
  }

  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(ox + pad.left, oy + pad.top); ctx.lineTo(ox + pad.left, base); ctx.lineTo(ox + pad.left + iw, base)
  ctx.stroke()

  ctx.save()
  ctx.translate(ox + 8, oy + pad.top + ih / 2); ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = '#888'; ctx.font = '7px Arial'; ctx.textAlign = 'center'
  ctx.fillText('Liter spart (kumulativt)', 0, 0)
  ctx.restore()

  const mndr = ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des']
  ctx.fillStyle = '#aaa'; ctx.font = '7px Arial'; ctx.textAlign = 'center'
  mndr.forEach((mn, i) => ctx.fillText(mn, bx(i) + barW / 2, base + 12))
  ctx.fillText('Måned', ox + pad.left + iw / 2, oy + ch - 1)
  ctx.textAlign = 'left'

  const leg = [{ color: '#C8102E', label: 'Såpe bro' }, { color: '#374151', label: 'Såpe dekk' }]
  leg.forEach((s, si) => {
    const lx = ox + pad.left + si * 90, ly = oy + 14
    ctx.fillStyle = s.color; ctx.fillRect(lx, ly - 7, 9, 7)
    ctx.fillStyle = '#444'; ctx.font = '7px Arial'; ctx.textAlign = 'left'
    ctx.fillText(s.label, lx + 12, ly)
  })
}

function updateChart() {
  const canvas = chartRef.value
  if (!canvas) return
  const dpr  = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width  = rect.width  * dpr
  canvas.height = rect.height * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  renderChart(ctx, 0, 0, rect.width, rect.height)
}

watch([tab, totSape, vaskPerAr], ([newTab]) => {
  if (newTab === 'results') nextTick(updateChart)
})
</script>

<template>
<div class="app">

  <!-- HEADER -->
  <header class="header">
    <div class="header-inner">
      <img src="https://static.wixstatic.com/media/4acf40_03fd2b0a41244a7ca3e8273a936f2b18~mv2.png/v1/fill/w_180,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/zewo_smarter_cleaning_red_transparent_pn.png" alt="Zewo" class="header-logo" />
      <span class="header-badge">Kalkulator</span>
      <button class="reset-btn" @click="resetAll" title="Nullstill alle felt">↺</button>
    </div>
    <p class="header-sub">Vaskekjemi &amp; dosering – Brønnbåt</p>
  </header>

  <!-- TABS -->
  <nav class="tab-bar">
    <button v-for="t in tabs" :key="t.key" class="tab" :class="{ active: tab === t.key }" @click="tab = t.key">
      <span class="tab-icon">{{ t.icon }}</span>
      <span class="tab-label">{{ t.label }}</span>
    </button>
  </nav>

  <!-- CONTENT -->
  <main class="content">

    <!-- BRO -->
    <template v-if="tab === 'bro'">
      <h3 class="sec-title">Vasketid</h3>
      <div class="card">
        <div class="card-label">Normalvask</div>
        <div class="row">
          <label class="field"><span class="field-label">I dag</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="nIDag"><span class="inp-unit">min</span></div></label>
          <label class="field"><span class="field-label">Zewo</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="nZewo"><span class="inp-unit">min</span></div></label>
        </div>
        <div class="calc-row"><span class="calc-l">Reduksjon:</span><span class="calc-v" :style="{ color: bro.nrm <= 0 ? 'var(--zewo-green)' : 'var(--zewo-red-neg)' }">{{ bro.nrm }} min ({{ fp(bro.nrp) }})</span></div>
      </div>
      <div class="card">
        <div class="card-label">Fullskalavask</div>
        <div class="row">
          <label class="field"><span class="field-label">I dag</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="fIDag"><span class="inp-unit">min</span></div></label>
          <label class="field"><span class="field-label">Zewo</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="fZewo"><span class="inp-unit">min</span></div></label>
        </div>
        <div class="calc-row"><span class="calc-l">Reduksjon:</span><span class="calc-v" :style="{ color: bro.frm <= 0 ? 'var(--zewo-green)' : 'var(--zewo-red-neg)' }">{{ bro.frm }} min ({{ fp(bro.frp) }})</span></div>
      </div>

      <h3 class="sec-title">Dosering vaskeanlegg</h3>
      <div class="card">
        <div class="card-label">Desinfeksjon – VigorOx</div>
        <div class="row">
          <label class="field"><span class="field-label">Settpunkt</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="dSBro"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Anbefaling</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="dABro"><span class="inp-unit">%</span></div></label>
        </div>
        <label class="field"><span class="field-label">Forbruk per vask</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="dFBro"><span class="inp-unit">liter</span></div></label>
        <div class="calc-row"><span class="calc-l">Differanse:</span><span class="calc-v" :style="{ color: diffCol(bro.ddp) }">{{ fp(bro.ddp) }} → {{ fmt(bro.ddl) }} l</span></div>
      </div>
      <div class="card">
        <div class="card-label">Skumsåpe – Alkaklor ZH-13</div>
        <div class="row">
          <label class="field"><span class="field-label">Settpunkt</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="sSBro"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Anbefaling</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="sABro"><span class="inp-unit">%</span></div></label>
        </div>
        <label class="field"><span class="field-label">Forbruk per vask</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="sFBro"><span class="inp-unit">liter</span></div></label>
        <div class="calc-row"><span class="calc-l">Differanse:</span><span class="calc-v" :style="{ color: diffCol(bro.sdp) }">{{ fp(bro.sdp) }} → {{ fmt(bro.sdl) }} l</span></div>
      </div>
    </template>

    <!-- DEKK -->
    <template v-if="tab === 'dekk'">
      <!-- Valideringsadvarsler -->
      <div v-if="warnings.length" class="warn-box">
        <div v-for="w in warnings" :key="w" class="warn-item">⚠ {{ w }}</div>
      </div>

      <h3 class="sec-title">Desinfeksjon – Skumkanoner</h3>
      <div class="card">
        <div class="measure-lbl">Måling 1</div>
        <div class="row3">
          <label class="field"><span class="field-label">Sett.(%)</span><div class="input-wrap"><input class="inp" :class="{ 'inp-error': !ds1 }" type="number" step="any" v-model.number="ds1"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Anb.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="da1"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Forbruk</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="df1"><span class="inp-unit">l</span></div></label>
        </div>
        <div class="calc-row"><span class="calc-l">Diff:</span><span class="calc-v" :style="{ color: diffCol(dekk.d1) }">{{ fp(dekk.d1) }} → {{ fmt(dekk.dl1) }} l</span></div>
        <div class="measure-sep">
          <div class="measure-lbl">Måling 2</div>
          <div class="row3">
            <label class="field"><span class="field-label">Sett.(%)</span><div class="input-wrap"><input class="inp" :class="{ 'inp-error': !ds2 }" type="number" step="any" v-model.number="ds2"><span class="inp-unit">%</span></div></label>
            <label class="field"><span class="field-label">Anb.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="da2"><span class="inp-unit">%</span></div></label>
            <label class="field"><span class="field-label">Forbruk</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="df2"><span class="inp-unit">l</span></div></label>
          </div>
          <div class="calc-row"><span class="calc-l">Diff:</span><span class="calc-v" :style="{ color: diffCol(dekk.d2) }">{{ fp(dekk.d2) }} → {{ fmt(dekk.dl2) }} l</span></div>
        </div>
      </div>

      <h3 class="sec-title">Skumsåpe – Skumkanoner</h3>
      <div class="card">
        <div class="measure-lbl">Måling 1</div>
        <div class="row3">
          <label class="field"><span class="field-label">Sett.(%)</span><div class="input-wrap"><input class="inp" :class="{ 'inp-error': !ss1 }" type="number" step="any" v-model.number="ss1"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Anb.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="sa1"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Forbruk</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="sf1"><span class="inp-unit">l</span></div></label>
        </div>
        <div class="calc-row"><span class="calc-l">Diff:</span><span class="calc-v" :style="{ color: diffCol(dekk.s1d) }">{{ fp(dekk.s1d) }} → {{ fmt(dekk.sl1) }} l</span></div>
        <div class="measure-sep">
          <div class="measure-lbl">Måling 2</div>
          <div class="row3">
            <label class="field"><span class="field-label">Sett.(%)</span><div class="input-wrap"><input class="inp" :class="{ 'inp-error': !ss2 }" type="number" step="any" v-model.number="ss2"><span class="inp-unit">%</span></div></label>
            <label class="field"><span class="field-label">Anb.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="sa2"><span class="inp-unit">%</span></div></label>
            <label class="field"><span class="field-label">Forbruk</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="sf2"><span class="inp-unit">l</span></div></label>
          </div>
          <div class="calc-row"><span class="calc-l">Diff:</span><span class="calc-v" :style="{ color: diffCol(dekk.s2d) }">{{ fp(dekk.s2d) }} → {{ fmt(dekk.sl2) }} l</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Totaler dekk</div>
        <div class="tot-row"><span>Tot. des. forbruk:</span><span class="fw600">{{ fmt(dekk.tdf) }} l</span></div>
        <div class="tot-row"><span>Tot. des. diff:</span><span class="fw600" :style="{ color: dekk.tdl < 0 ? 'var(--zewo-green)' : 'var(--zewo-text)' }">{{ fmt(dekk.tdl) }} l</span></div>
        <div class="sep">
          <div class="tot-row"><span>Tot. såpe forbruk:</span><span class="fw600">{{ fmt(dekk.tsf) }} l</span></div>
          <div class="tot-row"><span>Tot. såpe diff:</span><span class="fw600" :style="{ color: dekk.tsl < 0 ? 'var(--zewo-green)' : 'var(--zewo-text)' }">{{ fmt(dekk.tsl) }} l</span></div>
        </div>
      </div>
    </template>

    <!-- RESULTAT -->
    <template v-if="tab === 'results'">
      <h3 class="sec-title">Kundeinformasjon</h3>
      <div class="card">
        <div class="row">
          <label class="field"><span class="field-label">Kundenavn</span><input class="inp" type="text" v-model="kunde" placeholder="Navn"></label>
          <label class="field"><span class="field-label">Fartøy</span><input class="inp" type="text" v-model="fartoy" placeholder="Fartøynavn"></label>
        </div>
        <div class="row">
          <label class="field"><span class="field-label">E-post kunde</span><input class="inp" type="email" v-model="epost" placeholder="kunde@eksempel.no"></label>
          <label class="field"><span class="field-label">Kontaktperson</span><input class="inp" type="text" v-model="kontakt" placeholder="Ditt navn"></label>
        </div>
      </div>

      <h3 class="sec-title">Innstillinger</h3>
      <div class="card">
        <div class="row">
          <label class="field"><span class="field-label">Pris per liter</span><div class="input-wrap"><input class="inp" type="number" step="1" min="0" v-model.number="prisPerLiter"><span class="inp-unit">kr</span></div></label>
          <label class="field"><span class="field-label">Vask per år</span><div class="input-wrap"><input class="inp" type="number" step="1" min="1" v-model.number="vaskPerAr"><span class="inp-unit">stk</span></div></label>
        </div>
      </div>

      <h3 class="sec-title">Tidsbesparelse (Bro)</h3>
      <div class="res-grid">
        <div class="res-card" :style="{ borderLeftColor: resCol(bro.nrm) }"><div class="res-val">{{ fmt(Math.abs(bro.nrm), 0) }} min</div><div class="res-lbl">Normalvask</div><div class="res-sub">{{ fp(Math.abs(bro.nrp)) }} raskere</div></div>
        <div class="res-card" :style="{ borderLeftColor: resCol(bro.frm) }"><div class="res-val">{{ fmt(Math.abs(bro.frm), 0) }} min</div><div class="res-lbl">Fullskala</div><div class="res-sub">{{ fp(Math.abs(bro.frp)) }} raskere</div></div>
      </div>

      <h3 class="sec-title">Kjemibesparelse</h3>
      <div class="res-grid">
        <div class="res-card" :style="{ borderLeftColor: resCol(bro.ddl) }"><div class="res-val">{{ fmt(Math.abs(bro.ddl)) }} l</div><div class="res-lbl">Desinf. bro</div><div class="res-sub">{{ fp(Math.abs(bro.ddp)) }}</div></div>
        <div class="res-card" :style="{ borderLeftColor: resCol(bro.sdl) }"><div class="res-val">{{ fmt(Math.abs(bro.sdl)) }} l</div><div class="res-lbl">Såpe bro</div><div class="res-sub">{{ fp(Math.abs(bro.sdp)) }}</div></div>
      </div>
      <div class="res-grid">
        <div class="res-card" :style="{ borderLeftColor: resCol(dekk.tdl) }"><div class="res-val">{{ fmt(Math.abs(dekk.tdl)) }} l</div><div class="res-lbl">Des. dekk</div><div class="res-sub">av {{ fmt(dekk.tdf) }} l</div></div>
        <div class="res-card" :style="{ borderLeftColor: resCol(dekk.tsl) }"><div class="res-val">{{ fmt(Math.abs(dekk.tsl)) }} l</div><div class="res-lbl">Såpe dekk</div><div class="res-sub">av {{ fmt(dekk.tsf) }} l</div></div>
      </div>

      <h3 class="sec-title">Samlet per vask</h3>
      <div class="summary">
        <div class="sum-row"><span class="sum-l">Tid normalvask</span><span class="sum-v">{{ fmt(Math.abs(bro.nrm), 0) }} min</span></div>
        <div class="sum-row"><span class="sum-l">Tid fullskala</span><span class="sum-v">{{ fmt(Math.abs(bro.frm), 0) }} min</span></div>
        <div class="sum-sep">
          <div class="sum-row"><span class="sum-l">Såpe bro</span><span class="sum-v">{{ fmt(Math.abs(bro.sdl)) }} l</span></div>
          <div class="sum-row"><span class="sum-l">Såpe dekk</span><span class="sum-v">{{ fmt(Math.abs(dekk.tsl)) }} l</span></div>
        </div>
        <div class="sum-total">
          <span class="sum-total-l">Total såpe spart</span>
          <span class="sum-total-v">{{ fmt(totSape) }} l</span>
        </div>
        <div class="sum-kr">
          <div class="sum-kr-row"><span>Per vask</span><span class="sum-kr-v">≈ {{ fmtKr(krPerVask) }}</span></div>
          <div class="sum-kr-row sum-kr-highlight"><span>Per år ({{ vaskPerAr }} vask)</span><span class="sum-kr-v">≈ {{ fmtKr(krPerAr) }}</span></div>
        </div>
      </div>

      <h3 class="sec-title">Besparelse over tid</h3>
      <div class="chart-card">
        <canvas ref="chartRef" class="chart-canvas"></canvas>
      </div>

      <div class="act-bar">
        <button class="act-btn pdf-btn" @click="makePdf">{{ pdfOk ? '✅ Lastet ned!' : '📄 Last ned PDF' }}</button>
        <button class="act-btn send-btn" @click="showMail = true">✉️ Send til kunde</button>
      </div>
      <div class="act-bar act-bar-2">
        <button class="act-btn csv-btn" @click="exportCsv">{{ csvOk ? '✅ Eksportert!' : '📊 Eksporter CSV' }}</button>
      </div>

      <div class="formulas">
        <div class="formulas-title">Formler brukt</div>
        <div class="fml">Reduksjon min = Zewo − I dag</div>
        <div class="fml">Reduksjon % = 1 − (Zewo / I dag)</div>
        <div class="fml">Diff % = (Anbefaling − Settpunkt) / Settpunkt</div>
        <div class="fml">Diff liter = Forbruk × Diff %</div>
        <div class="fml">Kr/vask = Total såpe spart × Pris per liter</div>
        <div class="fml">Kr/år = Kr/vask × Antall vask per år</div>
      </div>
    </template>
  </main>

  <!-- SEND MODAL -->
  <Teleport to="body">
    <div v-if="showMail" class="overlay" @click="showMail = false">
      <div class="modal" @click.stop>
        <div class="modal-drag"></div>
        <div class="modal-hd">
          <span style="font-size:26px">✉️</span>
          <div><div class="modal-title">Send rapport</div><div class="modal-sub">E-postklienten åpnes med sammendrag</div></div>
        </div>
        <div class="modal-preview">
          <div class="modal-row"><span class="muted">Til:</span><span :style="{ color: epost ? 'var(--zewo-red)' : 'var(--zewo-red-neg)', fontWeight: 500 }">{{ epost || '⚠ Mangler' }}</span></div>
          <div v-if="kunde" class="modal-row"><span class="muted">Kunde:</span><span>{{ kunde }}</span></div>
          <div class="modal-row"><span class="muted">Såpe spart:</span><span class="green fw700">{{ fmt(totSape) }} l/vask</span></div>
          <div class="modal-total-row"><span class="muted">Kostnadsbesparelse:</span><span style="color:var(--zewo-red);font-weight:700">≈ {{ fmtKr(krPerAr) }}/år</span></div>
        </div>
        <div class="modal-tip">💡 Last ned PDF-en først og legg den ved i e-posten.</div>
        <div class="modal-actions">
          <button class="m-cancel" @click="showMail = false">Avbryt</button>
          <button class="m-confirm" :disabled="!epost" @click="sendMail">✉️ Åpne e-post</button>
        </div>
      </div>
    </div>
  </Teleport>
</div>
</template>

<style scoped>
.app { max-width: 480px; margin: 0 auto; min-height: 100vh; background: var(--zewo-bg); padding-bottom: 32px; }

/* Header */
.header { padding: 14px 20px 12px; background: var(--zewo-black); border-bottom: 3px solid var(--zewo-red); }
.header-inner { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.header-logo { height: 34px; width: auto; filter: brightness(0) invert(1); }
.header-badge { font-size: 10px; font-weight: 700; color: #fff; background: var(--zewo-red); border-radius: 4px; padding: 3px 8px; text-transform: uppercase; letter-spacing: .8px; }
.header-sub { font-size: 12px; color: rgba(255,255,255,.55); }
.reset-btn { margin-left: auto; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); color: #fff; border-radius: 6px; padding: 4px 10px; font-size: 16px; cursor: pointer; line-height: 1; transition: background .15s; }
.reset-btn:hover { background: rgba(255,255,255,.2); }

/* Tabs */
.tab-bar { display: flex; background: #fff; border-bottom: 1px solid var(--zewo-border); padding: 0 16px; }
.tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px 8px; background: none; border: none; border-bottom: 3px solid transparent; color: var(--zewo-text-dim); font-size: 11px; font-weight: 600; cursor: pointer; transition: all .2s; }
.tab.active { color: var(--zewo-red); border-bottom-color: var(--zewo-red); }
.tab-icon { font-size: 17px; }

/* Content */
.content { padding: 6px 16px; }
.sec-title { font-size: 11px; font-weight: 700; color: var(--zewo-red); text-transform: uppercase; letter-spacing: 2px; margin: 20px 0 10px; }
.card { background: var(--zewo-surface); border: 1px solid var(--zewo-border); border-radius: var(--radius); padding: 14px 14px 10px; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.card-label { font-size: 14px; font-weight: 600; color: var(--zewo-text); margin-bottom: 10px; }
.row  { display: grid; grid-template-columns: 1fr 1fr;      gap: 10px; }
.row3 { display: grid; grid-template-columns: 1fr 1fr 1fr;  gap: 7px;  }

.field { margin-bottom: 8px; display: block; }
.field-label { display: block; font-size: 10px; font-weight: 600; color: var(--zewo-text-dim); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 3px; }
.input-wrap { position: relative; }
.inp { width: 100%; padding: 9px 32px 9px 10px; background: var(--zewo-bg-alt); border: 1px solid var(--zewo-border); border-radius: var(--radius-sm); color: var(--zewo-text); font-size: 14px; font-family: var(--mono); font-weight: 500; transition: border-color .2s; }
.inp.inp-error { border-color: var(--zewo-red-neg) !important; background: #fff5f5; }
.inp-unit { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--zewo-text-dim); pointer-events: none; }

.calc-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 6px 10px; background: var(--zewo-bg); border-radius: 6px; border: 1px solid var(--zewo-border-light); }
.calc-l { font-size: 11px; color: var(--zewo-text-dim); font-weight: 600; }
.calc-v { font-size: 13px; font-weight: 600; font-family: var(--mono); }

.measure-lbl { font-size: 11px; color: var(--zewo-text-muted); font-weight: 600; margin-bottom: 6px; }
.measure-sep { border-top: 1px solid var(--zewo-border); padding-top: 10px; margin-top: 10px; }
.tot-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; color: var(--zewo-text); }
.fw600 { font-weight: 600; }
.fw700 { font-weight: 700; }
.sep { border-top: 1px solid var(--zewo-border); margin-top: 4px; padding-top: 4px; }

/* Valideringsadvarsler */
.warn-box { background: #FFF7ED; border: 1px solid #FDBA74; border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 10px; }
.warn-item { font-size: 11px; color: #92400E; padding: 2px 0; }

/* Resultatkort */
.res-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
.res-card { background: var(--zewo-surface); border: 1px solid var(--zewo-border); border-radius: 12px; padding: 12px; border-left: 3px solid var(--zewo-green); box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.res-val { font-size: 21px; font-weight: 700; font-family: var(--mono); color: var(--zewo-text); }
.res-lbl { font-size: 11px; font-weight: 600; color: var(--zewo-text-muted); }
.res-sub { font-size: 10px; color: var(--zewo-text-dim); margin-top: 1px; }

/* Sammendrag */
.summary { background: var(--zewo-surface); border: 1px solid var(--zewo-border); border-radius: 14px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.sum-row { display: flex; justify-content: space-between; padding: 4px 0; }
.sum-l { font-size: 13px; color: var(--zewo-text-muted); }
.sum-v { font-size: 15px; font-weight: 700; font-family: var(--mono); color: var(--zewo-text); }
.sum-sep { border-top: 1px solid var(--zewo-border); margin: 6px 0; padding-top: 6px; }
.sum-total { border-top: 2px solid var(--zewo-red); padding-top: 10px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; }
.sum-total-l { font-size: 15px; font-weight: 700; color: var(--zewo-text); }
.sum-total-v { font-size: 22px; font-weight: 700; font-family: var(--mono); color: var(--zewo-red); }
.sum-kr { margin-top: 12px; border-top: 1px solid var(--zewo-border); padding-top: 10px; display: flex; flex-direction: column; gap: 4px; }
.sum-kr-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--zewo-text-muted); }
.sum-kr-highlight { background: rgba(200,16,46,.04); border-radius: 6px; padding: 6px 8px; margin-top: 2px; }
.sum-kr-v { font-size: 16px; font-weight: 700; font-family: var(--mono); color: var(--zewo-red); }

/* Knapper */
.act-bar { display: flex; gap: 10px; margin-bottom: 8px; }
.act-bar-2 { margin-bottom: 16px; }
.act-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 8px; border-radius: 30px; border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .15s, opacity .15s; }
.pdf-btn  { background: var(--zewo-red);   color: #fff; }
.pdf-btn:hover  { background: var(--zewo-red-dark); }
.send-btn { background: var(--zewo-black); color: #fff; }
.send-btn:hover { opacity: .85; }
.csv-btn  { background: var(--zewo-bg-alt); color: var(--zewo-text); border: 1px solid var(--zewo-border); }
.csv-btn:hover  { background: var(--zewo-border); }

/* Graf */
.chart-card { background: var(--zewo-surface); border: 1px solid var(--zewo-border); border-radius: var(--radius); padding: 12px 10px 8px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow: hidden; }
.chart-canvas { width: 100%; height: 220px; display: block; }

/* Formler */
.formulas { background: var(--zewo-surface); border: 1px solid var(--zewo-border); border-radius: 12px; padding: 14px; }
.formulas-title { font-size: 10px; font-weight: 700; color: var(--zewo-text-dim); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; }
.fml { font-size: 11px; font-family: var(--mono); color: var(--zewo-red); padding: 2px 0; opacity: .8; }

.muted { color: var(--zewo-text-muted); }
.green { color: var(--zewo-green); }

/* Modal */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; animation: fadeIn .15s; }
.modal { width: 100%; max-width: 480px; background: var(--zewo-surface); border: 1px solid var(--zewo-border); border-radius: 22px 22px 0 0; padding: 12px 20px 24px; animation: slideUp .25s; box-shadow: 0 -4px 24px rgba(0,0,0,.12); }
.modal-drag { width: 36px; height: 4px; border-radius: 2px; background: var(--zewo-border); margin: 0 auto 16px; }
.modal-hd { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.modal-title { font-weight: 700; font-size: 17px; color: var(--zewo-text); }
.modal-sub { font-size: 12px; color: var(--zewo-text-muted); }
.modal-preview { background: var(--zewo-bg); border: 1px solid var(--zewo-border); border-radius: 12px; padding: 12px; margin-bottom: 12px; }
.modal-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; color: var(--zewo-text); }
.modal-total-row { border-top: 1px solid var(--zewo-border); margin-top: 6px; padding-top: 6px; display: flex; justify-content: space-between; font-size: 14px; }
.modal-tip { display: flex; align-items: center; gap: 10px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: #92400E; }
.modal-actions { display: flex; gap: 10px; }
.m-cancel  { flex: 1; padding: 13px; border-radius: 30px; border: 1px solid var(--zewo-border); background: none; color: var(--zewo-text-muted); font-size: 14px; font-weight: 600; cursor: pointer; }
.m-confirm { flex: 2; padding: 13px; border-radius: 30px; border: none; background: var(--zewo-red); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; }
.m-confirm:disabled { background: #ccc; opacity: .6; cursor: default; }
</style>
