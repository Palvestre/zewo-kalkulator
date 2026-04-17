<script setup>
import { ref, computed } from 'vue'

const tab = ref('bro')
const pdfOk = ref(false)
const showMail = ref(false)

// Kunde
const kunde = ref('')
const epost = ref('')
const fartoy = ref('')
const kontakt = ref('')

// BRO - Vasketid
const nIDag = ref(15), fIDag = ref(20), nZewo = ref(13), fZewo = ref(18)

// BRO - Dosering
const dSBro = ref(1.5), dABro = ref(1.5), dFBro = ref(23)
const sSBro = ref(2.5), sABro = ref(2.0), sFBro = ref(90)

// DEKK
const ds1 = ref(0), da1 = ref(1.5), df1 = ref(5)
const ds2 = ref(3.5), da2 = ref(1.5), df2 = ref(4)
const ss1 = ref(4.6), sa1 = ref(2.0), sf1 = ref(8)
const ss2 = ref(4.8), sa2 = ref(2.0), sf2 = ref(8.2)

// Formler fra Excel
const bro = computed(() => {
  const nrm = nZewo.value - nIDag.value, frm = fZewo.value - fIDag.value
  const nrp = nIDag.value ? 1 - nZewo.value / nIDag.value : 0
  const frp = fIDag.value ? 1 - fZewo.value / fIDag.value : 0
  const ddp = dSBro.value ? (dABro.value - dSBro.value) / dSBro.value : 0
  const sdp = sSBro.value ? (sABro.value - sSBro.value) / sSBro.value : 0
  return { nrm, frm, nrp, frp, ddp, sdp, ddl: dFBro.value * ddp, sdl: sFBro.value * sdp }
})

const dekk = computed(() => {
  const d1 = ds1.value ? (da1.value - ds1.value) / ds1.value : 0
  const d2 = ds2.value ? (da2.value - ds2.value) / ds2.value : 0
  const s1d = ss1.value ? (sa1.value - ss1.value) / ss1.value : 0
  const s2d = ss2.value ? (sa2.value - ss2.value) / ss2.value : 0
  const dl1 = df1.value * d1, dl2 = df2.value * d2
  const sl1 = sf1.value * s1d, sl2 = sf2.value * s2d
  return { d1, d2, s1d, s2d, dl1, dl2, sl1, sl2, tdf: df1.value + df2.value, tdl: dl1 + dl2, tsf: sf1.value + sf2.value, tsl: sl1 + sl2 }
})

const totSape = computed(() => Math.abs(bro.value.sdl) + Math.abs(dekk.value.tsl))
const fmt = (v, d = 1) => isFinite(v) ? v.toFixed(d) : '–'
const fp = (v) => isFinite(v) ? (v * 100).toFixed(1) + '%' : '–'
const diffCol = (v) => v < 0 ? 'var(--zewo-green)' : v === 0 ? 'var(--zewo-text-dim)' : 'var(--zewo-red-neg)'
const resCol = (v) => v > 0 ? 'var(--zewo-red-neg)' : 'var(--zewo-green)'

