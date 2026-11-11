import './styles.css';

/* ════════════════════════════════════════════════════════════════
   CONFIGURACIÓN — completar antes de publicar
   ────────────────────────────────────────────────────────────────
   WHATSAPP_NUMBER  Número del asesor en formato internacional, solo dígitos.
                    Ej.: '584121234567'
   AGENDA_URL       Enlace de reserva (Calendly, Cal.com, Google Calendar).
                    Si se deja vacío, el último paso confirma por WhatsApp.
   FORM_ENDPOINT    URL que recibe el prospecto como JSON por POST
                    (Google Apps Script, Formspree, Make, tu CRM…).
                    Si se deja vacío, el prospecto viaja solo por WhatsApp.
   ════════════════════════════════════════════════════════════════ */
const CONFIG = {
  WHATSAPP_NUMBER: '584149137107',
  AGENDA_URL: '',
  FORM_ENDPOINT: '',
  ROTATE_MS: 6000,
};

const root = document.documentElement;
root.classList.add('js');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ── Medición: eventos a dataLayer (GTM / GA4) ─────────────────── */
window.dataLayer = window.dataLayer || [];
const track = (event, data = {}) => window.dataLayer.push({ event, ...data });

/* ── Estado compartido del prospecto ───────────────────────────── */
const state = { profile: '', pains: new Set(), cta: '', headline: 0 };
const utm = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => k.startsWith('utm_')));

/* ── Versión de la página: general (centros y clínicas) o médico independiente ── */
const AUD_META = {
  general: {
    title: 'AoraMedical · Gestión médica y administrativa',
    desc: 'AoraMedical une agenda, pacientes, cobros, consulta médica y gestión en una sola plataforma para clínicas, centros médicos, consultorios y médicos en Venezuela.',
  },
  medico: {
    title: 'AoraMedical para médicos · Tu consultorio completo por $59,99 al mes',
    desc: 'Por el precio de una consulta al mes: tu usuario de médico y el de tu secretaria. Agenda, historia clínica, récipes e informes con tu membrete, firma electrónica y presupuestos de cirugía. $59,99 + IVA. Promo trimestral: el tercer mes gratis. Anual: 2 meses gratis.',
  },
};
function audFromUrl() {
  const q = new URLSearchParams(location.search).get('para');
  if (q === 'medico' || /\/medicos?\/?$/.test(location.pathname) || location.hash === '#medico') return 'medico';
  return 'general';
}
let aud = audFromUrl();
document.body.dataset.aud = aud;

/* ── Toast ─────────────────────────────────────────────────────── */
const toast = $('#toast');
let toastTimer = 0;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ── Reveal ────────────────────────────────────────────────────── */
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    revealIO.unobserve(e.target);
  }
}, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el) => revealIO.observe(el));

/* ── Nav, progreso y barra móvil ───────────────────────────────── */
const nav = $('#nav');
const bar = $('#progress');
const mbar = $('#mbar');
const heroEl = () => $(aud === 'medico' ? '#md-inicio' : '#inicio');
const closeEl = () => $(aud === 'medico' ? '#md-activar' : '#diagnostico');
const hero = $('#inicio');
let closing = closeEl();
let ticking = false;
function onScroll() {
  ticking = false;
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 12);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  const pastHero = y > heroEl().offsetHeight - 120;
  const atClose = closeEl().getBoundingClientRect().top < window.innerHeight * 0.6;
  mbar.classList.toggle('is-on', pastHero && !atClose);
}
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
window.addEventListener('resize', onScroll);

const links = $$('.nav__links a');
const sectionIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
  }
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id], #preguntas').forEach((s) => sectionIO.observe(s));

const toggle = $('#menuToggle');
const sheet = $('#menuSheet');
function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  sheet.hidden = !open;
  nav.classList.toggle('is-scrolled', open || window.scrollY > 12);
}
toggle.addEventListener('click', () => setMenu(sheet.hidden));
$$('a', sheet).forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) { setMenu(false); toggle.focus(); } });

