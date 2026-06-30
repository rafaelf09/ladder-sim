// elements.js — Desenho SVG de cada elemento Ladder

const CELL_W = 80;   // largura de cada célula
const CELL_H = 60;   // altura de cada célula
const MID    = 30;   // linha do barramento (centro vertical)

const Elements = {

  // Linha horizontal de conexão (barramento entre elementos)
  wire(x, y) {
    return `<line x1="${x}" y1="${y + MID}" x2="${x + CELL_W}" y2="${y + MID}"
      class="wire" />`;
  },

  // Contato NA — ─┤ ├─
  NO(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    return `
      <g class="${cls}">
        <line x1="${x}"            y1="${y + MID}" x2="${x + 20}"          y2="${y + MID}" class="wire"/>
        <line x1="${x + 20}"       y1="${y + 10}"  x2="${x + 20}"          y2="${y + 50}" class="contact"/>
        <line x1="${x + CELL_W - 20}" y1="${y + 10}"  x2="${x + CELL_W - 20}" y2="${y + 50}" class="contact"/>
        <line x1="${x + CELL_W - 20}" y1="${y + MID}" x2="${x + CELL_W}"   y2="${y + MID}" class="wire"/>
        <text x="${x + CELL_W / 2}" y="${y + 8}" class="tag">${tag}</text>
      </g>`;
  },

  // Contato NF — ─┤/├─
  NC(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    return `
      <g class="${cls}">
        <line x1="${x}"            y1="${y + MID}" x2="${x + 20}"          y2="${y + MID}" class="wire"/>
        <line x1="${x + 20}"       y1="${y + 10}"  x2="${x + 20}"          y2="${y + 50}" class="contact"/>
        <line x1="${x + CELL_W - 20}" y1="${y + 10}"  x2="${x + CELL_W - 20}" y2="${y + 50}" class="contact"/>
        <line x1="${x + 20}"       y1="${y + 50}"  x2="${x + CELL_W - 20}" y2="${y + 10}" class="contact"/>
        <line x1="${x + CELL_W - 20}" y1="${y + MID}" x2="${x + CELL_W}"   y2="${y + MID}" class="wire"/>
        <text x="${x + CELL_W / 2}" y="${y + 8}" class="tag">${tag}</text>
      </g>`;
  },

  // Bobina — ─( )─
  COIL(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    const cy = y + MID;
    return `
      <g class="${cls}">
        <line x1="${x}"      y1="${cy}" x2="${cx - 16}" y2="${cy}" class="wire"/>
        <circle cx="${cx}" cy="${cy}" r="16" class="coil"/>
        <line x1="${cx + 16}" y1="${cy}" x2="${x + CELL_W}" y2="${cy}" class="wire"/>
        <text x="${cx}" y="${y + 8}" class="tag">${tag}</text>
      </g>`;
  },

  // Bobina negada — ─(/)─
  COIL_NEG(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    const cy = y + MID;
    return `
      <g class="${cls}">
        <line x1="${x}"       y1="${cy}" x2="${cx - 16}" y2="${cy}" class="wire"/>
        <circle cx="${cx}" cy="${cy}" r="16" class="coil"/>
        <line x1="${cx - 8}"  y1="${cy + 10}" x2="${cx + 8}" y2="${cy - 10}" class="contact"/>
        <line x1="${cx + 16}" y1="${cy}" x2="${x + CELL_W}" y2="${cy}" class="wire"/>
        <text x="${cx}" y="${y + 8}" class="tag">${tag}</text>
      </g>`;
  },

  // Bobina SET
  SET(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    const cy = y + MID;
    return `
      <g class="${cls}">
        <line x1="${x}"       y1="${cy}" x2="${cx - 16}" y2="${cy}" class="wire"/>
        <circle cx="${cx}" cy="${cy}" r="16" class="coil"/>
        <text x="${cx}" y="${cy + 5}" class="coil-label">S</text>
        <line x1="${cx + 16}" y1="${cy}" x2="${x + CELL_W}" y2="${cy}" class="wire"/>
        <text x="${cx}" y="${y + 8}" class="tag">${tag}</text>
      </g>`;
  },

  // Bobina RESET
  RESET(x, y, tag, energized) {
    const cls = energized ? 'element energized' : 'element';
    const cx = x + CELL_W / 2;
    const cy = y + MID;
    return `
      <g class="${cls}">
        <line x1="${x}"       y1="${cy}" x2="${cx - 16}" y2="${cy}" class="wire"/>
        <circle cx="${cx}" cy="${cy}" r="16" class="coil"/>
        <text x="${cx}" y="${cy + 5}" class="coil-label">R</text>
        <line x1="${cx + 16}" y1="${cy}" x2="${x + CELL_W}" y2="${cy}" class="wire"/>
        <text x="${cx}" y="${y + 8}" class="tag">${tag}</text>
      </g>`;
  },

  // Renderiza um elemento pelo tipo
  render(type, x, y, tag, energized) {
    if (typeof this[type] === 'function') {
      return this[type](x, y, tag, energized);
    }
    console.warn('Elemento não suportado:', type);
    return '';
  }
};

window.LadderElements = { Elements, CELL_W, CELL_H, MID };
