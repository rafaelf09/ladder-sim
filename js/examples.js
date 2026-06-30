// ============================================================
// examples.js — Exemplos prontos de programas Ladder
// ============================================================

'use strict';

const Examples = {

  list: [
    { id: 'partida-direta',    label: 'Partida Direta de Motor' },
    { id: 'estrela-triangulo', label: 'Partida Estrela-Triângulo' },
    { id: 'semaforo',          label: 'Semáforo' },
    { id: 'contagem-pecas',    label: 'Contagem de Peças' },
  ],

  // ------------------------------------------------------------
  // Carrega um exemplo pelo id
  // ------------------------------------------------------------
  load(id) {
    const { Program, State } = window.LadderEngine;
    Program.clear();
    State.reset();

    switch (id) {
      case 'partida-direta':    this._partidaDireta();    break;
      case 'estrela-triangulo': this._estrelaTriangulo(); break;
      case 'semaforo':          this._semaforo();         break;
      case 'contagem-pecas':    this._contagemPecas();    break;
      default: console.warn('Exemplo não encontrado:', id);
    }

    window.LadderEditor.render();
    window.UI.buildIOPanel();
    window.UI.setComment(this.list.find(e => e.id === id)?.label || '');
  },

  // ------------------------------------------------------------
  // 1. PARTIDA DIRETA DE MOTOR
  // ------------------------------------------------------------
  // Rung 1: (S1 NA || KM1 NA) em série com S2 NF → KM1 (Contator)
  // Rung 2: KM1 NA → HL1 (Sinaleiro)
  // ------------------------------------------------------------
  _partidaDireta() {
    const { Program } = window.LadderEngine;

    // Rung 1 — partida com selo
    const r1 = Program.addRung(
      [{ type: 'NC', tag: 'S2' }, { type: 'COIL', tag: 'KM1' }],
      'Partida e parada'
    );
    // Branch paralela: S1 (liga) em paralelo com KM1 (selo)
    r1.branches = [
      [{ type: 'NO', tag: 'S1'  }, { type: 'NC', tag: 'S2' }, { type: 'COIL', tag: 'KM1' }],
      [{ type: 'NO', tag: 'KM1' }, { type: 'NC', tag: 'S2' }, { type: 'COIL', tag: 'KM1' }],
    ];

    // Rung 2 — sinaleiro
    Program.addRung(
      [{ type: 'NO', tag: 'KM1' }, { type: 'COIL', tag: 'HL1' }],
      'Sinaleiro de marcha'
    );
  },

  // ------------------------------------------------------------
  // 2. PARTIDA ESTRELA-TRIÂNGULO
  // ------------------------------------------------------------
  // S1=liga, S2=desliga, KM1=contator principal,
  // KM2=contator estrela, KM3=contator triângulo
  // T1=timer transição (5s)
  // ------------------------------------------------------------
  _estrelaTriangulo() {
    const { Program } = window.LadderEngine;

    // Rung 1 — contator principal KM1 com selo
    const r1 = Program.addRung([], 'Contator principal');
    r1.branches = [
      [{ type: 'NO', tag: 'S1'  }, { type: 'NC', tag: 'S2' }, { type: 'NC', tag: 'KM3' }, { type: 'COIL', tag: 'KM1' }],
      [{ type: 'NO', tag: 'KM1' }, { type: 'NC', tag: 'S2' }, { type: 'NC', tag: 'KM3' }, { type: 'COIL', tag: 'KM1' }],
    ];

    // Rung 2 — contator estrela KM2 (ativo enquanto timer não vence)
    Program.addRung(
      [{ type: 'NO', tag: 'KM1' }, { type: 'NC', tag: 'KM3' }, { type: 'COIL', tag: 'KM2' }],
      'Contator estrela'
    );

    // Rung 3 — timer TON para transição estrela→triângulo
    Program.addRung(
      [{ type: 'NO', tag: 'KM1' }, { type: 'TON', tag: 'T1', preset: 5000 }],
      'Timer transição 5s'
    );

    // Rung 4 — contator triângulo KM3 (após timer)
    Program.addRung(
      [{ type: 'NO', tag: 'T1_Q' }, { type: 'NC', tag: 'KM2' }, { type: 'COIL', tag: 'KM3' }],
      'Contator triângulo'
    );
  },

  // ------------------------------------------------------------
  // 3. SEMÁFORO
  // ------------------------------------------------------------
  // Ciclo: Verde(4s) → Amarelo(1s) → Vermelho(4s) → repete
  // M0=start automático
  // ------------------------------------------------------------
  _semaforo() {
    const { Program, State } = window.LadderEngine;

    // Inicia ciclo automaticamente
    State.set('M_START', true);

    // Rung 1 — Timer verde T_V (4s), ativo quando não está no vermelho
    Program.addRung(
      [{ type: 'NO', tag: 'M_START' }, { type: 'NC', tag: 'T_R_Q' }, { type: 'TON', tag: 'T_V', preset: 4000 }],
      'Timer Verde 4s'
    );

    // Rung 2 — Timer amarelo T_A (1s), ativo após verde
    Program.addRung(
      [{ type: 'NO', tag: 'T_V_Q' }, { type: 'TON', tag: 'T_A', preset: 1000 }],
      'Timer Amarelo 1s'
    );

    // Rung 3 — Timer vermelho T_R (4s), ativo após amarelo
    Program.addRung(
      [{ type: 'NO', tag: 'T_A_Q' }, { type: 'TON', tag: 'T_R', preset: 4000 }],
      'Timer Vermelho 4s'
    );

    // Rung 4 — Saída Verde: ativo quando T_V não venceu
    Program.addRung(
      [{ type: 'NO', tag: 'M_START' }, { type: 'NC', tag: 'T_V_Q' }, { type: 'COIL', tag: 'Q_VERDE' }],
      'Saída Verde'
    );

    // Rung 5 — Saída Amarela
    Program.addRung(
      [{ type: 'NO', tag: 'T_V_Q' }, { type: 'NC', tag: 'T_A_Q' }, { type: 'COIL', tag: 'Q_AMARELO' }],
      'Saída Amarela'
    );

    // Rung 6 — Saída Vermelha
    Program.addRung(
      [{ type: 'NO', tag: 'T_A_Q' }, { type: 'NC', tag: 'T_R_Q' }, { type: 'COIL', tag: 'Q_VERMELHO' }],
      'Saída Vermelha'
    );
  },

  // ------------------------------------------------------------
  // 4. CONTAGEM DE PEÇAS
  // ------------------------------------------------------------
  // B1=sensor de peça, CTU conta até 10, Q_CHEIO=caixa cheia
  // S_RESET=botão reset manual
  // ------------------------------------------------------------
  _contagemPecas() {
    const { Program } = window.LadderEngine;

    // Rung 1 — Contador CTU
    Program.addRung(
      [{ type: 'NO', tag: 'B1' }, { type: 'CTU', tag: 'C1', preset: 10 }],
      'Sensor de peça → CTU'
    );

    // Rung 2 — Reset do contador
    Program.addRung(
      [{ type: 'NO', tag: 'S_RESET' }, { type: 'COIL', tag: 'C1_R' }],
      'Reset manual'
    );

    // Rung 3 — Saída caixa cheia
    Program.addRung(
      [{ type: 'NO', tag: 'C1_Q' }, { type: 'COIL', tag: 'Q_CHEIO' }],
      'Caixa cheia'
    );

    // Rung 4 — Sinaleiro de caixa cheia
    Program.addRung(
      [{ type: 'NO', tag: 'C1_Q' }, { type: 'COIL', tag: 'HL_CHEIO' }],
      'Sinaleiro caixa cheia'
    );
  }
};

window.LadderExamples = Examples;
