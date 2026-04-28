<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  kunde: '', epost: '', fartoy: '', kontakt: '',
  nIDag: 15, fIDag: 20, nZewo: 13, fZewo: 18,
  dSBro: 1.5, dABro: 1.5, dFBro: 23,
  sSBro: 2.5, sABro: 2.0, sFBro: 90,
  ds1: 0, da1: 1.5, df1: 5,
  ds2: 3.5, da2: 1.5, df2: 4,
  ss1: 4.6, sa1: 2.0, sf1: 8,
  ss2: 4.8, sa2: 2.0, sf2: 8.2,
  prisPerLiter: 45, vaskPerAr: 52
}

// ─── Refs ────────────────────────────────────────────────────────────────────
const prisPerLiter = ref(DEFAULTS.prisPerLiter)
const vaskPerAr    = ref(DEFAULTS.vaskPerAr)
const kunde   = ref(DEFAULTS.kunde)
const epost   = ref(DEFAULTS.epost)
const fartoy  = ref(DEFAULTS.fartoy)
const kontakt = ref(DEFAULTS.kontakt)
const nIDag = ref(DEFAULTS.nIDag), fIDag = ref(DEFAULTS.fIDag)
const nZewo = ref(DEFAULTS.nZewo), fZewo = ref(DEFAULTS.fZewo)
const dSBro = ref(DEFAULTS.dSBro), dABro = ref(DEFAULTS.dABro), dFBro = ref(DEFAULTS.dFBro)
const sSBro = ref(DEFAULTS.sSBro), sABro = ref(DEFAULTS.sABro), sFBro = ref(DEFAULTS.sFBro)
const ds1 = ref(DEFAULTS.ds1), da1 = ref(DEFAULTS.da1), df1 = ref(DEFAULTS.df1)
const ds2 = ref(DEFAULTS.ds2), da2 = ref(DEFAULTS.da2), df2 = ref(DEFAULTS.df2)
const ss1 = ref(DEFAULTS.ss1), sa1 = ref(DEFAULTS.sa1), sf1 = ref(DEFAULTS.sf1)
const ss2 = ref(DEFAULTS.ss2), sa2 = ref(DEFAULTS.sa2), sf2 = ref(DEFAULTS.sf2)

// ─── Computed ─────────────────────────────────────────────────────────────────
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
  return { d1, d2, s1d, s2d, dl1, dl2, sl1, sl2,
    tdf: df1.value + df2.value, tdl: dl1 + dl2,
    tsf: sf1.value + sf2.value, tsl: sl1 + sl2 }
})

const totSape   = computed(() => Math.abs(bro.value.sdl) + Math.abs(dekk.value.tsl))
const krPerVask = computed(() => totSape.value * prisPerLiter.value)
const krPerAr   = computed(() => krPerVask.value * vaskPerAr.value)

const warnings = computed(() => {
  const w = []
  if (!ds1.value) w.push('Desinfeksjon – Settpunkt 1 er 0 (beregning hoppes over)')
  if (!ds2.value) w.push('Desinfeksjon – Settpunkt 2 er 0 (beregning hoppes over)')
  if (!ss1.value) w.push('Skumsåpe – Settpunkt 1 er 0 (beregning hoppes over)')
  if (!ss2.value) w.push('Skumsåpe – Settpunkt 2 er 0 (beregning hoppes over)')
  return w
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = (v, d = 1) => isFinite(v) ? v.toFixed(d) : '–'
const fp      = v          => isFinite(v) ? (v * 100).toFixed(1) + '%' : '–'
const fmtKr   = v          => isFinite(v) ? Math.round(v).toLocaleString('nb-NO') + ' kr' : '–'
const diffCol = v          => v < 0 ? 'var(--zewo-green)' : v === 0 ? 'var(--zewo-text-dim)' : 'var(--zewo-red-neg)'
const resCol  = v          => v > 0 ? 'var(--zewo-red-neg)' : 'var(--zewo-green)'

// ─── LocalStorage ─────────────────────────────────────────────────────────────
const LS_KEY  = 'zewo-kalkulator-v1'
const LS_REFS = { kunde, epost, fartoy, kontakt, nIDag, fIDag, nZewo, fZewo,
  dSBro, dABro, dFBro, sSBro, sABro, sFBro,
  ds1, da1, df1, ds2, da2, df2, ss1, sa1, sf1, ss2, sa2, sf2,
  prisPerLiter, vaskPerAr }

function saveToLS() {
  const d = {}; Object.entries(LS_REFS).forEach(([k, r]) => { d[k] = r.value })
  localStorage.setItem(LS_KEY, JSON.stringify(d))
}
watch(Object.values(LS_REFS), saveToLS)

function resetAll() {
  if (!confirm('Nullstille alle felt til standardverdier?')) return
  Object.entries(DEFAULTS).forEach(([k, v]) => { if (LS_REFS[k]) LS_REFS[k].value = v })
}

// ─── Desktop navigation ───────────────────────────────────────────────────────
const activeTab = ref('bro')
const slideDir  = ref(1)
const TAB_ORDER = ['bro', 'dekk', 'results']
const TABS = [
  { key: 'bro',     icon: '🚢', label: 'Bro'       },
  { key: 'dekk',    icon: '🦺', label: 'Dekk'      },
  { key: 'results', icon: '📊', label: 'Resultater' }
]
const transitionName = computed(() => slideDir.value > 0 ? 'slide-fwd' : 'slide-bck')

function goTab(key) {
  const i = TAB_ORDER.indexOf(key), j = TAB_ORDER.indexOf(activeTab.value)
  if (i === j) return
  slideDir.value = i > j ? 1 : -1
  activeTab.value = key
}

// ─── Live KPI pulse ───────────────────────────────────────────────────────────
const kpiFlash = ref(false)
watch([totSape, krPerAr], () => {
  kpiFlash.value = false
  nextTick(() => { kpiFlash.value = true; setTimeout(() => kpiFlash.value = false, 350) })
})

// ─── Mount ─────────────────────────────────────────────────────────────────────
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    if (saved) Object.entries(LS_REFS).forEach(([k, r]) => { if (saved[k] !== undefined) r.value = saved[k] })
  } catch {}

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    const i = TAB_ORDER.indexOf(activeTab.value)
    if (e.key === 'ArrowRight' && i < 2) { e.preventDefault(); goTab(TAB_ORDER[i + 1]) }
    if (e.key === 'ArrowLeft'  && i > 0) { e.preventDefault(); goTab(TAB_ORDER[i - 1]) }
  })

  if (activeTab.value === 'results') nextTick(updateChart)
})

// ─── Chart ────────────────────────────────────────────────────────────────────
const chartRef = ref(null)

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

