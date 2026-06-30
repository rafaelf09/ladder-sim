// ui.js — Painel de I/O, controles e integração com engine + editor

const UI = {

  init() {
    const { startEngine, stopEngine, State } = window.LadderEngine;
    const Editor = window.LadderEditor;

    // Conecta o hook da engine ao render do editor
    window.LadderEngine.onScanComplete = () => {
      Editor.render();
      this.updateIOPanel();
    };

    // Botão Start
    document.getElementById('btn-start').addEventListener('click', () => {
      startEngine();
      document.getElementById('btn-start').disabled = true;
      document.getElementById('btn-stop').disabled  = false;
    });

    // Botão Stop
    document.getElementById('btn-stop').addEventListener('click', () => {
      stopEngine();
      document.getElementById('btn-start').disabled = false;
      document.getElementById('btn-stop').disabled  = true;
    });

    // Botão Step (executa um ciclo manualmente)
    document.getElementById('btn-step').addEventListener('click', () => {
      window.LadderEngine.scanCycle();
      Editor.render();
      this.updateIOPanel();
    });

    // Clique em elemento — por ora só loga no console
    Editor.onElementClick = (rungIdx, elIdx, el) => {
      console.log(`Clicou: rung ${rungIdx}, elemento ${elIdx}`, el);
    };

    // Velocidade do scan
    document.getElementById('scan-speed').addEventListener('input', (e) => {
      window.LadderEngine.setScanTime(Number(e.target.value));
      document.getElementById('scan-speed-label').textContent = e.target.value + 'ms';
    });

    // Carrega exemplo inicial e renderiza
    this.loadExample();
    Editor.render();
    this.buildIOPanel();
  },

  // ------------------------------------------------------------
  // Exemplo inicial: partida direta de motor
  // I0.0 = Botoeira liga, I0.1 = Botoeira desliga (NF), Q0.0 = Contator
  // ------------------------------------------------------------
  loadExample() {
    const { Program, State } = window.LadderEngine;
    Program.clear();
    State.reset();

    // Rung 1: (I0.0 NA || Q0.0 NA) && I0.1 NF --> Q0.0
    // Versão simplificada sem paralelo por ora: I0.0 NA --> Q0.0
    Program.addRung([
      { type: 'NO',   tag: 'I0.0' },
      { type: 'NC',   tag: 'I0.1' },
      { type: 'COIL', tag: 'Q0.0' }
    ]);

    // Rung 2: Q0.0 NA --> Q0.1 (sinaleiro)
    Program.addRung([
      { type: 'NO',   tag: 'Q0.0' },
      { type: 'COIL', tag: 'Q0.1' }
    ]);

    // Estado inicial
    State.set('I0.1', false); // botoeira desliga em repouso = false (NF passa)
  },

  // ------------------------------------------------------------
  // Monta o painel de I/O com base nas tags do programa
  // ------------------------------------------------------------
  buildIOPanel() {
    const { Program, State } = window.LadderEngine;

    // Coleta todas as tags únicas
    const inputs  = new Set();
    const outputs = new Set();

    Program.rungs.forEach(rung => {
      rung.elements.forEach(el => {
        if (el.tag.startsWith('I')) inputs.add(el.tag);
        if (el.tag.startsWith('Q')) outputs.add(el.tag);
      });
    });

    // Monta painel de entradas
    const inPanel = document.getElementById('panel-inputs');
    inPanel.innerHTML = '<h3>Entradas (I)</h3>';
    inputs.forEach(tag => {
      const div = document.createElement('div');
      div.className = 'io-row';
      div.innerHTML = `
        <span class="io-tag">${tag}</span>
        <button class="io-btn" id="btn-${tag}" onclick="UI.toggleInput('${tag}')">OFF</button>
        <span class="io-indicator off" id="ind-${tag}"></span>
      `;
      inPanel.appendChild(div);
    });

    // Monta painel de saídas
    const outPanel = document.getElementById('panel-outputs');
    outPanel.innerHTML = '<h3>Saídas (Q)</h3>';
    outputs.forEach(tag => {
      const div = document.createElement('div');
      div.className = 'io-row';
      div.innerHTML = `
        <span class="io-tag">${tag}</span>
        <span class="io-indicator off" id="ind-${tag}"></span>
      `;
      outPanel.appendChild(div);
    });
  },

  // ------------------------------------------------------------
  // Atualiza os indicadores do painel a cada scan
  // ------------------------------------------------------------
  updateIOPanel() {
    const { Program, State } = window.LadderEngine;

    Program.rungs.forEach(rung => {
      rung.elements.forEach(el => {
        const ind = document.getElementById('ind-' + el.tag);
        const btn = document.getElementById('btn-' + el.tag);
        if (!ind) return;
        const val = State.get(el.tag);
        ind.className = 'io-indicator ' + (val ? 'on' : 'off');
        if (btn) btn.textContent = val ? 'ON' : 'OFF';
      });
    });
  },

  // ------------------------------------------------------------
  // Toggle manual de entrada pelo painel
  // ------------------------------------------------------------
  toggleInput(tag) {
    window.LadderEngine.State.toggle(tag);
    window.LadderEngine.scanCycle();
    window.LadderEditor.render();
    this.updateIOPanel();
  }
};

window.UI = UI;