/* ── Titular rotativo del hero ─────────────────────────────────── */
const rotators = $$('.lp-rot').map((el) => ({ el, items: $$('.lp-rot__item', el), i: 0, paused: false }));
function setHeadline(r, i) {
  r.i = i;
  r.items.forEach((el, k) => { el.classList.toggle('is-on', k === i); el.setAttribute('aria-hidden', String(k !== i)); });
  if (r.el.id === 'rot') state.headline = i;
}
const visibleHeadline = () => (rotators.find((r) => r.el.offsetParent) || { i: 0 }).i;
if (!reduced) {
  rotators.filter((r) => r.items.length > 1).forEach((r) => {
    r.el.addEventListener('pointerenter', () => { r.paused = true; });
    r.el.addEventListener('pointerleave', () => { r.paused = false; });
    setInterval(() => {
      if (r.paused || document.hidden || !r.el.offsetParent) return;
      setHeadline(r, (r.i + 1) % r.items.length);
    }, CONFIG.ROTATE_MS);
  });
}

/* ── Consola del hero: profundidad con el puntero ─────────────── */
const consoleEl = $('#console');
if (finePointer && !reduced && consoleEl) {
  const rest = 'rotateX(10deg)';
  consoleEl.style.transform = rest;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    consoleEl.style.transform = `rotateX(${8 - y * 4}deg) rotateY(${x * 5}deg)`;
  });
  hero.addEventListener('pointerleave', () => { consoleEl.style.transform = rest; });
}

/* ── Perfil: selector del hero ↔ pestañas ↔ formulario ─────────── */
const chips = $$('.lp-chip');
const tabs = $$('.prof__tab');
function setProfile(p, source) {
  state.profile = p;
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.profile === p)));
  tabs.forEach((t) => {
    const on = t.dataset.profile === p;
    t.classList.toggle('is-on', on);
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.hidden = !on;
    panel.classList.toggle('is-on', on);
  });
  const radio = $(`#leadForm input[name="perfil"][value="${p}"]`);
  if (radio) radio.checked = true;
  if (source) track('perfil_elegido', { perfil: p, origen: source });
}
chips.forEach((c) => c.addEventListener('click', () => {
  setProfile(c.dataset.profile, 'hero');
  if (!c.dataset.audGo) showToast('Listo. Adaptamos los beneficios a tu caso.');
}));
tabs.forEach((t, i) => {
  t.addEventListener('click', () => setProfile(t.dataset.profile, 'pestanas'));
  t.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    const next = tabs.at((i + k + tabs.length) % tabs.length);
    setProfile(next.dataset.profile, 'pestanas');
    next.focus();
  });
});

/* ── Autodiagnóstico ───────────────────────────────────────────── */
const painText = $('#painText');
const painCta = $('#painCta');
function updatePains() {
  const n = state.pains.size;
  if (n === 0) {
    painText.textContent = 'Toca las tarjetas que describen tu centro.';
    painCta.textContent = 'Agendar mi diagnóstico →';
  } else if (n === 1) {
    painText.innerHTML = 'Marcaste <b>1 de 6</b>. Ese punto lo revisamos en tu diagnóstico.';
    painCta.textContent = 'Hablemos de este punto →';
  } else {
    painText.innerHTML = `Marcaste <b>${n} de 6</b>. Esos ${n} puntos son exactamente lo que revisamos en tu diagnóstico.`;
    painCta.textContent = 'Hablemos de estos puntos →';
  }
}
$$('.pain').forEach((b) => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', String(on));
  on ? state.pains.add(b.dataset.pain) : state.pains.delete(b.dataset.pain);
  track('autodiagnostico_marca', { dolor: b.dataset.pain, marcado: on, total: state.pains.size });
  updatePains();
}));
updatePains();

