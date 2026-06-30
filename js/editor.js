// ============================================================
// editor.js — Renderização SVG e editor interativo
// Versão 2.0 — suporte a branches paralelas
// ============================================================

'use strict';

const CELL_W             = 80;
const CELL_H             = 60;
const MID                 = CELL_H / 2;
const BRANCH_H           = 60;
const RUNG_PADDING_LEFT  = 50;
const RUNG_PADDING_RIGHT = 50;
const RUNG_GAP           = 16;
const BUS_MID            = 30;

const Editor = {
  svgEl:        null,
  selectedTool: null,
  _ns:          'http://www.w3.org/2000/svg',

  init(svgId) {
    this.svgEl = document.getElementById(svgId);
    this._setupToolbar();
  },

  // ------------------------------------------------------------
  // TOOLBAR
  // ------------------------------------------------------------
  _setupToolbar() {
    document.querySelectorAll('.tool-btn[data-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedTool = btn.dataset.type;
        this._setHint(`"${btn.querySelector('.tool-label').textContent}" selecionado — clique no rung para inserir. Botão direito para deletar.`);
        this.render();
      });
    });

    document.getElementById('btn-add-rung').addEventListener('click', () => {
      window.LadderEngine.Program.addRung([]);
      this.render();
      window.UI.buildIOPanel();
    });

    document.getElementById('btn-clear').addEventListener('click', () => {
      if (!confirm('Limpar o programa inteiro?')) return;
      window.LadderEngine.Program.clear();
      window.LadderEngine.State.reset();
      window.LadderEngine.Program.addRung([]);
      this.render();
      window.UI.buildIOPanel();
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      const json = window.LadderEngine.Program.toJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = 'programa-ladder.json';
      a.click();
    });

    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('input-import').click();
    });

    document.getElementById('input-import').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          window.LadderEngine.Program.fromJSON(ev.target.result);
          window.LadderEngine.State.reset();
          this.render();
          window.UI.buildIOPanel();
          this._setHint('Programa importado com sucesso.');
        } catch(err) {
          alert('Erro ao importar: ' + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  },

  _setHint(msg) {
    const el = document.getElementById('editor-hint');
    if (el) el.textContent = msg;
  },

  // ------------------------------------------------------------
  // RENDER PRINCIPAL
  // ------------------------------------------------------------
  render() {
    const { Program } = window.LadderEngine;
    this.svgEl.innerHTML = '';

    let yOffset = RUNG_GAP;

    Program.rungs.forEach((rung, rungIndex) => {
      const rungHeight = this._calcRungHeight(rung);
      this._renderRung(rung, rungIndex, yOffset, rungHeight);
      yOffset += rungHeight + RUNG_GAP;
    });

    this.svgEl.setAttribute('height', Math.max(300, yOffset));
  },

  // ------------------------------------------------------------
  // ALTURA DE UM RUNG (depende do número de branches)
  // ------------------------------------------------------------
  _calcRungHeight(rung) {
    return rung.branches.length * BRANCH_H + 20;
  },

  // ------------------------------------------------------------
  // RENDER DE UM RUNG
  // ------------------------------------------------------------
  _renderRung(rung, rungIndex, y, rungHeight) {
    const { State } = window.LadderEngine;
    const { Elements } = window.LadderElements;

    const midY       = y + rungHeight / 2;
    const maxElems   = Math.max(...rung.branches.map(b => b.length), 1);
    const rungWidth  = RUNG_PADDING_LEFT + maxElems * CELL_W + RUNG_PADDING_RIGHT;

    // --- Barra esquerda ---
    this._line(0, midY, RUNG_PADDING_LEFT, midY, 'bus-left');
    this._line(RUNG_PADDING_LEFT, y + 10, RUNG_PADDING_LEFT, y + rungHeight - 10, 'bus-bar');

    // --- Barra direita ---
    const xRight = RUNG_PADDING_LEFT + maxElems * CELL_W;
    this._line(xRight, midY, xRight + RUNG_PADDING_RIGHT, midY, 'bus-right');
    this._line(xRight, y + 10, xRight, y + rungHeight - 10, 'bus-bar');

    // --- Número do rung ---
    this._text(16, midY + 4, String(rungIndex + 1), 'rung-number');

    // --- Botão deletar rung ---
    if (window.LadderEngine.Program.rungs.length > 1) {
      this._deleteRungBtn(xRight + RUNG_PADDING_RIGHT + 6, midY - 10, rungIndex);
    }

    // --- Botão adicionar branch paralela ---
    this._addBranchBtn(xRight + RUNG_PADDING_RIGHT + 6, midY + 10, rungIndex);

    // --- Branches ---
    rung.branches.forEach((branch, branchIndex) => {
      const branchY = y + 10 + branchIndex * BRANCH_H + BRANCH_H / 2 - BUS_MID;

      // Linha de conexão vertical entre branches (esquerda)
      if (rung.branches.length > 1) {
        if (branchIndex === 0) {
          this._line(RUNG_PADDING_LEFT, branchY + BUS_MID, RUNG_PADDING_LEFT, y + 10 + BRANCH_H + BRANCH_H / 2 - BUS_MID, 'bus-branch');
        }
      }

      // Elementos da branch
      branch.forEach((el, elIndex) => {
        const x         = RUNG_PADDING_LEFT + elIndex * CELL_W;
        const energized = this._isEnergized(branch, elIndex);
        const svgStr    = Elements.render(el.type, x, branchY, el.tag, energized);

        const g = this._svgEl('g');
        g.innerHTML  = svgStr;
        g.style.cursor = 'pointer';
        g.dataset.rung   = rungIndex;
        g.dataset.branch = branchIndex;
        g.dataset.el     = elIndex;

        // Clique esquerdo — insere antes
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.selectedTool) {
            this._insertElement(rungIndex, branchIndex, elIndex);
          }
        });

        // Duplo clique — edita tag
        g.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          const novaTag = prompt('Renomear variável:', el.tag);
          if (novaTag && novaTag.trim()) {
            el.tag = novaTag.trim();
            this.render();
            window.UI.buildIOPanel();
          }
        });

        // Clique direito — deleta
        g.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (!confirm(`Deletar ${el.type} (${el.tag})?`)) return;
          window.LadderEngine.Program.removeElement(rungIndex, branchIndex, elIndex);
          this.render();
          window.UI.buildIOPanel();
        });

        this.svgEl.appendChild(g);
      });

      // Zona de inserção no final da branch
      this._insertZone(rungIndex, branchIndex, branch.length, branchY);

      // Botão deletar branch (se mais de 1)
      if (rung.branches.length > 1 && branchIndex > 0) {
        this._deleteBranchBtn(
          RUNG_PADDING_LEFT + maxElems * CELL_W + 4,
          branchY + BUS_MID - 8,
          rungIndex, branchIndex
        );
      }
    });
  },

  // ------------------------------------------------------------
  // ZONA DE INSERÇÃO
  // ------------------------------------------------------------
  _insertZone(rungIndex, branchIndex, position, y) {
    const x    = RUNG_PADDING_LEFT + position * CELL_W;
    const rect = this._svgEl('rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y + 8);
    rect.setAttribute('width', CELL_W - 4);
    rect.setAttribute('height', CELL_H - 16);
    rect.setAttribute('rx', 4);
    rect.setAttribute('class', 'insert-zone' + (this.selectedTool ? ' active-zone' : ''));
    rect.style.cursor = this.selectedTool ? 'cell' : 'default';

    rect.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.selectedTool) {
        this._insertElement(rungIndex, branchIndex, position);
      }
    });

    this.svgEl.appendChild(rect);

    if (this.selectedTool) {
      const txt = this._svgEl('text');
      txt.setAttribute('x', x + CELL_W / 2 - 2);
      txt.setAttribute('y', y + BUS_MID + 6);
      txt.setAttribute('class', 'insert-hint');
      txt.textContent = '+';
      this.svgEl.appendChild(txt);
    }
  },

  // ------------------------------------------------------------
  // INSERÇÃO DE ELEMENTO
  // ------------------------------------------------------------
  _insertElement(rungIndex, branchIndex, position) {
    const tag = this._promptTag(this.selectedTool);
    if (!tag) return;
    window.LadderEngine.Program.insertElement(
      rungIndex, branchIndex, position,
      { type: this.selectedTool, tag }
    );
    this.render();
    window.UI.buildIOPanel();
  },

  // ------------------------------------------------------------
  // BOTÕES DE CONTROLE
  // ------------------------------------------------------------
  _deleteRungBtn(x, y, rungIndex) {
    const g = this._iconBtn(x, y, '×', 'delete-btn', 'delete-btn-txt', () => {
      if (!confirm(`Deletar rung ${rungIndex + 1}?`)) return;
      window.LadderEngine.Program.removeRung(rungIndex);
      this.render();
      window.UI.buildIOPanel();
    });
    this.svgEl.appendChild(g);
  },

  _addBranchBtn(x, y, rungIndex) {
    const g = this._iconBtn(x, y, '⊕', 'branch-btn', 'branch-btn-txt', () => {
      window.LadderEngine.Program.addBranch(rungIndex);
      this.render();
    });
    this.svgEl.appendChild(g);
  },

  _deleteBranchBtn(x, y, rungIndex, branchIndex) {
    const g = this._iconBtn(x, y, '−', 'delete-btn', 'delete-btn-txt', () => {
      if (!confirm('Deletar branch paralela?')) return;
      window.LadderEngine.Program.removeBranch(rungIndex, branchIndex);
      this.render();
      window.UI.buildIOPanel();
    });
    this.svgEl.appendChild(g);
  },

  _iconBtn(x, y, symbol, circleClass, txtClass, onClick) {
    const g   = this._svgEl('g');
    g.style.cursor = 'pointer';
    const c   = this._svgEl('circle');
    c.setAttribute('cx', x + 8); c.setAttribute('cy', y + 8); c.setAttribute('r', 9);
    c.setAttribute('class', circleClass);
    const t   = this._svgEl('text');
    t.setAttribute('x', x + 8); t.setAttribute('y', y + 13);
    t.setAttribute('class', txtClass);
    t.textContent = symbol;
    g.appendChild(c); g.appendChild(t);
    g.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return g;
  },

  // ------------------------------------------------------------
  // ENERGIZAÇÃO VISUAL
  // ------------------------------------------------------------
  _isEnergized(branch, upToIndex) {
    const { State } = window.LadderEngine;
    let power = true;
    for (let i = 0; i <= upToIndex; i++) {
      const el  = branch[i];
      const val = State.get(el.tag);
      if      (el.type === 'NO') power = power && val;
      else if (el.type === 'NC') power = power && !val;
    }
    return power;
  },

  // ------------------------------------------------------------
  // PROMPT DE TAG
  // ------------------------------------------------------------
  _promptTag(type) {
    const defaults = {
      NO: 'I0.0', NC: 'I0.1',
      COIL: 'Q0.0', COIL_NEG: 'Q0.0',
      SET: 'M0.0', RESET: 'M0.0',
      TON: 'T0', CTU: 'C0'
    };
    const tag = prompt(`Variável para ${type}:`, defaults[type] || 'M0.0');
    return tag ? tag.trim() : null;
  },

  // ------------------------------------------------------------
  // HELPERS SVG
  // ------------------------------------------------------------
  _svgEl(tag) {
    return document.createElementNS(this._ns, tag);
  },

  _line(x1, y1, x2, y2, cls) {
    const el = this._svgEl('line');
    el.setAttribute('x1', x1); el.setAttribute('y1', y1);
    el.setAttribute('x2', x2); el.setAttribute('y2', y2);
    el.setAttribute('class', cls);
    this.svgEl.appendChild(el);
  },

  _text(x, y, content, cls) {
    const el = this._svgEl('text');
    el.setAttribute('x', x); el.setAttribute('y', y);
    el.setAttribute('class', cls);
    el.textContent = content;
    this.svgEl.appendChild(el);
  }
};

window.LadderEditor = Editor;