watch([activeTab, totSape, vaskPerAr], ([t]) => {
  if (t === 'results') nextTick(updateChart)
})

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
  const pad  = { top: 36, right: 20, bottom: 38, left: 60 }
  const iw   = cw - pad.left - pad.right
  const ih   = ch - pad.top  - pad.bottom
  const barSlot = iw / M
  const barW    = Math.max(6, barSlot * 0.65)
  const bx  = i => ox + pad.left + barSlot * i + (barSlot - barW) / 2
  const by  = v => oy + pad.top  + ih * (1 - v / topVal)
  const bh  = v => ih * (v / topVal)
  const base    = oy + pad.top + ih

  ctx.fillStyle = '#fff'; ctx.fillRect(ox, oy, cw, ch)

  for (let j = 1; j <= 4; j++) {
    const yg = oy + pad.top + ih * (j / 4)
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(ox + pad.left, yg); ctx.lineTo(ox + pad.left + iw, yg); ctx.stroke()
    ctx.fillStyle = '#aaa'; ctx.font = '9px Arial'; ctx.textAlign = 'right'
    ctx.fillText(fmt(topVal * (1 - j / 4), 0) + ' l', ox + pad.left - 6, yg + 3)
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
  ctx.translate(ox + 10, oy + pad.top + ih / 2); ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = '#888'; ctx.font = '9px Arial'; ctx.textAlign = 'center'
  ctx.fillText('Liter spart (kumulativt)', 0, 0)
  ctx.restore()

  const mndr = ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des']
  ctx.fillStyle = '#aaa'; ctx.font = '9px Arial'; ctx.textAlign = 'center'
  mndr.forEach((mn, i) => ctx.fillText(mn, bx(i) + barW / 2, base + 15))
  ctx.fillText('Måned', ox + pad.left + iw / 2, oy + ch - 2)
  ctx.textAlign = 'left'

  const leg = [{ color: '#C8102E', label: 'Såpe bro' }, { color: '#374151', label: 'Såpe dekk' }]
  leg.forEach((s, si) => {
    const lx = ox + pad.left + si * 100, ly = oy + 18
    ctx.fillStyle = s.color; ctx.fillRect(lx, ly - 9, 11, 9)
    ctx.fillStyle = '#444'; ctx.font = '9px Arial'; ctx.textAlign = 'left'
    ctx.fillText(s.label, lx + 15, ly)
  })
}

// ─── CSV ──────────────────────────────────────────────────────────────────────
const csvOk = ref(false)
function exportCsv() {
  const b = bro.value, d = dekk.value
  const rows = [
    ['Felt','Verdi','Enhet'],
    ['BRO VASKETID'],
    ['Normalvask i dag',nIDag.value,'min'],['Normalvask Zewo',nZewo.value,'min'],['Normalvask reduksjon',b.nrm,'min'],['Normalvask %',(b.nrp*100).toFixed(1),'%'],
    ['Fullskalavask i dag',fIDag.value,'min'],['Fullskalavask Zewo',fZewo.value,'min'],['Fullskalavask reduksjon',b.frm,'min'],
    ['BRO DOSERING'],
    ['Desinf. settpunkt',dSBro.value,'%'],['Desinf. anbefaling',dABro.value,'%'],['Desinf. forbruk',dFBro.value,'l'],['Desinf. diff',fmt(b.ddl),'l'],
    ['Såpe settpunkt',sSBro.value,'%'],['Såpe anbefaling',sABro.value,'%'],['Såpe forbruk',sFBro.value,'l'],['Såpe diff',fmt(b.sdl),'l'],
    ['DEKK'],
    ['Des.1 sett',ds1.value,'%'],['Des.1 anb',da1.value,'%'],['Des.1 forbruk',df1.value,'l'],['Des.1 diff',fmt(d.dl1),'l'],
    ['Des.2 sett',ds2.value,'%'],['Des.2 anb',da2.value,'%'],['Des.2 forbruk',df2.value,'l'],['Des.2 diff',fmt(d.dl2),'l'],
    ['Såpe1 sett',ss1.value,'%'],['Såpe1 anb',sa1.value,'%'],['Såpe1 forbruk',sf1.value,'l'],['Såpe1 diff',fmt(d.sl1),'l'],
    ['Såpe2 sett',ss2.value,'%'],['Såpe2 anb',sa2.value,'%'],['Såpe2 forbruk',sf2.value,'l'],['Såpe2 diff',fmt(d.sl2),'l'],
    ['TOTALER'],
    ['Total såpe spart per vask',fmt(totSape.value),'l'],
    ['Pris per liter',prisPerLiter.value,'kr'],['Vask per år',vaskPerAr.value,''],
    ['Besparelse per vask',fmt(krPerVask.value,0),'kr'],['Besparelse per år',fmt(krPerAr.value,0),'kr'],
  ]
  const csv = '﻿' + rows.map(r => r.join(';')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = 'Zewo_data_' + new Date().toISOString().slice(0, 10) + '.csv'
  a.click(); URL.revokeObjectURL(a.href)
  csvOk.value = true; setTimeout(() => csvOk.value = false, 2500)
}

// ─── Logo loader ──────────────────────────────────────────────────────────────
function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img); img.onerror = () => resolve(null)
    img.src = url
  })
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
const pdfOk = ref(false)

function pdfFileName() {
  const safe = (fartoy.value || 'kalkulasjon').replace(/[^a-zA-Z0-9_À-ɏ\s-]/g, '').replace(/\s+/g, '_').slice(0, 50)
  return 'Zewo_Rapport_' + safe + '_' + new Date().toISOString().slice(0, 10) + '.pdf'
}

async function buildPdfBytes() {
  const W = 595, H = 1020, SC = 2
  const logoImg = await loadImage('https://static.wixstatic.com/media/4acf40_03fd2b0a41244a7ca3e8273a936f2b18~mv2.png/v1/fill/w_460,h_128,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/zewo_smarter_cleaning_red_transparent_pn.png')
  const cv = document.createElement('canvas')
  cv.width = W * SC; cv.height = H * SC
  const c = cv.getContext('2d')
  c.scale(SC, SC)
  c.fillStyle = '#fff'; c.fillRect(0, 0, W, H)
  c.fillStyle = '#000'; c.fillRect(0, 0, W, 78)
  c.fillStyle = '#C8102E'; c.fillRect(0, 75, W, 3)
  if (logoImg) { c.drawImage(logoImg, 26, 12, 130, 36) }
  else { c.fillStyle = '#fff'; c.font = 'bold 22px Arial'; c.fillText('ZEWO CHEMICALS', 26, 36) }
  c.fillStyle = 'rgba(255,255,255,.65)'; c.font = '11px Arial'; c.fillText('Kalkulasjonsrapport – Vaskekjemi & dosering', 26, 56)
  c.fillStyle = 'rgba(255,255,255,.4)';  c.font = '9px Arial';  c.fillText('Generert: ' + new Date().toLocaleDateString('nb-NO'), 26, 70)
  let y = 98, m = 26
  const info = [kunde.value && 'Kunde: ' + kunde.value, fartoy.value && 'Fartøy: ' + fartoy.value, kontakt.value && 'Kontakt: ' + kontakt.value].filter(Boolean)
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
  tb(['Type','I dag','Zewo','Red.','Red.%'],[['Normalvask',nIDag.value+'m',nZewo.value+'m',b.nrm+'m',fp(b.nrp)],['Fullskala',fIDag.value+'m',fZewo.value+'m',b.frm+'m',fp(b.frp)]],[100,70,70,70,70])
  hd('Dosering – Bro')
  tb(['Kategori','Produkt','Sett.','Anb.','Diff%','Forb.','Diff l'],[['Desinf.','VigorOx',dSBro.value+'%',dABro.value+'%',fp(b.ddp),dFBro.value+'l',fmt(b.ddl)+'l'],['Såpe','ZH-13',sSBro.value+'%',sABro.value+'%',fp(b.sdp),sFBro.value+'l',fmt(b.sdl)+'l']],[68,68,52,52,52,52,52])
  hd('Dosering – Dekk')
  tb(['Kategori','Sett.','Anb.','Diff%','Forb.','Diff l'],[['Des.1',ds1.value+'%',da1.value+'%',fp(d.d1),df1.value+'l',fmt(d.dl1)+'l'],['Des.2',ds2.value+'%',da2.value+'%',fp(d.d2),df2.value+'l',fmt(d.dl2)+'l'],['Såpe1',ss1.value+'%',sa1.value+'%',fp(d.s1d),sf1.value+'l',fmt(d.sl1)+'l'],['Såpe2',ss2.value+'%',sa2.value+'%',fp(d.s2d),sf2.value+'l',fmt(d.sl2)+'l']],[70,60,60,60,60,60])
  tb(['','Forbruk','Differanse'],[['Tot.des.',fmt(d.tdf)+'l',fmt(d.tdl)+'l'],['Tot.såpe',fmt(d.tsf)+'l',fmt(d.tsl)+'l']],[110,110,110])
  hd('Samlet besparelse per vask')
  c.fillStyle = '#f0fff4'; c.fillRect(m, y, W - 52, 110)
  c.strokeStyle = '#16a34a'; c.lineWidth = 1; c.strokeRect(m, y, W - 52, 110)
  c.fillStyle = '#1A1A2E'; c.font = '11px Arial'
  c.fillText('Normalvask: ' + fmt(Math.abs(b.nrm), 0) + ' min spart', m + 12, y + 18)
  c.fillText('Fullskala: '  + fmt(Math.abs(b.frm), 0) + ' min spart', m + 12, y + 34)
  c.fillText('Såpe bro: '   + fmt(Math.abs(b.sdl))    + ' l',          m + 12, y + 52)
  c.fillText('Såpe dekk: '  + fmt(Math.abs(d.tsl))    + ' l',          m + 12, y + 68)
  c.font = 'bold 12px Arial'; c.fillStyle = '#16a34a'
  c.fillText('Total såpe spart: ' + fmt(totSape.value) + ' l/vask', m + 12, y + 86)
  c.font = 'bold 13px Arial'; c.fillStyle = '#C8102E'
  c.fillText('Estimert besparelse: ' + Math.round(krPerAr.value).toLocaleString('nb-NO') + ' kr/år  (' + vaskPerAr.value + ' vask × ' + prisPerLiter.value + ' kr/l)', m + 12, y + 106)
  y += 120
  renderChart(c, m, y, W - 52, 185)
  y += 193
  c.fillStyle = '#000'; c.fillRect(0, H - 28, W, 28)
  c.fillStyle = '#C8102E'; c.fillRect(0, H - 31, W, 3)
  c.fillStyle = 'rgba(255,255,255,.65)'; c.font = '8px Arial'
  c.fillText('Zewo Chemicals AS – Smarter Cleaning', m, H - 10)
  c.fillText(new Date().toLocaleString('nb-NO'), W - 130, H - 10)
  return new Promise((resolve, reject) => {
    cv.toBlob(blob => {
      if (!blob) return reject(new Error('Kunne ikke generere bilde'))
      const rd = new FileReader()
      rd.onerror = () => reject(rd.error || new Error('PDF-feil'))
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
        resolve(res)
      }
      rd.readAsArrayBuffer(blob)
    }, 'image/jpeg', 0.92)
  })
}