/* ── Recorrido del paciente ────────────────────────────────────── */
const STEPS = [
  { who: 'Agenda médica', title: 'Agenda sin errores.', text: 'Cada médico con su horario y su capacidad real. El sistema no deja sobrecargarlo ni guardar una cita sin datos de contacto.', tags: ['Capacidad por médico', 'Datos obligatorios', '9 estados de cita'] },
  { who: 'Recepción', title: 'Recepción ordenada.', text: 'Turno automático por orden de llegada y signos vitales tomados antes de la consulta. El médico los recibe listos en su pantalla.', tags: ['Turno automático', 'Signos vitales', 'IMC calculado'] },
  { who: 'Cobro', title: 'Cobro antes de atender.', text: 'Ningún paciente pasa a consulta sin pago registrado o una exoneración con su motivo y la persona que la autorizó.', tags: ['Pago verificado', 'Pago Móvil y transferencia', 'Exoneración con responsable'] },
  { who: 'Consulta médica', title: 'Consulta más rápida.', text: 'Historia clínica a mano, diagnósticos CIE-10, récipe con autocompletado, informe redactado automáticamente y firma electrónica con PIN.', tags: ['CIE-10', 'Récipe con autocompletado', 'Firma con PIN'] },
  { who: 'Seguimiento y control', title: 'Seguimiento y control.', text: 'Presupuestos con estado visible para cada área, post-venta para volver a agendar al paciente y un tablero gerencial cuyos números coinciden.', tags: ['Presupuestos con seguimiento', 'Post-venta', 'Tablero en tiempo real'] },
];
const jSteps = $$('.jstep');
const jViews = $$('.lp-view');
const jFill = $('#journeyFill');
const jPanel = $('#jpanel');
let jIndex = 0;
let jTouched = false;
function setStep(i, focus = false) {
  jIndex = i;
  const s = STEPS.at(i);
  jSteps.forEach((b, k) => {
    b.classList.toggle('is-on', k === i);
    b.classList.toggle('is-past', k < i);
    b.setAttribute('aria-selected', String(k === i));
    b.tabIndex = k === i ? 0 : -1;
  });
  jViews.forEach((v, k) => v.classList.toggle('is-on', k === i));
  if (focus) jSteps.at(i).focus();
  jFill.style.transform = `scaleX(${i / (STEPS.length - 1)})`;
  $('#jpWho').textContent = s.who;
  $('#jpN').textContent = `Paso ${i + 1} de ${STEPS.length}`;
  $('#jpTitle').textContent = s.title;
  $('#jpText').textContent = s.text;
  $('#jpTags').innerHTML = s.tags.map((t) => `<li>${t}</li>`).join('');
  const strip = $('.journey__steps');
  if (strip.scrollWidth > strip.clientWidth) {
    const b = jSteps.at(i);
    strip.scrollTo({ left: b.offsetLeft - strip.clientWidth / 2 + b.offsetWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  }
}
jSteps.forEach((b, i) => b.addEventListener('click', () => { jTouched = true; setStep(i); track('recorrido_paso', { paso: i + 1 }); }));
$('.journey__steps').addEventListener('keydown', (e) => {
  const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (k === undefined) return;
  e.preventDefault();
  jTouched = true;
  setStep((jIndex + k + STEPS.length) % STEPS.length, true);
});
if (!reduced) {
  let timer = 0;
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting && !jTouched) {
      timer = setInterval(() => {
        if (jTouched) { clearInterval(timer); return; }
        setStep((jIndex + 1) % STEPS.length);
      }, 5000);
    }
  }, { threshold: 0.5 }).observe($('#journey'));
}

/* ── CTA: registrar cuál se usó ────────────────────────────────── */
$$('[data-cta]').forEach((a) => a.addEventListener('click', () => {
  state.cta = a.dataset.cta;
  track('cta_click', { ubicacion: a.dataset.cta, titular_visible: visibleHeadline() + 1, perfil: state.profile || null, version: aud });
}));

/* ── Cotizar (versión general) ─────────────────────────────────── */
const PROFILE_OF = { 'Consultorio o centro': 'centro', 'Clínica o institución': 'clinica' };
$$('[data-cta^="cotizar"], [data-cta="nav-cotizar"], [data-cta="barra-movil-cotizar"], [data-cta="footer-cotizar"], [data-cta="faq-cotizar"]').forEach((a) => a.addEventListener('click', () => {
  state.cotizar = true;
  if (a.dataset.cotizar) setProfile(PROFILE_OF[a.dataset.cotizar], 'cotizar');
  showToast('Déjanos tus datos y te enviamos tu cotización por escrito.');
}));

/* ── WhatsApp ──────────────────────────────────────────────────── */
function waLink(text) {
  const n = CONFIG.WHATSAPP_NUMBER.replace(/\D/g, '');
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : '';
}
const WA_DEFAULT = 'Hola, quiero agendar mi diagnóstico operativo de AoraMedical. Mi centro es: ';
const WA_MEDICO = 'Hola, quiero información del plan de AoraMedical para médicos ($59,99 al mes + IVA). Mi especialidad es: ';
$$('.js-wa').forEach((a) => {
  const href = waLink(a.dataset.wa === 'medico' ? WA_MEDICO : WA_DEFAULT);
  if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; }
  a.addEventListener('click', (e) => {
    track('whatsapp_click', { ubicacion: a.dataset.cta || 'whatsapp' });
    if (!href) {
      e.preventDefault();
      closeEl().scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      showToast('Déjanos tus datos y te escribimos por WhatsApp en menos de 24 horas.');
    }
  });
});

