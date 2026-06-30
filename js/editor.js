// editor.js — Renderização SVG e interação do editor Ladder

const RUNG_PADDING_LEFT  = 40;  // espaço do barramento esquerdo
const RUNG_PADDING_RIGHT = 40;  // espaço do barramento direito
const RUNG_HEIGHT        = 80;  // altura de cada rung
const RUNG_GAP           = 20;  // espaço entre rungs

const Editor = {

  svgEl: null,   // elemento SVG do DOM
  onElementClick: null,  // callback quando usuário clica num elemento

  init(svgId) {
    this.svgEl = document.getElementById(svgId);
  },

  // ------------------------------------------------------------
  // Renderiza todos os rungs do Program no SVG
  // ------------------------------------------------------------
  render() {
    const { Program, State } = window.LadderEngine;
    const { Elements, CELL_W, CELL_H } = window.LadderElements;

    const totalHeight = Program.rungs.length * (RUNG_HEIGHT + RUNG_GAP) + RUNG_GAP;
    const totalWidth  = this.svgEl.clientWidth || 800;

    this.svgEl.setAttribute('height', totalHeight);
    this.svgEl.innerHTML = '';

    Program.rungs.forEach((rung, rungIndex) => {
      const y = RUNG_GAP + rungIndex * (RUNG_HEIGHT + RUNG_GAP);

      // Barramento esquerdo
      this._line(0, y + 30, RUNG_PADDING_LEFT, y + 30, 'bus-left');

      // Barramento direito
      const xEnd = RUNG_PADDING_LEFT + rung.elements.length * CELL_W;
      this._line(xEnd, y + 30, xEnd + RUNG_PADDING_RIGHT, y + 30, 'bus-right');

      // Barra vertical esquerda
      this._line(RUNG_PADDING_LEFT, y + 10, RUNG_PADDING_LEFT, y + 50, 'bus-bar');

      // Barra vertical direita
      this._line(xEnd + RUNG_PADDING_RIGHT, y + 10, xEnd + RUNG_PADDING_RIGHT, y + 50, 'bus-bar');

      // Número do rung
      this._text(10, y + 35, String(rungIndex + 1), 'rung-number');

      // Elementos
      rung.elements.forEach((el, elIndex) => {
        const x = RUNG_PADDING_LEFT + elIndex * CELL_W;

        // Calcula se o elemento está energizado
        const energized = this._isEnergized(rung, elIndex);

        // Renderiza o SVG do elemento
        const svgStr = Elements.render(el.type, x, y, el.tag, energized);
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.innerHTML = svgStr;

        // Clique no elemento
        g.style.cursor = 'pointer';
        g.addEventListener('click', () => {
          if (this.onElementClick) {
            this.onElementClick(rungIndex, elIndex, el);
          }
        });

        this.svgEl.appendChild(g);
      });
    });
  },

  // ------------------------------------------------------------
  // Calcula se um elemento está energizado
  // Simula o powerFlow até aquele elemento
  // ------------------------------------------------------------
  _isEnergized(rung, upToIndex) {
    const { State } = window.LadderEngine;
    let power = true;

    for (let i = 0; i <= upToIndex; i++) {
      const el = rung.elements[i];
      const val = State.get(el.tag);

      if (el.type === 'NO') power = power && val;
      else if (el.type === 'NC') power = power && !val;
      // bobinas não interrompem o fluxo visual
    }

    return power;
  },

  // ------------------------------------------------------------
  // Helpers para criar elementos SVG
  // ------------------------------------------------------------
  _line(x1, y1, x2, y2, cls) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    el.setAttribute('x1', x1); el.setAttribute('y1', y1);
    el.setAttribute('x2', x2); el.setAttribute('y2', y2);
    el.setAttribute('class', cls);
    this.svgEl.appendChild(el);
  },

  _text(x, y, content, cls) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.setAttribute('x', x); el.setAttribute('y', y);
    el.setAttribute('class', cls);
    el.textContent = content;
    this.svgEl.appendChild(el);
  }
};

window.LadderEditor = Editor;
