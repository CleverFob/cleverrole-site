/* Clever Role homepage: "Let's build your platform" chat (OFF by default).
   Version 1 runs entirely in the visitor's browser: it sends nothing, saves nothing (no cookies, no storage), creates
   no account and reads no website. A logo they choose is shown on this device only and is never uploaded.
   Switch: window.CR_HOME_BUILDER in index.html (false = off). Jay's private preview: add ?builder=1 to the address. */
(function () {
  'use strict';
  var on = window.CR_HOME_BUILDER === true || /[?&]builder=1(?:&|$)/.test(location.search);
  if (!on) return;
  var stage = document.querySelector('.stage');
  var top = document.querySelector('.stage .top');
  if (!stage || !top) return;

  var SIGNUP_URL = 'https://app.cleverrole.com/';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- what we know about the visitor (kept in memory only) ---------- */
  var S = { name: '', need: '', company: '', type: '', colour: '', logo: '' };

  var TYPES = {
    professional_service: { label: 'Professional service', roles: ['Lead Response', 'Meeting Booking', 'Account Growth', 'Finance Operations'] },
    products: { label: 'Products', roles: ['Customer Care', 'Support Desk', 'Campaign Manager', 'Finance Operations'] },
    accommodation: { label: 'Accommodation', roles: ['Web Assistant', 'Meeting Booking', 'Customer Care', 'Campaign Manager'] },
    tours: { label: 'Tours and activities', roles: ['Web Assistant', 'Meeting Booking', 'Campaign Manager', 'Customer Care'] },
    appointments: { label: 'Appointments', roles: ['Meeting Booking', 'Customer Care', 'Contact Reach', 'Web Assistant'] },
    trades: { label: 'Trades and services', roles: ['Lead Response', 'Meeting Booking', 'Finance Operations', 'Customer Care'] },
    education: { label: 'Education and clubs', roles: ['Lead Response', 'Contact Reach', 'Customer Care', 'Campaign Manager'] },
    software: { label: 'Software', roles: ['Support Desk', 'Web Assistant', 'Account Growth', 'Client Setup'] }
  };
  var ROLE_LINE = {
    'Lead Response': 'Answers new enquiries quickly',
    'Meeting Booking': 'Offers times and books meetings',
    'Account Growth': 'Spots who to follow up with',
    'Finance Operations': 'Keeps invoices moving',
    'Customer Care': 'Replies to your customers',
    'Support Desk': 'Handles help requests',
    'Campaign Manager': 'Plans your posts and emails',
    'Web Assistant': 'Chats with your website visitors',
    'Contact Reach': 'Reaches out to your contacts',
    'Client Setup': 'Welcomes your new customers'
  };
  var SWATCHES = ['#1f6f8b', '#2e7d4f', '#c2563a', '#7a4fb3', '#b8860b', '#d6336c', '#2b59c3', '#374151'];
  var MENU = ['Home', 'Needs you', 'Email', 'Calendar', 'Contacts', 'Workforce', 'Results', 'Setup'];

  /* ---------- the conversation ---------- */
  var STEPS = [
    { id: 'name', ask: function () { return 'Hello, what’s your name?'; }, kind: 'text', ph: 'Your first name', max: 40,
      take: function (v) { S.name = v; } },
    { id: 'need', ask: function () { return 'Nice to meet you, ' + S.name + '. How can we help you today?'; }, kind: 'text', max: 200,
      ph: 'Tell us in your own words', chips: ['I want to find out what Clever Role does', 'I need help with customers and email', 'I want to see it working'],
      take: function (v) { S.need = v; },
      reply: function (v) {
        var t = v.toLowerCase();
        if (/email|customer|enquir|reply|inbox/.test(t)) return 'Good news. Handling customers and email is what our Roles are built for, and you approve anything that goes out.';
        if (/see|show|demo|work/.test(t)) return 'The quickest way to see it is to build yours right now.';
        return 'Clever Role gives your business a team of digital Roles that do the everyday work and ask you first.';
      } },
    { id: 'offer', ask: function () { return 'Would you like me to help you set up your own platform? It takes about a minute. Nothing is saved or sent unless you create an account.'; },
      kind: 'choice', options: ['Yes please', 'Not right now'],
      take: function (v) { S.offer = v; } },
    { id: 'company', ask: function () { return 'What is your business called?'; }, kind: 'text', ph: 'Business name', max: 60,
      take: function (v) { S.company = v; } },
    { id: 'type', ask: function () { return 'What does ' + S.company + ' do?'; }, kind: 'choice',
      options: Object.keys(TYPES).map(function (k) { return TYPES[k].label; }),
      take: function (v) { Object.keys(TYPES).forEach(function (k) { if (TYPES[k].label === v) S.type = k; }); } },
    { id: 'colour', ask: function () { return 'Pick a main colour for ' + S.company + '.'; }, kind: 'colour',
      take: function (v) { S.colour = v; } },
    { id: 'logo', ask: function () { return 'Do you have a logo? Choose a picture and it appears on your platform. It stays on this device and is never uploaded.'; }, kind: 'logo',
      take: function (v) { S.logo = v || ''; } },
    { id: 'end', ask: function () { return 'That’s ' + S.company + '’s platform, ' + S.name + '. Create your account to keep it and put the Roles to work. If you close this page, your answers are cleared.'; }, kind: 'end' }
  ];

  /* ---------- markup ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var css = document.createElement('style');
  css.textContent = [
    'html.hb-on .centre{display:none}',
    'html[data-view="privacy"] .hb,html[data-view="terms"] .hb{display:none}',
    '.hb{display:none}',
    'html.hb-on:not([data-view="privacy"]):not([data-view="terms"]) .hb{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,400px);gap:clamp(24px,5vw,72px);align-items:center;',
    '  width:min(1160px,100%);margin:0 auto;min-height:0;position:relative;z-index:2;overflow-y:auto;padding:12px 4px 4vh;box-sizing:border-box;scrollbar-width:none}',
    '.hb::-webkit-scrollbar{display:none}',
    '.hb-chat{display:flex;flex-direction:column;gap:14px;min-width:0}',
    '.hb-past{display:flex;flex-direction:column;gap:6px;color:var(--muted);font-size:15px;line-height:1.4}',
    '.hb-past div{opacity:.55;transition:opacity .4s}',
    '.hb-past div:last-child{opacity:.8}',
    '.hb-past b{color:var(--fg);font-weight:500}',
    '.hb-q{margin:0;font-weight:500;font-size:clamp(26px,4.2vw,42px);line-height:1.18;letter-spacing:-.015em;min-height:2.4em;text-wrap:balance}',
    '.hb-q .hb-caret{display:inline-block;width:2px;height:.9em;background:var(--fg);margin-left:3px;vertical-align:-.1em;animation:hbblink 1s steps(1) infinite}',
    '@keyframes hbblink{50%{opacity:0}}',
    '.hb-note{margin:0;color:var(--muted);font-size:15px;min-height:1.4em}',
    '.hb-form{display:flex;gap:10px;align-items:flex-end;opacity:0;transform:translateY(6px);transition:opacity .35s,transform .35s;pointer-events:none}',
    '.hb-form.show{opacity:1;transform:none;pointer-events:auto}',
    '.hb-in{flex:1;min-width:0;background:transparent;border:0;border-bottom:1.5px solid var(--line);color:var(--fg);font:inherit;font-size:clamp(20px,2.6vw,26px);padding:8px 2px;border-radius:0;outline:none;caret-color:var(--fg)}',
    '.hb-in:focus{border-bottom-color:var(--fg)}',
    '.hb-in::placeholder{color:var(--muted);opacity:.7}',
    '.hb-btn{font:inherit;font-size:15px;font-weight:500;color:var(--fg);background:transparent;border:1px solid var(--line);border-radius:999px;padding:9px 18px;cursor:pointer;transition:background .2s,border-color .2s}',
    '.hb-btn:hover{background:color-mix(in srgb,var(--fg) 8%,transparent);border-color:var(--fg)}',
    '.hb-btn.go{background:var(--fg);color:var(--bg);border-color:var(--fg)}',
    '.hb-btn.go:hover{opacity:.88;background:var(--fg)}',
    '.hb-chips{display:flex;flex-wrap:wrap;gap:8px;opacity:0;transition:opacity .35s;pointer-events:none}',
    '.hb-chips.show{opacity:1;pointer-events:auto}',
    '.hb-sw{display:flex;flex-wrap:wrap;gap:10px;align-items:center}',
    '.hb-sw button{width:38px;height:38px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;box-shadow:0 0 0 1px var(--line)}',
    '.hb-sw button:hover,.hb-sw button:focus-visible{box-shadow:0 0 0 2px var(--fg)}',
    '.hb-sw label{display:inline-flex;align-items:center;gap:8px;color:var(--muted);font-size:14px;cursor:pointer}',
    '.hb-sw input[type=color]{width:38px;height:38px;border:0;padding:0;background:none;cursor:pointer;border-radius:50%}',
    '.hb-end{display:flex;gap:10px;flex-wrap:wrap}',
    '.hb-small{color:var(--muted);font-size:13px}',
    '.hb-small a{color:var(--muted)}',
    /* the live preview */
    '.hb-prev{display:flex;flex-direction:column;gap:10px;min-width:0}',
    '.hb-tag{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}',
    '.hb-app{--b:#8a8c8c;--on:#fff;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--panel) 92%,transparent);overflow:hidden;box-shadow:0 18px 44px -22px rgba(0,0,0,.55);transition:border-color .5s}',
    '.hb-app.has-b{border-color:color-mix(in srgb,var(--b) 55%,var(--line))}',
    '.hb-bar{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--b);color:var(--on);min-height:48px;box-sizing:border-box;transition:background .5s}',
    '.hb-logo{width:30px;height:30px;border-radius:8px;background:color-mix(in srgb,var(--on) 18%,transparent);display:grid;place-items:center;font-weight:700;font-size:15px;overflow:hidden;flex:none}',
    '.hb-logo img{width:100%;height:100%;object-fit:contain;background:#fff}',
    '.hb-bar b{font-weight:600;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.hb-bar span.ph{opacity:.7;font-weight:400}',
    '.hb-body{display:grid;grid-template-columns:104px minmax(0,1fr);min-height:230px}',
    '.hb-nav{display:flex;flex-direction:column;gap:2px;padding:10px 8px;border-right:1px solid var(--line);font-size:12.5px;color:var(--muted)}',
    '.hb-nav i{font-style:normal;padding:6px 8px;border-radius:7px}',
    '.hb-nav i:first-child{background:color-mix(in srgb,var(--b) 16%,transparent);color:var(--fg)}',
    '.hb-main{padding:12px 14px;display:flex;flex-direction:column;gap:8px;min-width:0}',
    '.hb-main h4{margin:0;font-size:15px;font-weight:600}',
    '.hb-role{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line);border-radius:10px;font-size:13px;animation:hbin .45s ease both}',
    '.hb-role::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--b);margin-top:5px;flex:none}',
    '.hb-role b{display:block;font-weight:600;font-size:13px}',
    '.hb-role span{color:var(--muted);font-size:12px}',
    '.hb-empty{color:var(--muted);font-size:13px;border:1px dashed var(--line);border-radius:10px;padding:14px}',
    '.hb-foot{padding:8px 14px;border-top:1px solid var(--line);font-size:11px;color:var(--muted);display:flex;justify-content:space-between;gap:8px}',
    '@keyframes hbin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '@media (max-width:820px){html.hb-on:not([data-view="privacy"]):not([data-view="terms"]) .hb{grid-template-columns:minmax(0,1fr);align-items:start;gap:22px}',
    '  .hb-body{grid-template-columns:minmax(0,1fr)}.hb-nav{flex-direction:row;flex-wrap:wrap;border-right:0;border-bottom:1px solid var(--line)}}',
    '@media (prefers-reduced-motion:reduce){.hb-role{animation:none}.hb-q .hb-caret{animation:none}.hb-form,.hb-chips{transition:none}}'
  ].join('\n');
  document.head.appendChild(css);

  var root = el('section', 'hb');
  root.setAttribute('aria-label', 'Set up your own platform');
  var chat = el('div', 'hb-chat');
  var past = el('div', 'hb-past');
  past.setAttribute('aria-hidden', 'true');
  var q = el('h1', 'hb-q');
  q.setAttribute('aria-live', 'polite');
  var note = el('p', 'hb-note');
  note.setAttribute('aria-live', 'polite');
  var ctl = el('div');
  chat.appendChild(past); chat.appendChild(q); chat.appendChild(note); chat.appendChild(ctl);

  var prev = el('aside', 'hb-prev');
  prev.setAttribute('aria-label', 'Preview of your platform');
  var tag = el('div', 'hb-tag', 'Your platform, live preview');
  var app = el('div', 'hb-app');
  var bar = el('div', 'hb-bar');
  var logo = el('span', 'hb-logo', 'CR');
  var nm = el('b', null);
  var nmPh = el('span', 'ph', 'Your business');
  nm.appendChild(nmPh);
  bar.appendChild(logo); bar.appendChild(nm);
  var body = el('div', 'hb-body');
  var nav = el('div', 'hb-nav');
  MENU.forEach(function (m) { nav.appendChild(el('i', null, m)); });
  var main = el('div', 'hb-main');
  body.appendChild(nav); body.appendChild(main);
  var foot = el('div', 'hb-foot');
  foot.appendChild(el('span', null, 'Preview only. Nothing is saved.'));
  foot.appendChild(el('span', null, 'Powered by Clever Role'));
  app.appendChild(bar); app.appendChild(body); app.appendChild(foot);
  prev.appendChild(tag); prev.appendChild(app);
  root.appendChild(chat); root.appendChild(prev);
  top.insertAdjacentElement('afterend', root);
  document.documentElement.classList.add('hb-on');

  /* ---------- preview ---------- */
  function onColour(hex) {
    var h = hex.replace('#', ''), r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    function f(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    var L = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    return L > 0.4 ? '#0a0a0a' : '#ffffff';
  }
  function paint() {
    if (S.colour) { app.style.setProperty('--b', S.colour); app.style.setProperty('--on', onColour(S.colour)); app.classList.add('has-b'); }
    nm.textContent = '';
    if (S.company) nm.textContent = S.company; else nm.appendChild(nmPh);
    logo.textContent = '';
    if (S.logo) { var im = new Image(); im.alt = ''; im.src = S.logo; logo.appendChild(im); }
    else logo.textContent = S.company ? S.company.charAt(0).toUpperCase() : 'CR';
    main.textContent = '';
    main.appendChild(el('h4', null, S.name ? 'Hello, ' + S.name : 'Hello'));
    var t = TYPES[S.type];
    if (!t) { main.appendChild(el('div', 'hb-empty', 'Your Roles will appear here as we go.')); return; }
    t.roles.forEach(function (r, i) {
      var d = el('div', 'hb-role'); d.style.animationDelay = (i * 90) + 'ms';
      var w = el('div'); w.appendChild(el('b', null, r)); w.appendChild(el('span', null, ROLE_LINE[r]));
      d.appendChild(w); main.appendChild(d);
    });
  }

  /* ---------- typing ---------- */
  var typer = 0;
  function type(node, text, done) {
    clearInterval(typer);
    node.textContent = '';
    if (reduce) { node.textContent = text; if (done) done(); return; }
    var i = 0, caret = el('span', 'hb-caret');
    node.appendChild(caret);
    typer = setInterval(function () {
      i++;
      node.textContent = text.slice(0, i); node.appendChild(caret);
      if (i >= text.length) { clearInterval(typer); caret.remove(); if (done) done(); }
    }, 22);
  }

  /* ---------- running a step ---------- */
  var idx = 0;
  function addPast(question, answer) {
    var d = el('div'); d.appendChild(document.createTextNode(question + ' ')); d.appendChild(el('b', null, answer));
    past.appendChild(d);
    while (past.children.length > 2) past.removeChild(past.firstChild);
  }
  function clean(v, max) { return String(v || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 80); }

  function show(i) {
    idx = i;
    var s = STEPS[i], text = s.ask();
    ctl.textContent = ''; note.textContent = '';
    var shown = false;
    function reveal() { if (shown) return; shown = true; buildControls(s); }
    q.style.fontSize = text.length > 90 ? 'clamp(21px,2.8vw,30px)' : '';
    type(q, text, reveal);
    q.onclick = function () { clearInterval(typer); q.textContent = text; reveal(); };
  }

  function advance(s, display, value) {
    var asked = s.ask();
    s.take(value);
    paint();
    var shortQ = asked.length > 70 ? asked.slice(0, 67) + '…' : asked;
    addPast(shortQ, display);
    var next = function () {
      if (s.id === 'offer' && value === 'Not right now') { endEarly(); return; }
      show(idx + 1);
    };
    if (s.reply) {
      ctl.textContent = '';
      type(note, s.reply(value), function () { setTimeout(next, reduce ? 0 : 900); });
    } else next();
  }

  function endEarly() {
    ctl.textContent = ''; idx = -1;
    type(q, 'No problem, ' + S.name + '. Have a look around, and come back any time.', function () {
      var row = el('div', 'hb-end');
      var b = el('button', 'hb-btn', 'Start again'); b.type = 'button';
      b.onclick = restart; row.appendChild(b); ctl.appendChild(row); b.focus();
    });
  }
  function restart() {
    S = { name: '', need: '', company: '', type: '', colour: '', logo: '' };
    past.textContent = ''; paint(); app.classList.remove('has-b'); app.style.removeProperty('--b');
    show(0);
  }

  function buildControls(s) {
    ctl.textContent = '';
    if (s.kind === 'text') {
      var form = el('form', 'hb-form'); form.noValidate = true;
      var inp = el('input', 'hb-in'); inp.type = 'text'; inp.maxLength = s.max || 80; inp.placeholder = s.ph || '';
      inp.setAttribute('aria-label', s.ask()); inp.autocomplete = s.id === 'name' ? 'given-name' : s.id === 'company' ? 'organization' : 'off';
      var go = el('button', 'hb-btn go', 'Continue'); go.type = 'submit';
      form.appendChild(inp); form.appendChild(go); ctl.appendChild(form);
      form.onsubmit = function (e) { e.preventDefault(); var v = clean(inp.value, s.max); if (!v) { inp.focus(); return; } advance(s, v, v); };
      requestAnimationFrame(function () { form.classList.add('show'); inp.focus(); });
      if (s.chips) {
        var cr = el('div', 'hb-chips');
        s.chips.forEach(function (c) { var b = el('button', 'hb-btn', c); b.type = 'button'; b.onclick = function () { advance(s, c, c); }; cr.appendChild(b); });
        ctl.appendChild(cr); requestAnimationFrame(function () { cr.classList.add('show'); });
      }
    } else if (s.kind === 'choice') {
      var row = el('div', 'hb-chips');
      s.options.forEach(function (o, k) { var b = el('button', 'hb-btn' + (k === 0 && s.id === 'offer' ? ' go' : ''), o); b.type = 'button'; b.onclick = function () { advance(s, o, o); }; row.appendChild(b); });
      ctl.appendChild(row); requestAnimationFrame(function () { row.classList.add('show'); var f = row.querySelector('button'); if (f) f.focus(); });
    } else if (s.kind === 'colour') {
      var sw = el('div', 'hb-sw');
      SWATCHES.forEach(function (c) {
        var b = el('button'); b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', 'Colour ' + c);
        b.onmouseenter = b.onfocus = function () { S.colour = c; paint(); };
        b.onclick = function () { advance(s, 'Chosen', c); }; sw.appendChild(b);
      });
      var lab = el('label'); var ci = el('input'); ci.type = 'color'; ci.value = SWATCHES[0]; ci.setAttribute('aria-label', 'Choose any colour');
      ci.oninput = function () { S.colour = ci.value; paint(); };
      ci.onchange = function () { advance(s, 'Chosen', ci.value); };
      lab.appendChild(ci); lab.appendChild(document.createTextNode('Any colour'));
      sw.appendChild(lab);
      var sk = el('button', 'hb-btn', 'Use ours'); sk.type = 'button'; sk.onclick = function () { advance(s, 'Clever Role grey', '#8a8c8c'); };
      ctl.appendChild(sw); ctl.appendChild(el('div')).appendChild(sk);
    } else if (s.kind === 'logo') {
      var fr = el('div', 'hb-end');
      var fi = el('input'); fi.type = 'file'; fi.accept = 'image/png,image/jpeg,image/svg+xml,image/webp'; fi.hidden = true; fi.setAttribute('aria-label', 'Choose your logo');
      var pick = el('button', 'hb-btn go', 'Choose a picture'); pick.type = 'button'; pick.onclick = function () { fi.click(); };
      var skip = el('button', 'hb-btn', 'Skip for now'); skip.type = 'button'; skip.onclick = function () { advance(s, 'Skipped', ''); };
      var warn = el('p', 'hb-small'); warn.setAttribute('role', 'status');
      fi.onchange = function () {
        var f = fi.files && fi.files[0];
        if (!f) return;
        if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(f.type) || f.size > 2 * 1024 * 1024) { warn.textContent = 'Please choose a PNG, JPG, SVG or WebP picture under 2 MB.'; return; }
        var rd = new FileReader();
        rd.onload = function () { advance(s, 'Added', String(rd.result)); };
        rd.onerror = function () { warn.textContent = 'We could not read that picture. You can skip this and add it later.'; };
        rd.readAsDataURL(f);
      };
      fr.appendChild(pick); fr.appendChild(skip); fr.appendChild(fi);
      ctl.appendChild(fr); ctl.appendChild(warn);
    } else if (s.kind === 'end') {
      var er = el('div', 'hb-end');
      var a = el('a', 'hb-btn go', 'Create my account'); a.href = SIGNUP_URL; a.rel = 'noopener';
      var again = el('button', 'hb-btn', 'Start again'); again.type = 'button'; again.onclick = restart;
      er.appendChild(a); er.appendChild(again); ctl.appendChild(er);
      ctl.appendChild(el('p', 'hb-small', 'Your answers are not saved or sent anywhere.'));
    }
  }

  paint();
  show(0);
})();