/* ── Formulario en 2 pasos ─────────────────────────────────────── */
const form = $('#leadForm');
const fs1 = $('[data-fs="1"]', form);
const fs2 = $('[data-fs="2"]', form);
const leadBar = $('#leadBar');
const leadStep = $('#leadStep');
const telErr = $('#telErr');
const val = (name) => (form.elements[name]?.value || '').trim();

function checkGroup(name) {
  const ok = !!form.querySelector(`input[name="${name}"]:checked`);
  form.querySelector(`input[name="${name}"]`).closest('.opts').classList.toggle('is-invalid', !ok);
  return ok;
}
function checkText(name, extra = () => true) {
  const el = form.elements[name];
  const ok = el.value.trim().length > 1 && extra(el.value);
  el.setAttribute('aria-invalid', String(!ok));
  return ok;
}
const telOk = (v) => v.replace(/\D/g, '').replace(/^0/, '').length === 10;

function goStep(n) {
  fs1.hidden = n !== 1; fs1.classList.toggle('is-on', n === 1);
  fs2.hidden = n !== 2; fs2.classList.toggle('is-on', n === 2);
  leadBar.style.width = n === 1 ? '50%' : '100%';
  leadStep.textContent = `Paso ${n} de 2`;
  const first = (n === 1 ? fs1 : fs2).querySelector('input');
  first?.focus({ preventScroll: true });
}
$('#toStep2').addEventListener('click', () => {
  const a = checkText('nombre');
  const b = checkText('whatsapp', telOk);
  telErr.hidden = b;
  const c = checkGroup('perfil');
  if (!(a && b && c)) { showToast('Completa los campos marcados para continuar.'); return; }
  state.profile = val('perfil') || form.querySelector('input[name="perfil"]:checked').value;
  track('formulario_paso1', { perfil: state.profile });
  goStep(2);
});
$('#toStep1').addEventListener('click', () => goStep(1));

const cityReq = $('#cityReq');
form.addEventListener('change', (e) => {
  if (e.target.name === 'modalidad') cityReq.textContent = e.target.value === 'Presencial' ? '(obligatorio para presencial)' : '(opcional)';
  if (e.target.type === 'radio') e.target.closest('.opts')?.classList.remove('is-invalid');
  if (e.target.name === 'perfil') setProfile(e.target.value);
});

