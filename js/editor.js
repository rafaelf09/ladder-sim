// editor.js — Renderização SVG e lógica de edição

const RUNG_PADDING_LEFT  = 40;
const RUNG_PADDING_RIGHT = 40;
const RUNG_HEIGHT        = 80;
const RUNG_GAP           = 20;

const Editor = {

  svgEl: null,
  selectedTool: null,  // tipo do elemento selecionado na toolbar
  onElementClick: null,

  init(svgId) {
    this.svgEl = document.getElementById(svgId);
    this._setupToolbar();
  },

  // ------------------------------------------------------------
  // Toolbar — seleciona qual elemento vai ser inserido
  // ------------------------------------------------------------
  _setupToolbar() {
    document.querySelectorAll('.tool-btn[data-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        // Desmarca todos
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        // Marca o clicado
        btn.classList.add('active');
        this.selectedTool = btn.dataset.type;
        document.getElementById('editor-hint').textContent =
          `Elemento "${btn.querySelector('span:last-child').textContent}" selecionado — clique no rung para inserir. Botão direito para deletar.`;
      });
    });

    // Botão adicionar rung
    document.getElementById('btn-add-rung').addEventListener('click', () => {
      window.LadderEngine.Program.addRung([]);
      this.render();
      window.UI.buildIOPanel();
    });

    // Botão limpar
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (!confirm('Limpar o programa?')) return;
      window.LadderEngine.Program.clear();
      window.LadderEngine.State.reset();
      window.LadderEngine.Program.addRung([]);
      this.render();
      window.UI.buildIOPanel();
    });
  },

  // ------------------------------------------------------------
  // Renderiza todos os rungs
  // ------------------------------------------------------------
  render() {
    const { Program, State } = window.LadderEngine;
    const { Elements, CELL_W } = window.LadderElements;

    const totalHeight = Math.max(
      300,
      Program.rungs.length * (RUNG_HEIGHT + RUNG_GAP) + RUNG_GAP * 2
    );
    this.svgEl.setAttribute('height', totalHeight);
    this.svgEl.innerHTML = '';

    Program.rungs.forEach((rung, rungIndex) => {
      const y = RUNG_GAP + rungIndex * (RUNG_HEIGHT + RUNG_GAP);
      const xEnd = RUNG_PADDING_LEFT + Math.max(rung.elements.length, 1) * CELL_W;

      // Barramentos
      this._line(0, y + 30, RUNG_PADDING_LEFT, y + 30, 'bus-left');
      this._line(xEnd, y + 30, xEnd + RUNG_PADDING_RIGHT, y + 30, 'bus-right');
      this._line(RUNG_PADDING_LEFT, y + 10, RUNG_PADDING_LEFT, y + 50, 'bus-bar');
      this._line(xEnd + RUNG_PADDING_RIGHT, y + 10, xEnd + RUNG_PADDING_RIGHT, y + 50, 'bus-bar');

      // Número do rung
      this._text(14, y + 35, String(rungIndex + 1), 'rung-number');

      // Botão deletar rung (×)
      this._deleteRungBtn(xEnd + RUNG_PADDING_RIGHT + 8, y + 26, rungIndex);

      // Zona clicável para inserir elemento no rung (área vazia)
      this._insertZone(rungIndex, rung, y);

      // Elementos do rung
      rung.elements.forEach((el, elIndex) => {
        const x = RUNG_PADDING_LEFT + elIndex * CELL_W;
        const energized = this._isEnergized(rung, elIndex);
        const svgStr = Elements.render(el.type, x, y, el.tag, energized);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.innerHTML = svgStr;
        g.style.cursor = 'pointer';

        // Clique esquerdo — insere antes deste elemento
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.selectedTool) {
            this._insertElement(rungIndex, elIndex);
          }
        });

        // Clique direito — deleta este elemento
        g.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this._deleteElement(rungIndex, elIndex);
        });

        this.svgEl.appendChild(g);
      });
    });
  },

  // ------------------------------------------------------------
  // Zona clicável no final do rung para inserir elemento
  // ------------------------------------------------------------
  _insertZone(rungIndex, rung, y) {
    const { CELL_W } = window.LadderElements;
    const x = RUNG_PADDING_LEFT + rung.elements.length * CELL_W;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y + 10);
    rect.setAttribute('width', CELL_W);
    rect.setAttribute('height', 40);
    rect.setAttribute('class', 'insert-zone');
    rect.style.cursor = this.selectedTool ? 'cell' : 'default';

    rect.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.selectedTool) {
        this._insertElement(rungIndex, rung.elements.length);
      }
    });

    this.svgEl.appendChild(rect);

    // Ícone "+" na zona de inserção
    if (this.selectedTool) {
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', x + CELL_W / 2);
      txt.setAttribute('y', y + 35);
      txt.setAttribute('class', 'insert-hint');
      txt.textContent = '+';
      this.svgEl.appendChild(txt);
    }
  },

  // ------------------------------------------------------------
  // Insere um elemento no rung na posição indicada
  // ------------------------------------------------------------
  _insertElement(rungIndex, position) {
    const tag = this._promptTag(this.selectedTool);
    if (!tag) return;

    const rung = window.LadderEngine.Program.rungs[rungIndex];
    rung.elements.splice(position, 0, { type: this.selectedTool, tag });

    this.render();
    window.UI.buildIOPanel();
  },

  // ------------------------------------------------------------
  // Deleta um elemento do rung
  // ------------------------------------------------------------
  _deleteElement(rungIndex, elIndex) {
    const rung = window.LadderEngine.Program.rungs[rungIndex];
    const el = rung.elements[elIndex];
    if (!confirm(`Deletar elemento ${el.type} (${el.tag})?`)) return;
    rung.elements.splice(elIndex, 1);
    this.render();
    window.UI.buildIOPanel();
  },

  // ------------------------------------------------------------
  // Botão × para deletar o rung inteiro
  // ------------------------------------------------------------
  _deleteRungBtn(x, y, rungIndex) {
    const { Program } = window.LadderEngine;
    if (Program.rungs.length <= 1) return; // mantém pelo menos 1

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x + 8); circle.setAttribute('cy', y + 8);
    circle.setAttribute('r', 9);
    circle.setAttribute('class', 'delete-btn');

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', x + 8); txt.setAttribute('y', y + 13);
    txt.setAttribute('class', 'delete-btn-txt');
    txt.textContent = '×';

    g.appendChild(circle);
    g.appendChild(txt);
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm(`Deletar rung ${rungIndex + 1}?`)) return;
      Program.rungs.splice(rungIndex, 1);
      Program.rungs.forEach((r, i) => r.id = i);
      this.render();
      window.UI.buildIOPanel();
    });

    this.svgEl.appendChild(g);
  },

  // ------------------------------------------------------------
  // Pede o nome da tag ao usuário
  // ------------------------------------------------------------
  _promptTag(type) {
    const suggestions = {
      NO: 'I0.0', NC: 'I0.1',
      COIL: 'Q0.0', COIL_NEG: 'Q0.0',
      SET: 'M0.0', RESET: 'M0.0'
    };
    const tag = prompt(`Nome da variável para ${type}:`, suggestions[type] || 'M0.0');
    return tag ? tag.trim() : null;
  },

  // ------------------------------------------------------------
  // Calcula energização visual
  // ------------------------------------------------------------
  _isEnergized(rung, upToIndex) {
    const { State } = window.LadderEngine;
    let power = true;
    for (let i = 0; i <= upToIndex; i++) {
      const el = rung.elements[i];
      const val = State.get(el.tag);
      if (el.type === 'NO') power = power && val;
      else if (el.type === 'NC') power = power && !val;
    }
    return power;
  },

  // ------------------------------------------------------------
  // Helpers SVG
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