async function makePdf() {
  try {
    const bytes = await buildPdfBytes()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
    a.download = pdfFileName()
    a.click(); URL.revokeObjectURL(a.href)
    pdfOk.value = true; setTimeout(() => pdfOk.value = false, 2500)
  } catch (e) { alert('Kunne ikke generere PDF: ' + (e.message || e)) }
}

// ─── Direct email send ────────────────────────────────────────────────────────
const sending   = ref(false)
const sentOk    = ref(false)
const sendError = ref('')

function bytesToBase64(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

function buildEmailContent() {
  const b = bro.value, d = dekk.value
  const safeKunde   = sanitizeMailInput(kunde.value)
  const safeFartoy  = sanitizeMailInput(fartoy.value)
  const safeKontakt = sanitizeMailInput(kontakt.value)
  const subject = 'Zewo – Kalkulasjonsresultat' + (safeFartoy ? ' ' + safeFartoy : '')
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))
  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#000;color:#fff;padding:20px 24px;border-bottom:3px solid #C8102E">
    <div style="font-size:20px;font-weight:700">Zewo – Kalkulasjonsresultat</div>
    <div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:4px">Vaskekjemi &amp; dosering – Brønnbåt</div>
  </div>
  <div style="padding:24px;background:#f7f7f7">
    <p style="margin:0 0 12px">Hei${safeKunde ? ' ' + esc(safeKunde) : ''},</p>
    <p style="margin:0 0 16px">Her er kalkulasjon fra Zewo Chemicals${safeFartoy ? ' for <strong>' + esc(safeFartoy) + '</strong>' : ''}.</p>

    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin:16px 0">
      <div style="font-size:11px;font-weight:700;color:#C8102E;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Tidsbesparelse</div>
      <div style="font-size:13px;line-height:1.7">
        Normalvask: <strong>${fmt(Math.abs(b.nrm), 0)} min</strong><br>
        Fullskala: <strong>${fmt(Math.abs(b.frm), 0)} min</strong>
      </div>
    </div>

    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin:16px 0">
      <div style="font-size:11px;font-weight:700;color:#C8102E;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px">Kjemibesparelse per vask</div>
      <div style="font-size:13px;line-height:1.7">
        Såpe bro: <strong>${fmt(Math.abs(b.sdl))} l</strong><br>
        Såpe dekk: <strong>${fmt(Math.abs(d.tsl))} l</strong><br>
        <span style="color:#16A34A;font-weight:700">Total: ${fmt(totSape.value)} l/vask</span>
      </div>
    </div>

    <div style="background:#fff;border:2px solid #C8102E;border-radius:8px;padding:18px;margin:20px 0;text-align:center">
      <div style="font-size:11px;color:#888;letter-spacing:1.5px;text-transform:uppercase">Estimert kostnadsbesparelse</div>
      <div style="font-size:30px;font-weight:700;color:#C8102E;margin:6px 0">≈ ${Math.round(krPerAr.value).toLocaleString('nb-NO')} kr/år</div>
      <div style="font-size:12px;color:#888">Per vask: ≈ ${Math.round(krPerVask.value).toLocaleString('nb-NO')} kr · ${vaskPerAr.value} vask × ${prisPerLiter.value} kr/l</div>
    </div>

    <p style="margin:16px 0 0;font-size:13px;color:#555">Detaljert rapport ligger som vedlegg (PDF).</p>
    <p style="margin:24px 0 0;font-size:13px">Mvh,<br>${safeKontakt ? esc(safeKontakt) + '<br>' : ''}<strong>Zewo Chemicals AS</strong></p>
  </div>
  <div style="padding:14px 24px;background:#000;color:rgba(255,255,255,.4);font-size:10px;text-align:center">
    Generert ${new Date().toLocaleString('nb-NO')} · zewo.no
  </div>