const LABEL = { medico: 'Médico independiente', centro: 'Consultorio o centro', clinica: 'Clínica o institución' };
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const presencial = form.querySelector('input[name="modalidad"]:checked')?.value === 'Presencial';
  const ok = [
    checkText('centro'),
    checkGroup('cargo'),
    checkGroup('medicos'),
    checkGroup('modalidad'),
    presencial ? checkText('ciudad') : true,
  ].every(Boolean);
  if (!ok) { showToast('Completa los campos marcados para continuar.'); return; }

  const g = (n) => form.querySelector(`input[name="${n}"]:checked`)?.value || '';
  const lead = {
    nombre: val('nombre'),
    whatsapp: '+58' + val('whatsapp').replace(/\D/g, '').replace(/^0/, ''),
    perfil: LABEL[g('perfil')] || g('perfil'),
    centro: val('centro'),
    cargo: g('cargo'),
    medicos: g('medicos'),
    modalidad: g('modalidad'),
    ciudad: val('ciudad'),
    correo: val('correo'),
    dolores: [...state.pains],
    cta: state.cta,
    titular_visible: state.headline + 1,
    cotizacion: !!state.cotizar,
    utm,
    pagina: location.href,
    fecha: new Date().toISOString(),
  };
  track('formulario_paso2', { perfil: lead.perfil, medicos: lead.medicos, modalidad: lead.modalidad });

  if (CONFIG.FORM_ENDPOINT) {
    try {
      await fetch(CONFIG.FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(lead) });
    } catch { /* el respaldo por WhatsApp sigue disponible */ }
  }

  const summary = [
    state.cotizar ? 'Hola, quiero una cotización de AoraMedical y agendar mi Diagnóstico Operativo.' : 'Hola, quiero agendar mi Diagnóstico Operativo de AoraMedical.',
    `Nombre: ${lead.nombre}`,
    `Centro: ${lead.centro} (${lead.perfil})`,
    `Cargo: ${lead.cargo} · Médicos: ${lead.medicos}`,
    `Modalidad: ${lead.modalidad}${lead.ciudad ? ' · ' + lead.ciudad : ''}`,
    lead.dolores.length ? `Me interesa revisar: ${lead.dolores.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const agenda = $('#agendaBtn');
  const waBtn = $('#waConfirm');
  const waHref = waLink(summary);
  if (CONFIG.AGENDA_URL) {
    const u = new URL(CONFIG.AGENDA_URL);
    u.searchParams.set('name', lead.nombre);
    if (lead.correo) u.searchParams.set('email', lead.correo);
    agenda.href = u.toString();
    agenda.hidden = false;
  } else {
    agenda.hidden = true;
  }
  if (waHref) { waBtn.href = waHref; waBtn.hidden = false; } else { waBtn.hidden = true; }
  if (!CONFIG.AGENDA_URL) {
    $('#doneTitle').textContent = `¡Listo, ${lead.nombre.split(' ')[0]}! Recibimos tus datos.`;
    $('#doneText').textContent = waHref
      ? 'Confirma por WhatsApp y te enviamos las fechas disponibles. Te respondemos en menos de 24 horas.'
      : 'Te escribimos por WhatsApp en menos de 24 horas para coordinar la fecha de tu diagnóstico.';
    waBtn.className = 'btn btn--light btn--block';
  } else {
    $('#doneTitle').textContent = `¡Listo, ${lead.nombre.split(' ')[0]}! Último paso: elige tu fecha.`;
  }
  agenda.addEventListener('click', () => track('cita_agenda_click', { modalidad: lead.modalidad }), { once: true });

  form.hidden = true;
  leadStep.textContent = 'Solicitud recibida';
  leadBar.style.width = '100%';
  const done = $('#leadDone');
  done.hidden = false;
  done.focus();
  track('lead_enviado', { perfil: lead.perfil, dolores: lead.dolores.length });
});

/* ── Demo en video: reproducción automática, sin botón de play ─── */
const tryPlay = (v) => { if (!v) return; v.muted = true; v.defaultMuted = true; const r = v.play(); if (r && r.catch) r.catch(() => {}); };
const demos = $$('.demo__box').map((box) => {
  const section = box.closest('section');
  const tabs = $$('.demo__tab', box);
  const vids = tabs.map((t) => $('video', document.getElementById(t.getAttribute('aria-controls'))));
  const d = { section, tabs, vids, idx: 0, touched: false, visible: false };
  d.set = (i, focus = false) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.classList.toggle('is-on', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on; panel.classList.toggle('is-on', on);
      if (!on) vids[k]?.pause();
      const bar = $('.demo__bar', t); bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)';
    });
    d.idx = i; if (focus) tabs[i].focus();
    const v = vids[i]; v.loop = d.touched; try { v.currentTime = 0; } catch {}
    if (d.visible) tryPlay(v);
    const next = vids[(i + 1) % vids.length]; if (next && next.preload !== 'auto') { next.preload = 'auto'; next.load(); }
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { d.touched = true; d.set(i); track('demo_video', { modulo: t.dataset.demo }); });
    t.addEventListener('keydown', (e) => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (k === undefined) return; e.preventDefault(); d.touched = true; d.set((i + k + tabs.length) % tabs.length, true);
    });
  });
  vids.forEach((v, k) => {
    v.loop = false;
    v.addEventListener('timeupdate', () => {
      if (k !== d.idx) return;
      const bar = $('.demo__bar', tabs[k]);
      if (v.duration && bar) { bar.style.transition = 'transform .25s linear'; bar.style.transform = `scaleX(${v.currentTime / v.duration})`; }
    });
    v.addEventListener('ended', () => { if (k === d.idx && !d.touched) d.set((d.idx + 1) % tabs.length); });
    v.addEventListener('canplay', () => { if (k === d.idx && d.visible) tryPlay(v); });
  });
  new IntersectionObserver(([e]) => {
    d.visible = e.isIntersecting;
    if (d.visible) tryPlay(vids[d.idx]); else vids[d.idx]?.pause();
  }, { threshold: 0.2 }).observe(section);
  return d;
});
// Si el navegador bloqueó la reproducción, la primera interacción la reanuda.
const kick = () => demos.forEach((d) => { if (d.visible && d.vids[d.idx]?.paused) tryPlay(d.vids[d.idx]); });
['pointerdown', 'scroll', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, kick, { passive: true }));

/* ── Plan médico: botones de plan y formulario de activación ───── */
const mdForm = $('#mdForm');
$$('[data-plan]').forEach((a) => a.addEventListener('click', () => {
  const r = mdForm && $(`input[name="plan"][value="${a.dataset.plan}"]`, mdForm);
  if (r) r.checked = true;
  track('plan_elegido', { plan: a.dataset.plan });
}));
if (mdForm) {
  const mv = (n) => (mdForm.elements[n]?.value || '').trim();
  const mdText = (n, extra = () => true) => { const el = mdForm.elements[n]; const ok = el.value.trim().length > 1 && extra(el.value); el.setAttribute('aria-invalid', String(!ok)); return ok; };
  mdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const okTel = mdText('whatsapp', telOk);
    $('#mdTelErr').hidden = okTel;
    const ok = [mdText('nombre'), okTel, mdText('especialidad'), mdText('ciudad')].every(Boolean);
    if (!ok) { showToast('Completa los campos marcados para continuar.'); return; }
    const plan = mdForm.querySelector('input[name="plan"]:checked')?.value || 'Mensual';
    const lead = {
      nombre: mv('nombre'),
      whatsapp: '+58' + mv('whatsapp').replace(/\D/g, '').replace(/^0/, ''),
      perfil: 'Médico independiente',
      centro: '',
      cargo: 'Médico',
      medicos: 'Solo yo',
      modalidad: '',
      ciudad: mv('ciudad'),
      correo: mv('correo'),
      especialidad: mv('especialidad'),
      plan,
      dolores: [],
      cta: state.cta,
      titular_visible: visibleHeadline() + 1,
      utm,
      pagina: location.href,
      fecha: new Date().toISOString(),
    };
    if (CONFIG.FORM_ENDPOINT) {
      try { await fetch(CONFIG.FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(lead) }); } catch { /* respaldo por WhatsApp */ }
    }
    const summary = [
      'Hola, quiero activar mi plan de AoraMedical para médicos.',
      `Nombre: ${lead.nombre}`,
      `Especialidad: ${lead.especialidad}`,
      `Ciudad: ${lead.ciudad}`,
      `Plan: ${({ 'Mensual': 'Mensual ($59,99/mes + IVA)', 'Trimestral (promo)': 'Trimestral promo ($119,98 + IVA por 3 meses; desde el 4.º mes $59,99/mes)', 'Anual': 'Anual ($599,90 + IVA, 2 meses gratis)' })[plan] || plan}`,
    ].join('\n');
    const waHref = waLink(summary);
    const btn = $('#mdWaConfirm');
    if (waHref) { btn.href = waHref; btn.hidden = false; } else { btn.hidden = true; }
    $('#mdDoneTitle').textContent = `¡Listo, ${lead.nombre.split(' ')[0]}! Recibimos tus datos.`;
    $('#mdDoneText').textContent = waHref
      ? 'Confirma por WhatsApp y activamos tu plan. Te respondemos en menos de 24 horas.'
      : 'Te escribimos por WhatsApp en menos de 24 horas para activar tu plan.';
    mdForm.hidden = true;
    const done = $('#mdDone'); done.hidden = false; done.focus();
    track('lead_enviado', { perfil: 'medico', plan });
  });
}

/* ── Cambio de versión (general ↔ médico) ─────────────────────── */
function setAud(next, { push = false, scroll = true } = {}) {
  aud = next;
  document.body.dataset.aud = next;
  $$('.aud-switch [data-aud-go]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.audGo === next)));
  document.title = AUD_META[next].title;
  $('meta[name="description"]')?.setAttribute('content', AUD_META[next].desc);
  if (push) {
    const u = new URL(location.href);
    if (next === 'medico') u.searchParams.set('para', 'medico'); else u.searchParams.delete('para');
    u.hash = '';
    try { history.pushState({ aud: next }, '', u); } catch { /* archivo local */ }
  }
  if (scroll) window.scrollTo(0, 0);
  $$(`[data-aud-show="${next}"] .reveal:not(.in)`).forEach((el) => { revealIO.unobserve(el); revealIO.observe(el); });
  demos.forEach((d) => { if (!d.section.offsetParent) d.vids[d.idx]?.pause(); });
  setMenu(false);
  onScroll();
  track('version_pagina', { version: next });
}
$$('[data-aud-go]').forEach((el) => el.addEventListener('click', (e) => {
  e.preventDefault();
  if (el.dataset.audGo !== aud) setAud(el.dataset.audGo, { push: true });
}));
window.addEventListener('popstate', () => setAud(audFromUrl(), { scroll: false }));
setAud(aud, { scroll: false });

/* ── FAQ: medir qué preguntas se abren ─────────────────────────── */
$$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) track('faq_abierta', { pregunta: d.querySelector('summary').textContent });
}));

onScroll();
