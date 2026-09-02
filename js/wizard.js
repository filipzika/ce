/* Engine a UI průvodce. Čte data z window.WIZARD (viz wizard-data.js) a vykresluje
   otázky/report do #wizardRoot. Bez závislostí, bez frameworku. */

(function () {
  'use strict';

  var root = document.getElementById('wizardRoot');
  if (!root || !window.WIZARD) return;

  var WIZARD = window.WIZARD;
  var Q = WIZARD.questions;

  var state = {
    history: ['category'],
    answers: {},
    pendingMulti: null, // rozpracovaný multi-select výběr před potvrzením
    finished: false
  };

  // ---- Pomocné funkce -----------------------------------------------------

  function currentQid() {
    return state.history[state.history.length - 1];
  }

  function ruleFor(key) {
    return WIZARD.rules[key] || {};
  }

  function mergeCoded(map, item) {
    if (!item || !item.code) return;
    var existing = map.get(item.code);
    if (existing) {
      if (item.reason && existing.reasons.indexOf(item.reason) === -1) {
        existing.reasons.push(item.reason);
      }
    } else {
      var copy = {};
      for (var k in item) if (Object.prototype.hasOwnProperty.call(item, k)) copy[k] = item[k];
      copy.reasons = item.reason ? [item.reason] : [];
      map.set(item.code, copy);
    }
  }

  function applyRule(acc, rule) {
    if (!rule) return;
    (rule.markings || []).forEach(function (m) { mergeCoded(acc.markings, m); });
    (rule.directives || []).forEach(function (d) { mergeCoded(acc.directives, d); });
    (rule.standards || []).forEach(function (s) { mergeCoded(acc.standards, s); });
    (rule.docs || []).forEach(function (d) { mergeCoded(acc.docs, d); });
    (rule.notes || []).forEach(function (n) { acc.notes.push(n); });
    if (rule.flags) {
      for (var f in rule.flags) {
        if (Object.prototype.hasOwnProperty.call(rule.flags, f)) acc.flags[f] = rule.flags[f];
      }
    }
  }

  function buildReport() {
    var acc = {
      markings: new Map(),
      directives: new Map(),
      standards: new Map(),
      docs: new Map(),
      notes: [],
      flags: {}
    };

    applyRule(acc, WIZARD.rules.universal);

    state.history.forEach(function (qid) {
      var val = state.answers[qid];
      if (val == null) return;
      if (Array.isArray(val)) {
        val.forEach(function (v) { applyRule(acc, ruleFor(qid + '.' + v)); });
      } else {
        applyRule(acc, ruleFor(qid + '.' + val));
      }
    });

    if (acc.flags.gpsrApplies) applyRule(acc, WIZARD.rules.gpsr);

    if (acc.flags.redApplies && acc.directives.has('2014/35/EU')) {
      var lvd = acc.directives.get('2014/35/EU');
      lvd.suppressed = true;
    }

    return acc;
  }

  // ---- Navigace -----------------------------------------------------------

  function selectSingle(qid, value) {
    state.answers[qid] = value;
    var next = Q[qid].next(state.answers);
    if (next) {
      state.history.push(next);
    } else {
      state.finished = true;
    }
    render();
  }

  function confirmMulti(qid) {
    var sel = state.pendingMulti || [];
    if (sel.length === 0) return;
    state.answers[qid] = sel.slice();
    state.pendingMulti = null;
    var next = Q[qid].next(state.answers);
    if (next) {
      state.history.push(next);
    } else {
      state.finished = true;
    }
    render();
  }

  function toggleMultiOption(value) {
    if (!state.pendingMulti) state.pendingMulti = [];
    var idx = state.pendingMulti.indexOf(value);
    if (idx === -1) state.pendingMulti.push(value);
    else state.pendingMulti.splice(idx, 1);
    render();
  }

  function goBack() {
    if (state.finished) {
      state.finished = false;
      render();
      return;
    }
    if (state.history.length <= 1) return;
    var popped = state.history.pop();
    delete state.answers[popped];
    state.pendingMulti = null;
    render();
  }

  function restart() {
    state.history = ['category'];
    state.answers = {};
    state.pendingMulti = null;
    state.finished = false;
    render();
  }

  // ---- Rendering ------------------------------------------------------------

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      if (attrs[k] == null) continue;
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else e.appendChild(c);
    });
    return e;
  }

  var OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function renderProgress(qid) {
    var slot = Q[qid].slot;
    var pct = Math.round((slot / WIZARD.totalSlots) * 100);
    var wrap = el('div', { class: 'mb-8' }, [
      el('div', { class: 'flex items-center justify-between mb-2 font-mono text-xs uppercase tracking-widest text-slate-500' }, [
        el('span', {}, ['Krok ' + slot + ' z ' + WIZARD.totalSlots]),
        el('span', {}, [pct + '%'])
      ]),
      el('div', { class: 'h-1.5 w-full rounded-full bg-slate-200 overflow-hidden' }, [
        el('div', { class: 'h-full rounded-full bg-indigo-600 transition-all duration-300', style: 'width:' + pct + '%' })
      ])
    ]);
    return wrap;
  }

  function renderQuestion(qid) {
    var q = Q[qid];
    var container = el('div', { class: 'animate-fadein', 'aria-live': 'polite' });
    container.appendChild(renderProgress(qid));

    container.appendChild(el('h2', { class: 'text-xl sm:text-2xl font-semibold text-slate-900 mb-2' }, [q.title]));
    if (q.help) container.appendChild(el('p', { class: 'text-sm text-slate-500 mb-6' }, [q.help]));
    else container.appendChild(el('div', { class: 'mb-4' }));

    var optionsWrap = el('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-3' });

    if (q.type === 'multi') {
      var sel = state.pendingMulti || state.answers[qid] || [];
      if (!state.pendingMulti && state.answers[qid]) state.pendingMulti = state.answers[qid].slice();
      q.options.forEach(function (opt, i) {
        var isSelected = (state.pendingMulti || []).indexOf(opt.value) !== -1;
        optionsWrap.appendChild(renderOptionButton(opt, i, isSelected, function () { toggleMultiOption(opt.value); }, true));
      });
      container.appendChild(optionsWrap);

      var canContinue = (state.pendingMulti || []).length > 0;
      container.appendChild(el('div', { class: 'mt-6 flex justify-end' }, [
        el('button', {
          class: 'px-5 py-2.5 rounded-lg font-medium text-sm transition ' +
            (canContinue ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'),
          disabled: canContinue ? null : 'disabled',
          onclick: function () { if (canContinue) confirmMulti(qid); }
        }, ['Pokračovat →'])
      ]));
    } else {
      q.options.forEach(function (opt, i) {
        optionsWrap.appendChild(renderOptionButton(opt, i, state.answers[qid] === opt.value, function () { selectSingle(qid, opt.value); }, false));
      });
      container.appendChild(optionsWrap);
    }

    container.appendChild(renderControls());
    return container;
  }

  function renderOptionButton(opt, index, isSelected, onClick, isCheckbox) {
    var letter = OPTION_LETTERS[index] || String(index + 1);
    var btn = el('button', {
      type: 'button',
      class: 'text-left rounded-xl border-2 p-4 transition flex items-start gap-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 ' +
        (isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'),
      'aria-pressed': isSelected ? 'true' : 'false',
      onclick: onClick
    }, [
      el('span', {
        class: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ' +
          (isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500')
      }, [letter]),
      el('span', { class: 'flex-1' }, [
        el('span', { class: 'block font-medium text-slate-900' }, [opt.label]),
        opt.desc ? el('span', { class: 'block text-sm text-slate-500 mt-0.5' }, [opt.desc]) : null
      ])
    ]);
    return btn;
  }

  function renderControls() {
    var canGoBack = state.history.length > 1;
    return el('div', { class: 'mt-8 flex items-center justify-between border-t border-slate-100 pt-5' }, [
      el('button', {
        type: 'button',
        class: 'text-sm font-medium ' + (canGoBack ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 cursor-not-allowed'),
        disabled: canGoBack ? null : 'disabled',
        onclick: function () { if (canGoBack) goBack(); }
      }, ['← Zpět']),
      el('button', {
        type: 'button',
        class: 'text-sm font-medium text-slate-400 hover:text-slate-600',
        onclick: restart
      }, ['Začít znovu'])
    ]);
  }

  // ---- Report ---------------------------------------------------------------

  function noteClasses(level) {
    return level === 'warning'
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : 'border-sky-200 bg-sky-50 text-sky-900';
  }

  function renderReport() {
    var acc = buildReport();
    var container = el('div', { class: 'animate-fadein' });

    container.appendChild(el('div', { class: 'flex items-center justify-between mb-1' }, [
      el('span', { class: 'font-mono text-xs uppercase tracking-widest text-indigo-600' }, ['Výsledný přehled']),
      el('span', { class: 'text-xs text-slate-400' }, [new Date().toLocaleDateString('cs-CZ')])
    ]));
    container.appendChild(el('h2', { class: 'text-2xl font-semibold text-slate-900 mb-3' }, ['Certifikace, směrnice a dokumentace']));

    container.appendChild(el('div', { class: 'mb-6 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500' }, [
      el('span', { class: 'inline-flex items-center gap-1.5' }, [
        el('span', { class: 'inline-block h-2.5 w-2.5 rounded-full bg-amber-400' }),
        'Vyžaduje laboratorní testování / zkoušení zařízení'
      ]),
      el('span', { class: 'inline-flex items-center gap-1.5' }, [
        el('span', { class: 'inline-block h-2.5 w-2.5 rounded-full bg-slate-300' }),
        'Pouze dokumentace / prohlášení, bez zkoušení'
      ])
    ]));

    if (acc.flags.sectorDisclaimer) {
      container.appendChild(el('div', { class: 'mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900' }, [
        el('strong', { class: 'block mb-1' }, ['Upozornění na sektorový rámec']),
        WIZARD.sectorDisclaimerLabels[acc.flags.sectorDisclaimer] || ''
      ]));
    }

    // Vaše odpovědi
    container.appendChild(reportSection('Vaše odpovědi', renderAnswersRecap()));

    // Označení
    container.appendChild(reportSection('Označení / certifikace', renderMarkings(acc.markings)));

    // Směrnice
    container.appendChild(reportSection('Směrnice a nařízení EU', renderDirectives(acc.directives)));

    // Normy
    container.appendChild(reportSection('Harmonizované normy', renderStandards(acc.standards)));

    // Dokumentace
    container.appendChild(reportSection('Povinná dokumentace', renderDocs(acc.docs)));

    // Poznámky
    if (acc.notes.length) {
      var notesWrap = el('div', { class: 'space-y-3' });
      acc.notes.forEach(function (n) {
        notesWrap.appendChild(el('div', { class: 'rounded-lg border p-3 text-sm ' + noteClasses(n.level) }, [n.text]));
      });
      container.appendChild(reportSection('Poznámky a doporučení', notesWrap));
    }

    container.appendChild(el('p', { class: 'mt-4 text-xs text-slate-400 leading-relaxed' }, [
      'Toto je zjednodušený orientační přehled a nenahrazuje odborné právní posouzení. U konkrétní verze normy vždy ověřte aktuální seznam harmonizovaných norem zveřejněný v Úředním věstníku EU. Pro trhy mimo EU (např. Velká Británie — UKCA) mohou platit odlišné požadavky, které tento přehled nezahrnuje.'
    ]));

    container.appendChild(el('div', { class: 'wizard-export mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6' }, [
      el('button', {
        type: 'button',
        class: 'px-5 py-2.5 rounded-lg font-medium text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition',
        onclick: function () { window.print(); }
      }, ['Stáhnout PDF (tisk)']),
      el('button', {
        type: 'button',
        class: 'px-5 py-2.5 rounded-lg font-medium text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition',
        onclick: function () { exportTxt(acc); }
      }, ['Stáhnout TXT']),
      el('button', {
        type: 'button',
        class: 'px-5 py-2.5 rounded-lg font-medium text-sm text-slate-500 hover:text-slate-700 transition',
        onclick: goBack
      }, ['← Upravit odpovědi']),
      el('button', {
        type: 'button',
        class: 'px-5 py-2.5 rounded-lg font-medium text-sm text-slate-500 hover:text-slate-700 transition',
        onclick: restart
      }, ['Začít znovu'])
    ]));

    return container;
  }

  function reportSection(title, contentEl) {
    return el('section', { class: 'report-group mb-8' }, [
      el('h3', { class: 'font-mono text-xs uppercase tracking-widest text-slate-500 mb-3' }, [title]),
      contentEl
    ]);
  }

  function renderAnswersRecap() {
    var list = el('dl', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm' });
    state.history.forEach(function (qid) {
      var val = state.answers[qid];
      if (val == null) return;
      var q = Q[qid];
      var labels = Array.isArray(val)
        ? val.map(function (v) { return labelFor(q, v); }).join(', ')
        : labelFor(q, val);
      list.appendChild(el('div', { class: 'contents' }, [
        el('dt', { class: 'text-slate-400' }, [q.title]),
        el('dd', { class: 'text-slate-800 font-medium mb-2' }, [labels])
      ]));
    });
    return list;
  }

  function labelFor(q, value) {
    var opt = q.options.filter(function (o) { return o.value === value; })[0];
    return opt ? opt.label : value;
  }

  function renderMarkings(map) {
    if (map.size === 0) return emptyNote();
    var wrap = el('div', { class: 'flex flex-wrap gap-2' });
    map.forEach(function (m) {
      wrap.appendChild(el('span', { class: 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm' }, [
        el('span', { class: 'font-mono font-semibold text-indigo-700' }, [m.code]),
        el('span', { class: 'text-slate-600' }, [m.label])
      ]));
    });
    return wrap;
  }

  function verificationBadge(item) {
    if (!item.verification) return null;
    var isTest = item.verification === 'test';
    return el('span', {
      class: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
        (isTest ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'),
      title: item.verificationNote || ''
    }, [isTest ? 'Vyžaduje testování' : 'Pouze dokumentace']);
  }

  function renderDirectives(map) {
    if (map.size === 0) return emptyNote();
    var wrap = el('div', { class: 'space-y-2' });
    map.forEach(function (d) {
      wrap.appendChild(el('div', {
        class: 'rounded-lg border p-3 text-sm ' + (d.suppressed ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-slate-200 bg-white')
      }, [
        el('div', { class: 'flex items-center gap-2 flex-wrap' }, [
          el('span', { class: 'font-mono font-semibold text-indigo-700' }, [d.code]),
          el('span', { class: 'font-medium text-slate-900' }, [d.name]),
          verificationBadge(d),
          d.suppressed ? el('span', { class: 'text-xs font-medium text-slate-500 rounded-full bg-slate-200 px-2 py-0.5' }, ['pokryto v rámci RED']) : null
        ]),
        el('div', { class: 'text-slate-500 mt-1' }, [(d.reasons || []).join('; ')]),
        d.verificationNote ? el('div', { class: 'text-slate-400 mt-1 text-xs' }, [d.verificationNote]) : null
      ]));
    });
    return wrap;
  }

  function renderStandards(map) {
    if (map.size === 0) return emptyNote();
    var byCategory = {};
    map.forEach(function (s) {
      var cat = s.category || 'other';
      (byCategory[cat] = byCategory[cat] || []).push(s);
    });
    var wrap = el('div', { class: 'space-y-5' });
    Object.keys(byCategory).forEach(function (cat) {
      var label = WIZARD.standardCategoryLabels[cat] || cat;
      var group = el('div', {}, [
        el('h4', { class: 'text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2' }, [label]),
        el('div', { class: 'space-y-2' }, byCategory[cat].map(function (s) {
          return el('div', { class: 'rounded-lg border border-slate-200 bg-white p-3 text-sm' }, [
            el('div', { class: 'flex items-center gap-2 flex-wrap' }, [
              el('span', { class: 'font-mono font-semibold text-indigo-700' }, [s.code]),
              el('span', { class: 'text-slate-600' }, [s.name]),
              verificationBadge(s)
            ]),
            s.verificationNote ? el('div', { class: 'text-slate-400 mt-1 text-xs' }, [s.verificationNote]) : null
          ]);
        }))
      ]);
      wrap.appendChild(group);
    });
    return wrap;
  }

  function renderDocs(map) {
    if (map.size === 0) return emptyNote();
    var wrap = el('ul', { class: 'space-y-2' });
    map.forEach(function (d) {
      wrap.appendChild(el('li', { class: 'flex items-start gap-2 text-sm' }, [
        el('span', { class: 'mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500' }),
        el('span', { class: 'text-slate-700' }, [d.text, d.conditional ? el('span', { class: 'ml-1 text-xs text-slate-400' }, ['(podmíněně)']) : null])
      ]));
    });
    return wrap;
  }

  function emptyNote() {
    return el('p', { class: 'text-sm text-slate-400' }, ['— žádné položky —']);
  }

  // ---- Export TXT -------------------------------------------------------------

  function verificationTag(item) {
    if (!item.verification) return '';
    return item.verification === 'test' ? ' [TESTOVÁNÍ]' : ' [DOKUMENTACE]';
  }

  function exportTxt(acc) {
    var lines = [];
    lines.push('EU CERTIFIKACE — VÝSLEDNÝ PŘEHLED');
    lines.push('Vygenerováno: ' + new Date().toLocaleString('cs-CZ'));
    lines.push('');

    if (acc.flags.sectorDisclaimer) {
      lines.push('UPOZORNĚNÍ: ' + (WIZARD.sectorDisclaimerLabels[acc.flags.sectorDisclaimer] || ''));
      lines.push('');
    }

    lines.push('VAŠE ODPOVĚDI');
    lines.push('-------------');
    state.history.forEach(function (qid) {
      var val = state.answers[qid];
      if (val == null) return;
      var q = Q[qid];
      var labels = Array.isArray(val) ? val.map(function (v) { return labelFor(q, v); }).join(', ') : labelFor(q, val);
      lines.push('- ' + q.title + ': ' + labels);
    });
    lines.push('');

    lines.push('OZNAČENÍ / CERTIFIKACE');
    lines.push('-----------------------');
    acc.markings.forEach(function (m) { lines.push('- ' + m.code + ' — ' + m.label); });
    lines.push('');

    lines.push('SMĚRNICE A NAŘÍZENÍ EU');
    lines.push('-----------------------');
    lines.push('(u každé položky: [TESTOVÁNÍ] = vyžaduje laboratorní zkoušení zařízení, [DOKUMENTACE] = pouze dokumentace/prohlášení)');
    acc.directives.forEach(function (d) {
      lines.push('- ' + d.code + ' — ' + d.name + verificationTag(d) + (d.suppressed ? ' [pokryto v rámci RED]' : ''));
      (d.reasons || []).forEach(function (r) { lines.push('    ' + r); });
      if (d.verificationNote) lines.push('    ' + d.verificationNote);
    });
    lines.push('');

    lines.push('HARMONIZOVANÉ NORMY');
    lines.push('--------------------');
    acc.standards.forEach(function (s) {
      lines.push('- ' + s.code + ' — ' + s.name + verificationTag(s));
      if (s.verificationNote) lines.push('    ' + s.verificationNote);
    });
    lines.push('');

    lines.push('POVINNÁ DOKUMENTACE');
    lines.push('--------------------');
    acc.docs.forEach(function (d) { lines.push('- ' + d.text + (d.conditional ? ' (podmíněně)' : '')); });
    lines.push('');

    if (acc.notes.length) {
      lines.push('POZNÁMKY A DOPORUČENÍ');
      lines.push('----------------------');
      acc.notes.forEach(function (n) { lines.push('- [' + (n.level === 'warning' ? 'POZOR' : 'INFO') + '] ' + n.text); });
      lines.push('');
    }

    lines.push('Zjednodušený orientační přehled — nenahrazuje odborné právní posouzení.');

    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'eu-certifikace-prehled.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Hlavní render ----------------------------------------------------------

  function render() {
    root.innerHTML = '';
    if (state.finished) {
      root.appendChild(renderReport());
    } else {
      root.appendChild(renderQuestion(currentQid()));
    }
  }

  render();
})();