</div>`
  const text =
    'Hei' + (safeKunde ? ' ' + safeKunde : '') + ',\n\n' +
    'Kalkulasjon fra Zewo Chemicals:' + (safeFartoy ? '\nFartøy: ' + safeFartoy : '') + '\n\n' +
    'TIDSBESPARELSE\n• Normalvask: ' + fmt(Math.abs(b.nrm), 0) + ' min\n• Fullskala: ' + fmt(Math.abs(b.frm), 0) + ' min\n\n' +
    'KJEMIBESPARELSE PER VASK\n• Såpe bro: ' + fmt(Math.abs(b.sdl)) + ' l\n• Såpe dekk: ' + fmt(Math.abs(d.tsl)) + ' l\n• Total: ' + fmt(totSape.value) + ' l/vask\n\n' +
    'ESTIMERT KOSTNADSBESPARELSE\n• Per vask: ca. ' + Math.round(krPerVask.value).toLocaleString('nb-NO') + ' kr\n• Per år (' + vaskPerAr.value + ' vask): ca. ' + Math.round(krPerAr.value).toLocaleString('nb-NO') + ' kr\n\n' +
    'Se vedlagt PDF.\n\nMvh,\n' + (safeKontakt ? safeKontakt + '\n' : '') + 'Zewo Chemicals AS'
  return { subject, html, text }
}

async function sendDirectEmail() {
  if (!epost.value || sending.value) return
  sending.value = true
  sendError.value = ''
  try {
    const bytes = await buildPdfBytes()
    const base64 = bytesToBase64(bytes)
    const { subject, html, text } = buildEmailContent()
    const resp = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: epost.value.trim(),
        subject, html, text,
        pdfBase64: base64,
        pdfFilename: pdfFileName()
      })
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) throw new Error(data.error || ('HTTP ' + resp.status))
    sentOk.value = true
    setTimeout(() => { sentOk.value = false; showMail.value = false }, 1800)
  } catch (e) {
    sendError.value = String(e.message || e)
  } finally {
    sending.value = false
  }
}

// ─── Email ────────────────────────────────────────────────────────────────────
const showMail = ref(false)
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
    'TIDSBESPARELSE\n• Normalvask: ' + fmt(Math.abs(b.nrm), 0) + ' min\n• Fullskala: ' + fmt(Math.abs(b.frm), 0) + ' min\n\n' +
    'KJEMIBESPARELSE PER VASK\n• Såpe bro: ' + fmt(Math.abs(b.sdl)) + ' l\n• Såpe dekk: ' + fmt(Math.abs(d.tsl)) + ' l\n• Total: ' + fmt(totSape.value) + ' l/vask\n\n' +
    'ESTIMERT KOSTNADSBESPARELSE\n• Per vask: ca. ' + Math.round(krPerVask.value).toLocaleString('nb-NO') + ' kr\n• Per år (' + vaskPerAr.value + ' vask): ca. ' + Math.round(krPerAr.value).toLocaleString('nb-NO') + ' kr\n\n' +
    'Se vedlagt PDF.\n\nMvh,\n' + (safeKontakt ? safeKontakt + '\n' : '') + 'Zewo Chemicals AS'
  )
  window.open('mailto:' + encodeURIComponent(epost.value) + '?subject=' + subj + '&body=' + body)
  showMail.value = false
}
</script>

<template>
<div class="d-app">

  <!-- ═══ HEADER ════════════════════════════════════════════════════════════ -->
  <header class="d-header">
    <div class="d-header-left">
      <img
        src="https://static.wixstatic.com/media/4acf40_03fd2b0a41244a7ca3e8273a936f2b18~mv2.png/v1/fill/w_460,h_128,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/zewo_smarter_cleaning_red_transparent_pn.png"
        alt="Zewo" class="d-logo"
      />
      <span class="d-badge">Kalkulator</span>
      <span class="d-subhead">Vaskekjemi &amp; dosering – Brønnbåt</span>
    </div>

    <div class="d-header-kpi">
      <div class="d-kpi-pill" :class="{ flash: kpiFlash }">
        <span class="d-kpi-label">Spart per vask</span>
        <span class="d-kpi-val">{{ fmt(totSape) }} l</span>
      </div>
      <div class="d-kpi-sep">→</div>
      <div class="d-kpi-pill d-kpi-pill--red" :class="{ flash: kpiFlash }">
        <span class="d-kpi-label">Estimert per år</span>
        <span class="d-kpi-val">{{ fmtKr(krPerAr) }}</span>
      </div>
    </div>

    <div class="d-header-right">
      <span v-if="fartoy || kunde" class="d-customer-chip">
        {{ [fartoy, kunde].filter(Boolean).join(' · ') }}
      </span>
      <a href="/" class="d-view-link">📱 Mobil</a>
      <button class="d-reset-btn" @click="resetAll">↺ Nullstill</button>
    </div>
  </header>

  <!-- ═══ BODY ══════════════════════════════════════════════════════════════ -->
  <div class="d-body">

    <!-- ─── SIDEBAR ───────────────────────────────────────────────────────── -->
    <aside class="d-sidebar">

      <!-- Navigation -->
      <nav class="d-nav">
        <div class="d-nav-title">Seksjoner</div>
        <button
          v-for="t in TABS" :key="t.key"
          class="d-nav-item" :class="{ active: activeTab === t.key }"
          @click="goTab(t.key)"
        >
          <span class="d-nav-icon">{{ t.icon }}</span>
          <span class="d-nav-label">{{ t.label }}</span>
          <span v-if="t.key === 'dekk' && warnings.length" class="d-nav-warn">{{ warnings.length }}</span>
          <span v-if="activeTab === t.key" class="d-nav-arrow">›</span>
        </button>
      </nav>

      <div class="d-divider"></div>

      <!-- Live KPI -->
      <div class="d-live">
        <div class="d-live-title">Live besparelse</div>
        <div class="d-live-row">
          <span class="d-live-lbl">Såpe bro</span>
          <span class="d-live-val" :style="{ color: bro.sdl < 0 ? 'var(--zewo-green)' : 'var(--zewo-text)' }">{{ fmt(Math.abs(bro.sdl)) }} l</span>
        </div>
        <div class="d-live-row">
          <span class="d-live-lbl">Såpe dekk</span>
          <span class="d-live-val" :style="{ color: dekk.tsl < 0 ? 'var(--zewo-green)' : 'var(--zewo-text)' }">{{ fmt(Math.abs(dekk.tsl)) }} l</span>
        </div>
        <div class="d-live-total">
          <span>Total per vask</span>
          <span class="d-live-total-v">{{ fmt(totSape) }} l</span>
        </div>
        <div class="d-live-kr">
          <span class="d-live-lbl">Per år</span>
          <span class="d-live-kr-v">{{ fmtKr(krPerAr) }}</span>
        </div>
      </div>

      <div class="d-divider"></div>

      <!-- Settings -->
      <div class="d-settings">
        <div class="d-live-title">Innstillinger</div>
        <label class="d-field">
          <span class="d-field-label">Pris per liter</span>
          <div class="d-input-wrap"><input class="d-inp" type="number" step="1" min="0" v-model.number="prisPerLiter"><span class="d-inp-unit">kr</span></div>
        </label>
        <label class="d-field">
          <span class="d-field-label">Vask per år</span>
          <div class="d-input-wrap"><input class="d-inp" type="number" step="1" min="1" v-model.number="vaskPerAr"><span class="d-inp-unit">stk</span></div>
        </label>
      </div>

      <div class="d-flex-grow"></div>
      <div class="d-divider"></div>

      <!-- Actions -->
      <div class="d-actions">
        <button class="d-act pdf" @click="makePdf">{{ pdfOk ? '✅ Lastet ned!' : '📄 Last ned PDF' }}</button>
        <button class="d-act send" @click="showMail = true">✉️ Send til kunde</button>
        <button class="d-act csv" @click="exportCsv">{{ csvOk ? '✅ Eksportert!' : '📊 Eksporter CSV' }}</button>
      </div>

    </aside>

    <!-- ─── MAIN ───────────────────────────────────────────────────────────── -->
    <main class="d-main">

      <!-- Tab bar -->
      <div class="d-tabbar">
        <button
          v-for="t in TABS" :key="t.key"
          class="d-tab" :class="{ active: activeTab === t.key }"
          @click="goTab(t.key)"
        >
          <span class="d-tab-icon">{{ t.icon }}</span>
          {{ t.label }}
        </button>
        <div class="d-tabbar-hint">← → piltaster</div>
      </div>

      <!-- Animated panel -->
      <div class="d-panel-wrap">
        <Transition :name="transitionName" mode="out-in">
          <div :key="activeTab" class="d-panel">

            <!-- ══ BRO ══════════════════════════════════════════════════════ -->
            <template v-if="activeTab === 'bro'">
              <div class="d-2col">

                <!-- Vasketid -->
                <div class="d-col">
                  <h3 class="d-sec">Vasketid</h3>
                  <div class="d-card">
                    <div class="d-card-lbl">Normalvask</div>
                    <div class="d-row2">
                      <label class="d-field"><span class="d-field-label">I dag</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="nIDag"><span class="d-inp-unit">min</span></div></label>
                      <label class="d-field"><span class="d-field-label">Med Zewo</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="nZewo"><span class="d-inp-unit">min</span></div></label>
                    </div>
                    <div class="d-result-row">
                      <span class="d-result-lbl">Reduksjon</span>
                      <span class="d-result-val" :style="{ color: bro.nrm <= 0 ? 'var(--zewo-green)' : 'var(--zewo-red-neg)' }">{{ bro.nrm }} min &nbsp;({{ fp(bro.nrp) }})</span>
                    </div>
                  </div>
                  <div class="d-card">
                    <div class="d-card-lbl">Fullskalavask</div>
                    <div class="d-row2">
                      <label class="d-field"><span class="d-field-label">I dag</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="fIDag"><span class="d-inp-unit">min</span></div></label>
                      <label class="d-field"><span class="d-field-label">Med Zewo</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="fZewo"><span class="d-inp-unit">min</span></div></label>
                    </div>
                    <div class="d-result-row">
                      <span class="d-result-lbl">Reduksjon</span>
                      <span class="d-result-val" :style="{ color: bro.frm <= 0 ? 'var(--zewo-green)' : 'var(--zewo-red-neg)' }">{{ bro.frm }} min &nbsp;({{ fp(bro.frp) }})</span>
                    </div>
                  </div>
                </div>

                <!-- Dosering -->
                <div class="d-col">
                  <h3 class="d-sec">Dosering vaskeanlegg</h3>
                  <div class="d-card">
                    <div class="d-card-lbl">Desinfeksjon – VigorOx</div>
                    <div class="d-row3">
                      <label class="d-field"><span class="d-field-label">Settpunkt</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="dSBro"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Anbefaling</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="dABro"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Forbruk/vask</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="dFBro"><span class="d-inp-unit">l</span></div></label>
                    </div>
                    <div class="d-result-row">
                      <span class="d-result-lbl">Differanse</span>
                      <span class="d-result-val" :style="{ color: diffCol(bro.ddp) }">{{ fp(bro.ddp) }} &nbsp;→&nbsp; {{ fmt(bro.ddl) }} l</span>
                    </div>
                  </div>
                  <div class="d-card">
                    <div class="d-card-lbl">Skumsåpe – Alkaklor ZH-13</div>
                    <div class="d-row3">
                      <label class="d-field"><span class="d-field-label">Settpunkt</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="sSBro"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Anbefaling</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="sABro"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Forbruk/vask</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="sFBro"><span class="d-inp-unit">l</span></div></label>
                    </div>
                    <div class="d-result-row">
                      <span class="d-result-lbl">Differanse</span>
                      <span class="d-result-val" :style="{ color: diffCol(bro.sdp) }">{{ fp(bro.sdp) }} &nbsp;→&nbsp; {{ fmt(bro.sdl) }} l</span>
                    </div>
                  </div>
                </div>

              </div>
            </template>

            <!-- ══ DEKK ═════════════════════════════════════════════════════ -->
            <template v-else-if="activeTab === 'dekk'">
              <div v-if="warnings.length" class="d-warn">
                <span v-for="w in warnings" :key="w" class="d-warn-item">⚠ {{ w }}</span>
              </div>
              <div class="d-2col">

                <!-- Desinfeksjon -->
                <div class="d-col">
                  <h3 class="d-sec">Desinfeksjon – Skumkanoner</h3>
                  <div class="d-card">
                    <div class="d-card-lbl">Måling 1</div>
                    <div class="d-row3">
                      <label class="d-field"><span class="d-field-label">Settpunkt</span><div class="d-input-wrap"><input class="d-inp" :class="{ 'inp-error': !ds1 }" type="number" step="any" v-model.number="ds1"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Anbefaling</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="da1"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Forbruk</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="df1"><span class="d-inp-unit">l</span></div></label>
                    </div>
                    <div class="d-result-row"><span class="d-result-lbl">Diff</span><span class="d-result-val" :style="{ color: diffCol(dekk.d1) }">{{ fp(dekk.d1) }} → {{ fmt(dekk.dl1) }} l</span></div>
                    <div class="d-inner-sep"></div>
                    <div class="d-card-lbl">Måling 2</div>
                    <div class="d-row3">
                      <label class="d-field"><span class="d-field-label">Settpunkt</span><div class="d-input-wrap"><input class="d-inp" :class="{ 'inp-error': !ds2 }" type="number" step="any" v-model.number="ds2"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Anbefaling</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="da2"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Forbruk</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="df2"><span class="d-inp-unit">l</span></div></label>
                    </div>
                    <div class="d-result-row"><span class="d-result-lbl">Diff</span><span class="d-result-val" :style="{ color: diffCol(dekk.d2) }">{{ fp(dekk.d2) }} → {{ fmt(dekk.dl2) }} l</span></div>
                  </div>
                  <div class="d-card d-totals">
                    <div class="d-tot-row"><span>Totalt forbruk desinfeksjon</span><span class="d-tot-v">{{ fmt(dekk.tdf) }} l</span></div>
                    <div class="d-tot-row"><span>Totalt differanse</span><span class="d-tot-v" :style="{ color: dekk.tdl < 0 ? 'var(--zewo-green)' : 'var(--zewo-text)' }">{{ fmt(dekk.tdl) }} l</span></div>
                  </div>
                </div>

                <!-- Skumsåpe -->
                <div class="d-col">
                  <h3 class="d-sec">Skumsåpe – Skumkanoner</h3>
                  <div class="d-card">
                    <div class="d-card-lbl">Måling 1</div>
                    <div class="d-row3">
                      <label class="d-field"><span class="d-field-label">Settpunkt</span><div class="d-input-wrap"><input class="d-inp" :class="{ 'inp-error': !ss1 }" type="number" step="any" v-model.number="ss1"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Anbefaling</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="sa1"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Forbruk</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="sf1"><span class="d-inp-unit">l</span></div></label>
                    </div>
                    <div class="d-result-row"><span class="d-result-lbl">Diff</span><span class="d-result-val" :style="{ color: diffCol(dekk.s1d) }">{{ fp(dekk.s1d) }} → {{ fmt(dekk.sl1) }} l</span></div>
                    <div class="d-inner-sep"></div>
                    <div class="d-card-lbl">Måling 2</div>
                    <div class="d-row3">
                      <label class="d-field"><span class="d-field-label">Settpunkt</span><div class="d-input-wrap"><input class="d-inp" :class="{ 'inp-error': !ss2 }" type="number" step="any" v-model.number="ss2"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Anbefaling</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="sa2"><span class="d-inp-unit">%</span></div></label>
                      <label class="d-field"><span class="d-field-label">Forbruk</span><div class="d-input-wrap"><input class="d-inp" type="number" step="any" v-model.number="sf2"><span class="d-inp-unit">l</span></div></label>
                    </div>
                    <div class="d-result-row"><span class="d-result-lbl">Diff</span><span class="d-result-val" :style="{ color: diffCol(dekk.s2d) }">{{ fp(dekk.s2d) }} → {{ fmt(dekk.sl2) }} l</span></div>
                  </div>
                  <div class="d-card d-totals">
                    <div class="d-tot-row"><span>Totalt forbruk skumsåpe</span><span class="d-tot-v">{{ fmt(dekk.tsf) }} l</span></div>
                    <div class="d-tot-row"><span>Totalt differanse</span><span class="d-tot-v" :style="{ color: dekk.tsl < 0 ? 'var(--zewo-green)' : 'var(--zewo-text)' }">{{ fmt(dekk.tsl) }} l</span></div>
                  </div>
                </div>

              </div>
            </template>

            <!-- ══ RESULTATER ══════════════════════════════════════════════ -->
            <template v-else-if="activeTab === 'results'">

              <!-- Customer + Settings row -->
              <div class="d-res-toprow">
                <div class="d-card d-customer">
                  <div class="d-card-lbl">Kundeinformasjon</div>
                  <div class="d-row2">
                    <label class="d-field"><span class="d-field-label">Kundenavn</span><input class="d-inp d-inp-full" type="text" v-model="kunde" placeholder="Navn"></label>
                    <label class="d-field"><span class="d-field-label">Fartøy</span><input class="d-inp d-inp-full" type="text" v-model="fartoy" placeholder="Fartøynavn"></label>
                  </div>
                  <div class="d-row2">
                    <label class="d-field"><span class="d-field-label">E-post kunde</span><input class="d-inp d-inp-full" type="email" v-model="epost" placeholder="kunde@eksempel.no"></label>
                    <label class="d-field"><span class="d-field-label">Kontaktperson</span><input class="d-inp d-inp-full" type="text" v-model="kontakt" placeholder="Ditt navn"></label>
                  </div>
                </div>
              </div>

              <!-- 4-KPI grid -->
              <div class="d-kpi-grid">
                <div class="d-kpi-card" :style="{ borderTopColor: resCol(bro.nrm) }">
                  <div class="d-kpi-num">{{ fmt(Math.abs(bro.nrm), 0) }}<span class="d-kpi-unit">min</span></div>
                  <div class="d-kpi-name">Normalvask spart</div>
                  <div class="d-kpi-sub">{{ fp(Math.abs(bro.nrp)) }} raskere</div>
                </div>
                <div class="d-kpi-card" :style="{ borderTopColor: resCol(bro.frm) }">
                  <div class="d-kpi-num">{{ fmt(Math.abs(bro.frm), 0) }}<span class="d-kpi-unit">min</span></div>
                  <div class="d-kpi-name">Fullskala spart</div>
                  <div class="d-kpi-sub">{{ fp(Math.abs(bro.frp)) }} raskere</div>
                </div>
                <div class="d-kpi-card" :style="{ borderTopColor: resCol(bro.sdl) }">
                  <div class="d-kpi-num">{{ fmt(Math.abs(bro.sdl)) }}<span class="d-kpi-unit">l</span></div>
                  <div class="d-kpi-name">Såpe bro spart</div>
                  <div class="d-kpi-sub">{{ fp(Math.abs(bro.sdp)) }} reduksjon</div>
                </div>
                <div class="d-kpi-card" :style="{ borderTopColor: resCol(dekk.tsl) }">
                  <div class="d-kpi-num">{{ fmt(Math.abs(dekk.tsl)) }}<span class="d-kpi-unit">l</span></div>
                  <div class="d-kpi-name">Såpe dekk spart</div>
                  <div class="d-kpi-sub">av {{ fmt(dekk.tsf) }} l totalt</div>
                </div>
              </div>

              <!-- Summary + Chart -->
              <div class="d-res-main">
                <div class="d-summary">
                  <div class="d-sec">Samlet per vask</div>
                  <div class="d-sum-row"><span>Tid normalvask</span><span class="d-sum-v">{{ fmt(Math.abs(bro.nrm), 0) }} min</span></div>
                  <div class="d-sum-row"><span>Tid fullskala</span><span class="d-sum-v">{{ fmt(Math.abs(bro.frm), 0) }} min</span></div>
                  <div class="d-sum-sep">
                    <div class="d-sum-row"><span>Såpe bro</span><span class="d-sum-v">{{ fmt(Math.abs(bro.sdl)) }} l</span></div>
                    <div class="d-sum-row"><span>Såpe dekk</span><span class="d-sum-v">{{ fmt(Math.abs(dekk.tsl)) }} l</span></div>
                  </div>
                  <div class="d-sum-total">
                    <span>Total såpe spart</span>
                    <span class="d-sum-total-v">{{ fmt(totSape) }} l</span>
                  </div>
                  <div class="d-sum-kr">
                    <div class="d-sum-kr-row"><span>Per vask</span><span class="d-sum-kr-v">≈ {{ fmtKr(krPerVask) }}</span></div>
                    <div class="d-sum-kr-big">
                      <span>Per år ({{ vaskPerAr }} vask)</span>
                      <span class="d-sum-kr-big-v">≈ {{ fmtKr(krPerAr) }}</span>
                    </div>
                  </div>
                  <div class="d-formulas">
                    <div class="d-fml-title">Formler brukt</div>
                    <div class="d-fml">Diff % = (Anbefaling − Sett.) / Sett.</div>
                    <div class="d-fml">Diff l = Forbruk × Diff %</div>
                    <div class="d-fml">Kr/vask = Total spart × Pris per liter</div>
                    <div class="d-fml">Kr/år = Kr/vask × Antall vask per år</div>
                  </div>
                </div>

                <div class="d-chart-panel">
                  <div class="d-sec">Besparelse over tid</div>
                  <div class="d-chart-wrap">
                    <canvas ref="chartRef" class="d-chart"></canvas>
                  </div>
                </div>
              </div>

            </template>

          </div>
        </Transition>
      </div>
    </main>
  </div>

  <!-- ═══ EMAIL MODAL ════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="showMail" class="d-overlay" @click="!sending && (showMail = false)">
      <div class="d-modal" @click.stop>
        <div class="d-modal-hd">
          <span style="font-size:28px">✉️</span>
          <div>
            <div class="d-modal-title">Send rapport til kunde</div>
            <div class="d-modal-sub">PDF genereres og legges automatisk ved</div>
          </div>
          <button class="d-modal-x" @click="showMail = false" :disabled="sending">✕</button>
        </div>

        <label class="d-field" style="margin-bottom:12px">
          <span class="d-field-label">Mottakeradresse</span>
          <input class="d-inp d-inp-full" type="email" v-model="epost" placeholder="kunde@eksempel.no" :disabled="sending">
        </label>

        <div class="d-modal-preview">
          <div v-if="kunde" class="d-modal-row"><span>Kunde:</span><span>{{ kunde }}</span></div>
          <div v-if="fartoy" class="d-modal-row"><span>Fartøy:</span><span>{{ fartoy }}</span></div>
          <div class="d-modal-row"><span>Såpe spart:</span><span style="color:var(--zewo-green);font-weight:700">{{ fmt(totSape) }} l/vask</span></div>
          <div class="d-modal-total"><span>Kostnadsbesparelse:</span><span style="color:var(--zewo-red);font-weight:700">≈ {{ fmtKr(krPerAr) }}/år</span></div>
        </div>

        <div v-if="sentOk" class="d-modal-ok">✅ Sendt! E-posten ble levert til {{ epost }}.</div>
        <div v-else-if="sendError" class="d-modal-err">⚠ {{ sendError }}</div>
        <div v-else class="d-modal-tip">📎 Detaljert PDF-rapport blir vedlagt automatisk.</div>

        <div class="d-modal-footer">
          <button class="d-m-cancel" @click="sendMail" :disabled="!epost || sending" title="Åpne i e-postklient med mailto">📧 mailto-fallback</button>
          <button class="d-m-confirm" :disabled="!epost || sending" @click="sendDirectEmail">
            <span v-if="sending" class="d-spinner"></span>
            <span v-else-if="sentOk">✅ Sendt</span>
            <span v-else>📤 Send med PDF</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>

</div>
</template>

<style scoped>
/* ─── App shell ────────────────────────────────────────────────────────────── */
.d-app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: var(--zewo-bg); }

/* ─── Header ───────────────────────────────────────────────────────────────── */
.d-header {
  height: 60px; flex-shrink: 0;
  background: var(--zewo-black);
  border-bottom: 3px solid var(--zewo-red);
  display: flex; align-items: center; padding: 0 20px; gap: 16px;
}
.d-header-left { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.d-logo { height: 28px; width: auto; filter: brightness(0) invert(1); }
.d-badge { font-size: 9px; font-weight: 700; color: #fff; background: var(--zewo-red); border-radius: 4px; padding: 3px 8px; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; }
.d-subhead { font-size: 11px; color: rgba(255,255,255,.4); white-space: nowrap; }

.d-header-kpi { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; }
.d-kpi-pill {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
  border-radius: 20px; padding: 5px 16px;
  transition: transform .15s ease;
}
.d-kpi-pill--red { background: rgba(200,16,46,.2); border-color: rgba(200,16,46,.4); }
.d-kpi-pill.flash { animation: kpiPulse .35s ease; }
@keyframes kpiPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
.d-kpi-sep { color: rgba(255,255,255,.25); font-size: 16px; }
.d-kpi-label { font-size: 10px; color: rgba(255,255,255,.5); text-transform: uppercase; letter-spacing: .8px; }
.d-kpi-val { font-size: 15px; font-weight: 700; font-family: var(--mono); color: #fff; }

.d-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.d-customer-chip { font-size: 12px; color: rgba(255,255,255,.65); background: rgba(255,255,255,.1); border-radius: 12px; padding: 4px 12px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.d-view-link { font-size: 11px; color: rgba(255,255,255,.55); text-decoration: none; padding: 5px 10px; border: 1px solid rgba(255,255,255,.15); border-radius: 6px; transition: background .15s; }
.d-view-link:hover { background: rgba(255,255,255,.1); color: #fff; }
.d-reset-btn { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.8); border-radius: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background .15s; white-space: nowrap; }
.d-reset-btn:hover { background: rgba(255,255,255,.2); }

/* ─── Body ─────────────────────────────────────────────────────────────────── */
.d-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }

/* ─── Sidebar ──────────────────────────────────────────────────────────────── */
.d-sidebar {
  width: 228px; flex-shrink: 0;
  background: #fff; border-right: 1px solid var(--zewo-border);
  display: flex; flex-direction: column;
  overflow-y: auto; overflow-x: hidden;
}
.d-flex-grow { flex: 1; }

.d-nav { padding: 16px 12px 8px; }
.d-nav-title { font-size: 9px; font-weight: 700; color: var(--zewo-text-dim); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; padding: 0 4px; }
.d-nav-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 10px; border: none; background: none; border-radius: 8px;
  cursor: pointer; font-size: 13px; font-weight: 600; color: var(--zewo-text-muted);
  transition: all .15s; text-align: left; position: relative;
}
.d-nav-item:hover { background: var(--zewo-bg); color: var(--zewo-text); }
.d-nav-item.active { background: rgba(200,16,46,.06); color: var(--zewo-red); }
.d-nav-icon { font-size: 15px; }
.d-nav-label { flex: 1; }
.d-nav-warn { font-size: 10px; font-weight: 700; background: #F97316; color: #fff; border-radius: 8px; padding: 1px 6px; }
.d-nav-arrow { font-size: 16px; color: var(--zewo-red); opacity: .6; }

.d-divider { height: 1px; background: var(--zewo-border); margin: 6px 12px; }

/* Live KPI sidebar */
.d-live { padding: 12px 14px; }
.d-live-title { font-size: 9px; font-weight: 700; color: var(--zewo-text-dim); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 10px; }
.d-live-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 12px; }
.d-live-lbl { color: var(--zewo-text-muted); }
.d-live-val { font-family: var(--mono); font-weight: 600; font-size: 13px; }
.d-live-total { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--zewo-border); margin-top: 6px; padding-top: 8px; font-size: 12px; font-weight: 700; color: var(--zewo-text); }
.d-live-total-v { font-family: var(--mono); font-size: 15px; font-weight: 700; color: var(--zewo-green); }
.d-live-kr { display: flex; justify-content: space-between; align-items: center; background: rgba(200,16,46,.04); border: 1px solid rgba(200,16,46,.12); border-radius: 8px; padding: 8px 10px; margin-top: 8px; font-size: 11px; }
.d-live-kr-v { font-family: var(--mono); font-size: 14px; font-weight: 700; color: var(--zewo-red); }

/* Sidebar settings */
.d-settings { padding: 10px 14px; }

/* Sidebar actions */
.d-actions { padding: 12px 14px 20px; display: flex; flex-direction: column; gap: 7px; }
.d-act { width: 100%; padding: 10px; border-radius: 8px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity .15s, background .15s; }
.d-act.pdf  { background: var(--zewo-red); color: #fff; }
.d-act.pdf:hover  { opacity: .88; }
.d-act.send { background: var(--zewo-black); color: #fff; }
.d-act.send:hover { opacity: .8; }
.d-act.csv  { background: var(--zewo-bg); color: var(--zewo-text); border: 1px solid var(--zewo-border); }
.d-act.csv:hover  { background: var(--zewo-border); }

/* ─── Main ─────────────────────────────────────────────────────────────────── */
.d-main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

/* Tab bar */
.d-tabbar {
  display: flex; align-items: center; gap: 2px;
  background: #fff; border-bottom: 1px solid var(--zewo-border);
  padding: 0 28px; flex-shrink: 0; height: 48px;
}
.d-tab {
  position: relative; padding: 0 22px; height: 48px;
  border: none; background: none;
  font-size: 13px; font-weight: 600; color: var(--zewo-text-dim);
  cursor: pointer; transition: color .15s;
  display: flex; align-items: center; gap: 6px;
}
.d-tab-icon { font-size: 15px; }
.d-tab:hover:not(.active) { color: var(--zewo-text); }
.d-tab.active { color: var(--zewo-red); }
.d-tab.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--zewo-red); border-radius: 1px 1px 0 0; }
.d-tabbar-hint { margin-left: auto; font-size: 10px; color: var(--zewo-text-dim); opacity: .55; font-style: italic; }

/* Panel container */
.d-panel-wrap { flex: 1; overflow-y: auto; overflow-x: hidden; position: relative; }
.d-panel { padding: 24px 28px 48px; min-height: 100%; }

/* ─── Transitions ──────────────────────────────────────────────────────────── */
.slide-fwd-enter-active, .slide-fwd-leave-active,
.slide-bck-enter-active, .slide-bck-leave-active {
  transition: opacity .2s ease, transform .22s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fwd-enter-from { opacity: 0; transform: translateX(30px); }
.slide-fwd-leave-to   { opacity: 0; transform: translateX(-30px); }
.slide-bck-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-bck-leave-to   { opacity: 0; transform: translateX(30px); }

/* ─── 2-column panel grid ──────────────────────────────────────────────────── */
.d-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
.d-col {}

/* ─── Section heading ──────────────────────────────────────────────────────── */
.d-sec { font-size: 10px; font-weight: 700; color: var(--zewo-red); text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px; }

/* ─── Cards ────────────────────────────────────────────────────────────────── */
.d-card {
  background: #fff; border: 1px solid var(--zewo-border); border-radius: 12px;
  padding: 16px; margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  transition: box-shadow .15s;
}
.d-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.07); }
.d-card-lbl { font-size: 13px; font-weight: 700; color: var(--zewo-text); margin-bottom: 12px; }
.d-totals { background: var(--zewo-bg-alt); }
.d-inner-sep { height: 1px; background: var(--zewo-border); margin: 12px 0; }

/* ─── Grids ────────────────────────────────────────────────────────────────── */
.d-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.d-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }

/* ─── Fields ───────────────────────────────────────────────────────────────── */
.d-field { display: block; margin-bottom: 8px; }
.d-field-label { display: block; font-size: 10px; font-weight: 600; color: var(--zewo-text-dim); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 4px; }
.d-input-wrap { position: relative; }
.d-inp {
  width: 100%; padding: 8px 30px 8px 10px;
  background: var(--zewo-bg-alt); border: 1px solid var(--zewo-border); border-radius: 6px;
  color: var(--zewo-text); font-size: 13px; font-family: var(--mono); font-weight: 500;
  transition: border-color .15s, box-shadow .15s; box-sizing: border-box;
}
.d-inp:focus { outline: none; border-color: var(--zewo-red); box-shadow: 0 0 0 3px rgba(200,16,46,.09); }
.d-inp.inp-error { border-color: var(--zewo-red-neg) !important; background: #fff5f5; }
.d-inp-full { padding-right: 10px; }
.d-inp-unit { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--zewo-text-dim); pointer-events: none; }

/* ─── Result row ───────────────────────────────────────────────────────────── */
.d-result-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding: 7px 10px; background: var(--zewo-bg); border-radius: 6px; border: 1px solid var(--zewo-border); }
.d-result-lbl { font-size: 11px; font-weight: 600; color: var(--zewo-text-dim); }
.d-result-val { font-size: 13px; font-weight: 700; font-family: var(--mono); }

.d-tot-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: var(--zewo-text); }
.d-tot-v { font-weight: 700; font-family: var(--mono); }

/* ─── Validation warnings ──────────────────────────────────────────────────── */
.d-warn { background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 8px; }
.d-warn-item { font-size: 11px; color: #92400E; }

/* ─── Results panel ────────────────────────────────────────────────────────── */
.d-res-toprow { margin-bottom: 20px; }
.d-customer { max-width: 720px; }

.d-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
.d-kpi-card {
  background: #fff; border: 1px solid var(--zewo-border);
  border-top: 3px solid var(--zewo-green); border-radius: 10px;
  padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.04);
  transition: box-shadow .15s, transform .15s;
}
.d-kpi-card:hover { box-shadow: 0 3px 10px rgba(0,0,0,.08); transform: translateY(-1px); }
.d-kpi-num { font-size: 28px; font-weight: 700; font-family: var(--mono); color: var(--zewo-text); line-height: 1.1; }
.d-kpi-unit { font-size: 15px; font-weight: 500; color: var(--zewo-text-muted); margin-left: 3px; }
.d-kpi-name { font-size: 12px; font-weight: 600; color: var(--zewo-text-muted); margin-top: 5px; }
.d-kpi-sub { font-size: 11px; color: var(--zewo-text-dim); margin-top: 2px; }

.d-res-main { display: grid; grid-template-columns: 290px 1fr; gap: 18px; align-items: start; }

/* Summary card */
.d-summary { background: #fff; border: 1px solid var(--zewo-border); border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.d-sum-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: var(--zewo-text-muted); }
.d-sum-v { font-weight: 700; font-family: var(--mono); color: var(--zewo-text); }
.d-sum-sep { border-top: 1px solid var(--zewo-border); margin: 8px 0; padding-top: 8px; }
.d-sum-total { border-top: 2px solid var(--zewo-red); padding-top: 12px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; }
.d-sum-total-v { font-size: 22px; font-weight: 700; font-family: var(--mono); color: var(--zewo-red); }
.d-sum-kr { margin-top: 12px; border-top: 1px solid var(--zewo-border); padding-top: 10px; }
.d-sum-kr-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--zewo-text-muted); padding: 3px 0; }
.d-sum-kr-v { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--zewo-text); }
.d-sum-kr-big { display: flex; justify-content: space-between; align-items: center; background: rgba(200,16,46,.04); border: 1px solid rgba(200,16,46,.1); border-radius: 8px; padding: 9px 12px; margin-top: 6px; font-size: 12px; color: var(--zewo-text-muted); }
.d-sum-kr-big-v { font-size: 18px; font-weight: 700; font-family: var(--mono); color: var(--zewo-red); }
.d-formulas { margin-top: 14px; border-top: 1px solid var(--zewo-border); padding-top: 10px; }
.d-fml-title { font-size: 9px; font-weight: 700; color: var(--zewo-text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.d-fml { font-size: 10px; font-family: var(--mono); color: var(--zewo-red); padding: 1px 0; opacity: .75; }

/* Chart */
.d-chart-panel { background: #fff; border: 1px solid var(--zewo-border); border-radius: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.d-chart-wrap { width: 100%; height: 300px; margin-top: 10px; }
.d-chart { width: 100%; height: 100%; display: block; }

/* ─── Modal ────────────────────────────────────────────────────────────────── */
.d-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn .15s ease; }
.d-modal { background: #fff; border-radius: 16px; padding: 24px; width: 440px; max-width: 92vw; box-shadow: 0 24px 64px rgba(0,0,0,.18); animation: scaleIn .2s cubic-bezier(0.34, 1.46, 0.64, 1); }
.d-modal-hd { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.d-modal-title { font-weight: 700; font-size: 17px; color: var(--zewo-text); }
.d-modal-sub { font-size: 12px; color: var(--zewo-text-muted); }
.d-modal-x { margin-left: auto; background: none; border: none; font-size: 16px; color: var(--zewo-text-dim); cursor: pointer; padding: 6px; border-radius: 6px; transition: background .15s; }
.d-modal-x:hover { background: var(--zewo-bg); }
.d-modal-preview { background: var(--zewo-bg); border: 1px solid var(--zewo-border); border-radius: 10px; padding: 12px; margin-bottom: 12px; }
.d-modal-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
.d-modal-total { border-top: 1px solid var(--zewo-border); margin-top: 6px; padding-top: 6px; display: flex; justify-content: space-between; font-size: 14px; }
.d-modal-tip { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: #92400E; }
.d-modal-footer { display: flex; gap: 10px; }
.d-m-cancel { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--zewo-border); background: none; color: var(--zewo-text-muted); font-size: 13px; font-weight: 600; cursor: pointer; }
.d-m-confirm { flex: 2; padding: 12px; border-radius: 8px; border: none; background: var(--zewo-red); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity .15s; }
.d-m-confirm:hover:not(:disabled) { opacity: .9; }
.d-m-confirm:disabled { background: #ccc; cursor: not-allowed; }

.d-modal-ok  { background: #ECFDF5; border: 1px solid #6EE7B7; color: #065F46; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; font-weight: 600; }
.d-modal-err { background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; font-weight: 500; word-break: break-word; }
.d-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; }
.d-m-confirm:disabled { background: #ccc; cursor: not-allowed; }
.d-m-cancel:disabled  { opacity: .5; cursor: not-allowed; }
.d-modal-x:disabled   { opacity: .3; cursor: not-allowed; }

@keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
@keyframes spin    { to   { transform: rotate(360deg) } }
</style>
