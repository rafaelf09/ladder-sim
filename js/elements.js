// elements.js — Desenho SVG de cada elemento Ladder
// Nota: CELL_W, CELL_H, MID são definidos em editor.js

'use strict';

const Elements = {

  NO(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    return `
      <g class="${cls}">
        <line x1="${x}"           y1="${y+MID}" x2="${x+20}"         y2="${y+MID}" class="wire"/>
        <line x1="${x+20}"        y1="${y+10}"  x2="${x+20}"         y2="${y+50}"  class="contact"/>
        <line x1="${x+CELL_W-20}" y1="${y+10}"  x2="${x+CELL_W-20}" y2="${y+50}"  class="contact"/>
        <line x1="${x+CELL_W-20}" y1="${y+MID}" x2="${x+CELL_W}"    y2="${y+MID}" class="wire"/>
        <text x="${x+CELL_W/2}" y="${y+8}" class="tag">${tag}</text>
      </g>`;
  },

  NC(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    return `
      <g class="${cls}">
        <line x1="${x}"           y1="${y+MID}" x2="${x+20}"         y2="${y+MID}" class="wire"/>
        <line x1="${x+20}"        y1="${y+10}"  x2="${x+20}"         y2="${y+50}"  class="contact"/>
        <line x1="${x+CELL_W-20}" y1="${y+10}"  x2="${x+CELL_W-20}" y2="${y+50}"  class="contact"/>
        <line x1="${x+20}"        y1="${y+50}"  x2="${x+CELL_W-20}" y2="${y+10}"  class="contact"/>
        <line x1="${x+CELL_W-20}" y1="${y+MID}" x2="${x+CELL_W}"    y2="${y+MID}" class="wire"/>
        <text x="${x+CELL_W/2}" y="${y+8}" class="tag">${tag}</text>
      </g>`;
  },

  COIL(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    const cy = y + MID;
    return `
      <g class="${cls}">
        <line x1="${x}"     y1="${cy}" x2="${cx-16}"     y2="${cy}" class="wire"/>
        <circle cx="${cx}" cy="${cy}" r="16" class="coil"/>
        <line x1="${cx+16}" y1="${cy}" x2="${x+CELL_W}" y2="${cy}" class="wire"/>
        <text x="${cx}" y="${y+8}" class="tag">${tag}</text>
      </g>`;
  },

  COIL_NEG(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    const cy = y + MID;
    return `
      <g class="${cls}">
        <line x1="${x}"     y1="${cy}" x2="${cx-16}"     y2="${cy}" class="wire"/>
        <circle cx="${cx}" cy="${cy}" r="16" class="coil"/>
        <line x1="${cx-8}"  y1="${cy+10}" x2="${cx+8}" y2="${cy-10}" class="contact"/>
        <line x1="${cx+16}" y1="${cy}" x2="${x+CELL_W}" y2="${cy}" class="wire"/>
        <text x="${cx}" y="${y+8}" class="tag">${tag}</text>
      </g>`;
  },

  SET(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    const cy = y + MID;
    return `
      <g class="${cls}">
        <line x1="${x}"     y1="${cy}" x2="${cx-16}"     y2="${cy}" class="wire"/>
        <circle cx="${cx}" cy="${cy}" r="16" class="coil"/>
        <text x="${cx}" y="${cy+5}" class="coil-label">S</text>
        <line x1="${cx+16}" y1="${cy}" x2="${x+CELL_W}" y2="${cy}" class="wire"/>
        <text x="${cx}" y="${y+8}" class="tag">${tag}</text>
      </g>`;
  },

  RESET(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    const cy = y + MID;
    return `
      <g class="${cls}">
        <line x1="${x}"     y1="${cy}" x2="${cx-16}"     y2="${cy}" class="wire"/>
        <circle cx="${cx}" cy="${cy}" r="16" class="coil"/>
        <text x="${cx}" y="${cy+5}" class="coil-label">R</text>
        <line x1="${cx+16}" y1="${cy}" x2="${x+CELL_W}" y2="${cy}" class="wire"/>
        <text x="${cx}" y="${y+8}" class="tag">${tag}</text>
      </g>`;
  },

  TON(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    return `
      <g class="${cls}">
        <line x1="${x}"           y1="${y+MID}" x2="${x+14}"          y2="${y+MID}" class="wire"/>
        <rect x="${x+14}"         y="${y+8}"    width="${CELL_W-28}"   height="${CELL_H-16}" rx="3" class="block-rect"/>
        <text x="${cx}" y="${y+27}" class="block-label">TON</text>
        <text x="${cx}" y="${y+41}" class="block-label">${tag}</text>
        <line x1="${x+CELL_W-14}" y1="${y+MID}" x2="${x+CELL_W}"      y2="${y+MID}" class="wire"/>
      </g>`;
  },

  CTU(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    return `
      <g class="${cls}">
        <line x1="${x}"           y1="${y+MID}" x2="${x+14}"          y2="${y+MID}" class="wire"/>
        <rect x="${x+14}"         y="${y+8}"    width="${CELL_W-28}"   height="${CELL_H-16}" rx="3" class="block-rect"/>
        <text x="${cx}" y="${y+27}" class="block-label">CTU</text>
        <text x="${cx}" y="${y+41}" class="block-label">${tag}</text>
        <line x1="${x+CELL_W-14}" y1="${y+MID}" x2="${x+CELL_W}"      y2="${y+MID}" class="wire"/>
      </g>`;
  },

  render(type, x, y, tag, energized) {
    if (typeof this[type] === 'function') {
      return this[type](x, y, tag, energized);
    }
    console.warn('Elemento não suportado:', type);
    return '';
  }
};

window.LadderElements = { Elements };
