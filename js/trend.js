// ============================================================
// trend.js — Diagrama de tempo (timing diagram) das tags
// Mostra a evolução ON/OFF das variáveis monitoradas ao longo
// dos últimos scans, como um osciloscópio digital.
// ============================================================

'use strict';

const Trend = {
  svgEl:      null,
  maxSamples: 60,   // quantos scans ficam visíveis no gráfico
  maxWatched: 6,    // limite de tags monitoradas ao mesmo tempo
  watched:    [],   // ordem das tags monitoradas
  history:    {},   // tag -> array de booleans (mais antigo primeiro)

  init(svgId) {
    this.svgEl = document.getElementById(svgId);
    this.render();
  },

  isWatched(tag) { return this.watched.includes(tag); },

  toggle(tag) {
    if (this.isWatched(tag)) this.unwatch(tag);
    else                     this.watch(tag);
  },

  watch(tag) {
    if (this.isWatched(tag) || this.watched.length >= this.maxWatched) return;
    this.watched.push(tag);
    this.history[tag] = [];
    this.render();
  },

  unwatch(tag) {
    this.watched = this.watched.filter(t => t !== tag);
    delete this.history[tag];
    this.render();
  },

  clear() {
    this.watched.forEach(tag => { this.history[tag] = []; });
    this.render();
  },

  // Chamado a cada scan (manual ou automático) para registrar amostra
  sample() {
    if (this.watched.length === 0) return;
    const { State } = window.LadderEngine;
    this.watched.forEach(tag => {
      const arr = this.history[tag] || (this.history[tag] = []);
      arr.push(State.get(tag));
      if (arr.length > this.maxSamples) arr.shift();
    });
    this.render();
  },

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  render() {
    if (!this.svgEl) return;

    const hint = document.getElementById('trend-hint');
    if (hint) hint.style.display = this.watched.length ? 'none' : 'block';

    if (this.watched.length === 0) {
      this.svgEl.innerHTML = '';
      this.svgEl.setAttribute('height', 0);
      return;
    }

    const rowH   = 36;
    const labelW = 88;
    const width  = Math.max(300, (this.svgEl.clientWidth || 600));
    const plotW  = width - labelW - 16;
    const stepW  = plotW / this.maxSamples;

    let svg = '';
    this.watched.forEach((tag, i) => {
      const y      = i * rowH;
      const highY  = y + 8;
      const lowY   = y + 28;
      const forced = window.LadderEngine.State.isForced(tag);
      const arr    = this.history[tag] || [];

      let d = '';
      arr.forEach((val, idx) => {
        const x0 = labelW + idx * stepW;
        const x1 = x0 + stepW;
        const lvl = val ? highY : lowY;
        d += (idx === 0 ? `M${x0} ${lvl} ` : `L${x0} ${lvl} `);
        d += `L${x1} ${lvl} `;
      });

      svg += `
        <text x="0" y="${y + 21}" class="trend-label">${tag}${forced ? ' 🔒' : ''}</text>
        <line x1="${labelW}" y1="${y + 4}"  x2="${width}" y2="${y + 4}"  class="trend-grid"/>
        <line x1="${labelW}" y1="${y + 32}" x2="${width}" y2="${y + 32}" class="trend-grid"/>
        <path d="${d}" class="trend-line${forced ? ' forced' : ''}"/>
      `;
    });

    this.svgEl.setAttribute('height', this.watched.length * rowH + 8);
    this.svgEl.innerHTML = svg;
  }
};

window.LadderTrend = Trend;