// PDF Generation
function makePdf() {
  const W = 595, H = 842, SC = 2
  const cv = document.createElement('canvas')
  cv.width = W * SC; cv.height = H * SC
  const c = cv.getContext('2d')
  c.scale(SC, SC)
  c.fillStyle = '#fff'; c.fillRect(0, 0, W, H)
  // Header
  c.fillStyle = '#C8102E'; c.fillRect(0, 0, W, 78)
  c.fillStyle = '#fff'; c.font = 'bold 24px Arial'; c.fillText('ZEWO CHEMICALS', 26, 34)
  c.font = '13px Arial'; c.fillText('Kalkulasjonsrapport – Vaskekjemi & dosering', 26, 54)
  c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '10px Arial'; c.fillText('Generert: ' + new Date().toLocaleDateString('nb-NO'), 26, 70)
  c.fillStyle = '#1A1A2E'; c.fillRect(0, 78, W, 3)

  let y = 102, m = 26
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
  tb(['Type','I dag','Zewo','Red.','Red.%'], [['Normalvask', nIDag.value+'m', nZewo.value+'m', b.nrm+'m', fp(b.nrp)], ['Fullskala', fIDag.value+'m', fZewo.value+'m', b.frm+'m', fp(b.frp)]], [100,70,70,70,70])
  hd('Dosering – Bro')
  tb(['Kategori','Produkt','Sett.','Anb.','Diff%','Forb.','Diff l'], [['Desinf.','VigorOx',dSBro.value+'%',dABro.value+'%',fp(b.ddp),dFBro.value+'l',fmt(b.ddl)+'l'], ['Såpe','ZH-13',sSBro.value+'%',sABro.value+'%',fp(b.sdp),sFBro.value+'l',fmt(b.sdl)+'l']], [68,68,52,52,52,52,52])
  hd('Dosering – Dekk')
  tb(['Kategori','Sett.','Anb.','Diff%','Forb.','Diff l'], [['Des.1',ds1.value+'%',da1.value+'%',fp(d.d1),df1.value+'l',fmt(d.dl1)+'l'], ['Des.2',ds2.value+'%',da2.value+'%',fp(d.d2),df2.value+'l',fmt(d.dl2)+'l'], ['Såpe1',ss1.value+'%',sa1.value+'%',fp(d.s1d),sf1.value+'l',fmt(d.sl1)+'l'], ['Såpe2',ss2.value+'%',sa2.value+'%',fp(d.s2d),sf2.value+'l',fmt(d.sl2)+'l']], [70,60,60,60,60,60])
  tb(['','Forbruk','Differanse'], [['Tot.des.',fmt(d.tdf)+'l',fmt(d.tdl)+'l'], ['Tot.såpe',fmt(d.tsf)+'l',fmt(d.tsl)+'l']], [110,110,110])
  hd('Samlet besparelse per vask')
  c.fillStyle = '#f0fff4'; c.fillRect(m, y, W - 52, 88)
  c.strokeStyle = '#16a34a'; c.lineWidth = 1; c.strokeRect(m, y, W - 52, 88)
  c.fillStyle = '#1A1A2E'; c.font = '11px Arial'
  c.fillText('Normalvask: '+fmt(Math.abs(b.nrm),0)+' min spart', m+12, y+18)
  c.fillText('Fullskala: '+fmt(Math.abs(b.frm),0)+' min spart', m+12, y+34)
  c.fillText('Såpe bro: '+fmt(Math.abs(b.sdl))+' l', m+12, y+52)
  c.fillText('Såpe dekk: '+fmt(Math.abs(d.tsl))+' l', m+12, y+68)
  c.font = 'bold 13px Arial'; c.fillStyle = '#16a34a'
  c.fillText('Total såpe spart: '+fmt(totSape.value)+' liter', m+12, y+84)
  c.fillStyle = '#C8102E'; c.fillRect(0, H-28, W, 28)
  c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '8px Arial'
  c.fillText('Zewo Chemicals AS – Smarter Cleaning', m, H-10)
  c.fillText(new Date().toLocaleString('nb-NO'), W - 130, H-10)

  cv.toBlob(blob => {
    const rd = new FileReader()
    rd.onload = () => {
      const img = new Uint8Array(rd.result)
      const e = s => new TextEncoder().encode(s), ps = [], os = []
      let p = 0
      const wr = s => { const b = typeof s === 'string' ? e(s) : s; ps.push(b); p += b.length }
      const ob = (n, ct) => { os[n] = p; wr(n + ' 0 obj\n' + ct + '\nendobj\n') }
      wr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')
      ob(1,'<< /Type /Catalog /Pages 2 0 R >>'); ob(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
      ob(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /XObject << /I 5 0 R >> >> >>')
      const s = 'q 595 0 0 842 0 0 cm /I Do Q'
      ob(4,'<< /Length '+s.length+' >>\nstream\n'+s+'\nendstream')
      os[5] = p
      wr('5 0 obj\n<< /Type /XObject /Subtype /Image /Width '+cv.width+' /Height '+cv.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+img.length+' >>\nstream\n')
      wr(img); wr('\nendstream\nendobj\n')
      const xr = p; wr('xref\n0 6\n0000000000 65535 f \n')
      for (let i = 1; i <= 5; i++) wr(String(os[i]).padStart(10,'0')+' 00000 n \n')
      wr('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF')
      const tot = ps.reduce((a, b) => a + b.length, 0), res = new Uint8Array(tot)
      let off = 0; for (const x of ps) { const u = x instanceof Uint8Array ? x : e(x); res.set(u, off); off += u.length }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([res], { type: 'application/pdf' }))
      a.download = 'Zewo_Rapport_' + (fartoy.value || 'kalkulasjon').replace(/\s+/g,'_') + '_' + new Date().toISOString().slice(0,10) + '.pdf'
      a.click(); URL.revokeObjectURL(a.href)
      pdfOk.value = true; setTimeout(() => pdfOk.value = false, 2500)
    }
    rd.readAsArrayBuffer(blob)
  }, 'image/jpeg', 0.92)
}

function sendMail() {
  const b = bro.value, d = dekk.value
  const subj = encodeURIComponent('Zewo – Kalkulasjonsresultat' + (fartoy.value ? ' ' + fartoy.value : ''))
  const body = encodeURIComponent('Hei' + (kunde.value ? ' ' + kunde.value : '') + ',\n\nKalkulasjon fra Zewo Chemicals:' + (fartoy.value ? '\nFartøy: ' + fartoy.value : '') + '\n\nTIDSBESPARELSE\n• Normalvask: ' + fmt(Math.abs(b.nrm),0) + ' min\n• Fullskala: ' + fmt(Math.abs(b.frm),0) + ' min\n\nKJEMIBESPARELSE\n• Såpe bro: ' + fmt(Math.abs(b.sdl)) + ' l\n• Såpe dekk: ' + fmt(Math.abs(d.tsl)) + ' l\n\nTOTAL SÅPE SPART: ' + fmt(totSape.value) + ' l/vask\n\nSe vedlagt PDF.\n\nMvh,\n' + (kontakt.value ? kontakt.value + '\n' : '') + 'Zewo Chemicals AS')
  window.open('mailto:' + epost.value + '?subject=' + subj + '&body=' + body)
  showMail.value = false
}

const tabs = [
  { key: 'bro', icon: '🚢', label: 'Bro' },
  { key: 'dekk', icon: '🦺', label: 'Dekk' },
  { key: 'results', icon: '📊', label: 'Resultat' }
]
</script>

<template>
<div class="app">
  <!-- HEADER -->
  <header class="header">
    <div class="header-inner">
      <img src="https://static.wixstatic.com/media/4acf40_03fd2b0a41244a7ca3e8273a936f2b18~mv2.png/v1/fill/w_180,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/zewo_smarter_cleaning_red_transparent_pn.png" alt="Zewo" class="header-logo" />
      <span class="header-badge">Kalkulator</span>
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
      <h3 class="sec-title">Desinfeksjon – Skumkanoner</h3>
      <div class="card">
        <div class="measure-lbl">Måling 1</div>
        <div class="row3">
          <label class="field"><span class="field-label">Sett.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="ds1"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Anb.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="da1"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Forbruk</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="df1"><span class="inp-unit">l</span></div></label>
        </div>
        <div class="calc-row"><span class="calc-l">Diff:</span><span class="calc-v" :style="{ color: diffCol(dekk.d1) }">{{ fp(dekk.d1) }} → {{ fmt(dekk.dl1) }} l</span></div>
        <div class="measure-sep">
          <div class="measure-lbl">Måling 2</div>
          <div class="row3">
            <label class="field"><span class="field-label">Sett.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="ds2"><span class="inp-unit">%</span></div></label>
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
          <label class="field"><span class="field-label">Sett.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="ss1"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Anb.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="sa1"><span class="inp-unit">%</span></div></label>
          <label class="field"><span class="field-label">Forbruk</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="sf1"><span class="inp-unit">l</span></div></label>
        </div>
        <div class="calc-row"><span class="calc-l">Diff:</span><span class="calc-v" :style="{ color: diffCol(dekk.s1d) }">{{ fp(dekk.s1d) }} → {{ fmt(dekk.sl1) }} l</span></div>
        <div class="measure-sep">
          <div class="measure-lbl">Måling 2</div>
          <div class="row3">
            <label class="field"><span class="field-label">Sett.(%)</span><div class="input-wrap"><input class="inp" type="number" step="any" v-model.number="ss2"><span class="inp-unit">%</span></div></label>
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
      </div>

      <div class="act-bar">
        <button class="act-btn pdf-btn" @click="makePdf">{{ pdfOk ? '✅ Lastet ned!' : '📄 Last ned PDF' }}</button>
        <button class="act-btn send-btn" @click="showMail = true">✉️ Send til kunde</button>
      </div>

      <div class="formulas">
        <div class="formulas-title">Formler brukt</div>
        <div class="fml">Reduksjon min = Zewo − I dag</div>
        <div class="fml">Reduksjon % = 1 − (Zewo / I dag)</div>
        <div class="fml">Diff % = (Anbefaling − Settpunkt) / Settpunkt</div>
        <div class="fml">Diff liter = Forbruk × Diff %</div>
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
          <div class="modal-total-row"><span class="muted">Besparelse:</span><span class="green fw700">{{ fmt(totSape) }} l/vask</span></div>
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
.app { max-width: 480px; margin: 0 auto; min-height: 100vh; background: linear-gradient(168deg, var(--zewo-darker), var(--zewo-dark) 50%, var(--zewo-navy)); padding-bottom: 32px; }

.header { padding: 16px 20px 12px; background: linear-gradient(135deg, rgba(200,16,46,.08), rgba(26,26,46,.8)); border-bottom: 1px solid var(--zewo-border); }
.header-inner { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.header-logo { height: 36px; width: auto; }
.header-badge { font-size: 10px; font-weight: 700; color: #fff; background: var(--zewo-red); border-radius: 5px; padding: 3px 8px; text-transform: uppercase; letter-spacing: .8px; }
.header-sub { font-size: 12px; color: var(--zewo-text-muted); }

.tab-bar { display: flex; border-bottom: 1px solid rgba(200,16,46,.08); padding: 0 16px; margin-top: 8px; }
.tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px 8px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--zewo-text-dim); font-size: 11px; font-weight: 600; cursor: pointer; transition: all .2s; }
.tab.active { color: var(--zewo-red); border-bottom-color: var(--zewo-red); background: rgba(200,16,46,.04); }
.tab-icon { font-size: 17px; }

.content { padding: 6px 16px; }
.sec-title { font-size: 11px; font-weight: 700; color: var(--zewo-red); text-transform: uppercase; letter-spacing: 2px; margin: 20px 0 10px; }
.card { background: var(--zewo-surface); border: 1px solid var(--zewo-border); border-radius: var(--radius); padding: 14px 14px 10px; margin-bottom: 10px; }
.card-label { font-size: 14px; font-weight: 600; color: var(--zewo-text); margin-bottom: 10px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; }

.field { margin-bottom: 8px; display: block; }
.field-label { display: block; font-size: 10px; font-weight: 600; color: var(--zewo-text-dim); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 3px; }
.input-wrap { position: relative; }
.inp { width: 100%; padding: 9px 32px 9px 10px; background: rgba(0,0,0,.35); border: 1px solid rgba(200,16,46,.1); border-radius: var(--radius-sm); color: var(--zewo-text); font-size: 14px; font-family: var(--mono); font-weight: 500; transition: border-color .2s; }
.inp-unit { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--zewo-text-dim); pointer-events: none; }

