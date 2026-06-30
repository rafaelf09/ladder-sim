// ============================================================
// ui.js — Painel de I/O, controles e integração geral
// Versão 2.0
// ============================================================

'use strict';

const UI = {

  init() {
    const Engine = window.LadderEngine;
    const Editor = window.LadderEditor;

    // Hook da engine → atualiza UI a cada scan
    Engine.onScanComplete = () => {
      Editor.render();
      this.updateIOPanel();
    };

    // Botões de execução
    document.getElementById('btn-start').addEventListener('click', () => {
      Engine.startEngine();
      this._setRunState(true);
    });

    document.getElementById('btn-stop').addEventListener('click', () => {
      Engine.stopEngine();
      this._setRunState(false);
    });

    document.getElementById('btn-step').addEventListener('click', () => {
      Engine.scanCycle();
      Editor.render();
      this.updateIOPanel();
    });

    // Velocidade do scan
    document.getElementById('scan-speed').addEventListener('input', (e) => {
      Engine.setScanTime(Number(e.target.value));
      document.getElementById('scan-speed-label').textContent = e.target.value + 'ms';
    });

    // Menu de exemplos
    document.getElementById('select-example').addEventListener('change', (e) => {
      const id = e.target.value;
      if (!id) return;
      if (Engine.Program.rungs.some(r => r.branches.some(b => b.length > 0))) {
        if (!confirm('Carregar exemplo vai substituir o programa atual. Continuar?')) {
          e.target.value = '';
          return;
        }
      }
      Engine.stopEngine();
      this._setRunState(false);
      window.LadderExamples.load(id);
      e.target.value = '';
    });

    // Carrega programa vazio inicial
    Engine.Program.addRung([]);
    Editor.render();
    this.buildIOPanel();
  },

  // ------------------------------------------------------------
  // Estado visual dos botões run/stop
  // ------------------------------------------------------------
  _setRunState(running) {
    document.getElementById('btn-start').disabled = running;
    document.getElementById('btn-stop').disabled  = !running;
  },

  // ------------------------------------------------------------
  // Comentário do programa no header
  // ------------------------------------------------------------
  setComment(text) {
    const el = document.getElementById('program-comment');
    if (el) el.textContent = text ? '— ' + text : '';
  },

  // ------------------------------------------------------------
  // Monta painel de I/O
  // ------------------------------------------------------------
  buildIOPanel() {
    const { Program } = window.LadderEngine;

    const inputs   = new Set();
    const outputs  = new Set();
    const memories = new Set();

    Program.rungs.forEach(rung => {
      rung.branches.forEach(branch => {
        branch.forEach(el => {
          const tag = el.tag;
          if (tag.startsWith('I'))      inputs.add(tag);
          else if (tag.startsWith('Q')) outputs.add(tag);
          else if (tag.startsWith('K') || tag.startsWith('H') || tag.startsWith('S') || tag.startsWith('B'))
                                        inputs.add(tag);
          else                          memories.add(tag);
        });
      });
    });

    this._buildSection('panel-inputs',  'Entradas', [...inputs],   true);
    this._buildSection('panel-outputs', 'Saídas',   [...outputs],  false);
    this._buildSection('panel-memory',  'Memórias', [...memories], false);
    this.updateIOPanel();
  },

  _buildSection(panelId, title, tags, interactive) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    if (tags.length === 0) {
      panel.innerHTML = '';
      return;
    }

    panel.innerHTML = `<h3>${title}</h3>`;
    tags.forEach(tag => {
      const div = document.createElement('div');
      div.className = 'io-row';

      if (interactive) {
        div.innerHTML = `
          <span class="io-tag">${tag}</span>
          <button class="io-btn" id="btn-${tag}" onclick="UI.toggleInput('${tag}')">OFF</button>
          <span class="io-indicator off" id="ind-${tag}"></span>
        `;
      } else {
        div.innerHTML = `
          <span class="io-tag">${tag}</span>
          <span class="io-indicator off" id="ind-${tag}"></span>
        `;
      }

      panel.appendChild(div);
    });
  },

  // ------------------------------------------------------------
  // Atualiza indicadores a cada scan
  // ------------------------------------------------------------
  updateIOPanel() {
    const { Program, State } = window.LadderEngine;
    const seen = new Set();

    Program.rungs.forEach(rung => {
      rung.branches.forEach(branch => {
        branch.forEach(el => {
          if (seen.has(el.tag)) return;
          seen.add(el.tag);

          const val = State.get(el.tag);
          const ind = document.getElementById('ind-' + el.tag);
          const btn = document.getElementById('btn-' + el.tag);

          if (ind) ind.className = 'io-indicator ' + (val ? 'on' : 'off');
          if (btn) btn.textContent = val ? 'ON' : 'OFF';
        });
      });
    });
  },

  // ------------------------------------------------------------
  // Toggle de entrada manual
  // ------------------------------------------------------------
  toggleInput(tag) {
    window.LadderEngine.State.toggle(tag);
    window.LadderEngine.scanCycle();
    window.LadderEditor.render();
    this.updateIOPanel();
  }
};

window.UI = UI;