.calc-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 6px 10px; background: rgba(200,16,46,.03); border-radius: 6px; }
.calc-l { font-size: 11px; color: var(--zewo-text-dim); font-weight: 600; }
.calc-v { font-size: 13px; font-weight: 600; font-family: var(--mono); }

.measure-lbl { font-size: 11px; color: var(--zewo-text-muted); font-weight: 600; margin-bottom: 6px; }
.measure-sep { border-top: 1px solid var(--zewo-border); padding-top: 10px; margin-top: 10px; }
.tot-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; color: var(--zewo-text); }
.fw600 { font-weight: 600; }
.fw700 { font-weight: 700; }
.sep { border-top: 1px solid rgba(255,255,255,.06); margin-top: 4px; padding-top: 4px; }

.res-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
.res-card { background: var(--zewo-surface); border: 1px solid var(--zewo-border); border-radius: 12px; padding: 12px; border-left: 3px solid var(--zewo-green); }
.res-val { font-size: 21px; font-weight: 700; font-family: var(--mono); }
.res-lbl { font-size: 11px; font-weight: 600; color: var(--zewo-text-muted); }
.res-sub { font-size: 10px; color: var(--zewo-text-dim); margin-top: 1px; }

.summary { background: linear-gradient(135deg, rgba(200,16,46,.04), rgba(200,16,46,.01)); border: 1px solid var(--zewo-border); border-radius: 16px; padding: 16px; margin-bottom: 16px; }
.sum-row { display: flex; justify-content: space-between; padding: 4px 0; }
.sum-l { font-size: 13px; color: var(--zewo-text-muted); }
.sum-v { font-size: 15px; font-weight: 700; font-family: var(--mono); }
.sum-sep { border-top: 1px solid var(--zewo-border); margin: 6px 0; padding-top: 6px; }
.sum-total { border-top: 2px solid var(--zewo-red); padding-top: 10px; margin-top: 6px; display: flex; justify-content: space-between; }
.sum-total-l { font-size: 15px; font-weight: 700; }
.sum-total-v { font-size: 22px; font-weight: 700; font-family: var(--mono); color: var(--zewo-red); }

.act-bar { display: flex; gap: 10px; margin-bottom: 16px; }
.act-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 8px; border-radius: var(--radius); border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity .15s; }
.pdf-btn { background: linear-gradient(135deg, var(--zewo-navy), #1e2d4a); color: var(--zewo-red-light); border: 1px solid var(--zewo-border); }
.send-btn { background: linear-gradient(135deg, var(--zewo-green), #15803d); color: #fff; }

.formulas { background: rgba(0,0,0,.3); border: 1px solid var(--zewo-border); border-radius: 12px; padding: 14px; }
.formulas-title { font-size: 10px; font-weight: 700; color: var(--zewo-text-dim); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; }
.fml { font-size: 11px; font-family: var(--mono); color: var(--zewo-red-light); padding: 2px 0; opacity: .7; }

.muted { color: var(--zewo-text-muted); }
.green { color: var(--zewo-green); }

/* Modal */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); backdrop-filter: blur(6px); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; animation: fadeIn .15s; }
.modal { width: 100%; max-width: 480px; background: linear-gradient(170deg, var(--zewo-dark), var(--zewo-navy)); border: 1px solid var(--zewo-border); border-radius: 22px 22px 0 0; padding: 12px 20px 24px; animation: slideUp .25s; }
.modal-drag { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,.12); margin: 0 auto 16px; }
.modal-hd { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.modal-title { font-weight: 700; font-size: 17px; }
.modal-sub { font-size: 12px; color: var(--zewo-text-muted); }
.modal-preview { background: rgba(0,0,0,.25); border-radius: 12px; padding: 12px; margin-bottom: 12px; }
.modal-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
.modal-total-row { border-top: 1px solid var(--zewo-border); margin-top: 6px; padding-top: 6px; display: flex; justify-content: space-between; font-size: 14px; }
.modal-tip { display: flex; align-items: center; gap: 10px; background: rgba(245,158,11,.06); border: 1px solid rgba(245,158,11,.12); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: var(--zewo-text-muted); }
.modal-actions { display: flex; gap: 10px; }
.m-cancel { flex: 1; padding: 13px; border-radius: 12px; border: 1px solid var(--zewo-border); background: none; color: var(--zewo-text-muted); font-size: 14px; font-weight: 600; cursor: pointer; }
.m-confirm { flex: 2; padding: 13px; border-radius: 12px; border: none; background: var(--zewo-red); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; }
.m-confirm:disabled { background: #444; opacity: .4; cursor: default; }
</style>
