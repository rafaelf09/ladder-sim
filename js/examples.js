// ============================================================
// examples.js — Exemplos prontos de programas Ladder
// ============================================================

'use strict';

const Examples = {

  list: [
    { id: 'partida-direta',    label: 'Partida Direta de Motor' },
    { id: 'estrela-triangulo', label: 'Partida Estrela-Triângulo' },
    { id: 'reversao-motor',    label: 'Reversão de Motor (Intertravado)' },
    { id: 'bomba-nivel',       label: 'Bomba com Boias de Nível' },
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
      case 'reversao-motor':    this._reversaoMotor();    break;
      case 'bomba-nivel':       this._bombaNivel();       break;
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
  },

  // ------------------------------------------------------------
  // 5. REVERSÃO DE MOTOR COM INTERTRAVAMENTO
  // ------------------------------------------------------------
  // S1=liga horário, S2=liga anti-horário, S0=parada geral (NF)
  // OL=relé de sobrecarga acionado (NA — true quando disparou)
  // KM1=contator horário, KM2=contator anti-horário
  // Intertravamento elétrico: KM1 só liga se KM2 estiver desligado
  // e vice-versa — evita curto de fase por acionamento simultâneo.
  // ------------------------------------------------------------
  _reversaoMotor() {
    const { Program } = window.LadderEngine;

    // Rung 1 — Contator horário KM1 (com selo e intertravado por KM2)
    const r1 = Program.addRung([], 'Sentido horário');
    r1.branches = [
      [{ type: 'NO', tag: 'S1'  }, { type: 'NC', tag: 'S0' }, { type: 'NC', tag: 'OL' }, { type: 'NC', tag: 'KM2' }, { type: 'COIL', tag: 'KM1' }],
      [{ type: 'NO', tag: 'KM1' }, { type: 'NC', tag: 'S0' }, { type: 'NC', tag: 'OL' }, { type: 'NC', tag: 'KM2' }, { type: 'COIL', tag: 'KM1' }],
    ];

    // Rung 2 — Contator anti-horário KM2 (com selo e intertravado por KM1)
    const r2 = Program.addRung([], 'Sentido anti-horário');
    r2.branches = [
      [{ type: 'NO', tag: 'S2'  }, { type: 'NC', tag: 'S0' }, { type: 'NC', tag: 'OL' }, { type: 'NC', tag: 'KM1' }, { type: 'COIL', tag: 'KM2' }],
      [{ type: 'NO', tag: 'KM2' }, { type: 'NC', tag: 'S0' }, { type: 'NC', tag: 'OL' }, { type: 'NC', tag: 'KM1' }, { type: 'COIL', tag: 'KM2' }],
    ];

    // Rung 3/4 — Sinaleiros de sentido
    Program.addRung([{ type: 'NO', tag: 'KM1' }, { type: 'COIL', tag: 'HL1' }], 'Sinaleiro horário');
    Program.addRung([{ type: 'NO', tag: 'KM2' }, { type: 'COIL', tag: 'HL2' }], 'Sinaleiro anti-horário');

    // Rung 5 — Sinaleiro de falha (sobrecarga disparada)
    Program.addRung([{ type: 'NO', tag: 'OL' }, { type: 'COIL', tag: 'HL_FALHA' }], 'Sinaleiro de sobrecarga');
  },

  // ------------------------------------------------------------
  // 6. BOMBA COM BOIAS DE NÍVEL
  // ------------------------------------------------------------
  // B_INF=boia de nível baixo (NA — fecha quando reservatório vazio)
  // B_SUP=boia de nível alto (NA — fecha quando reservatório cheio)
  // KM_BOMBA=contator da bomba
  // Liga quando o nível cai abaixo da boia inferior, mantém-se ligada
  // (selo) até o nível alcançar a boia superior.
  // ------------------------------------------------------------
  _bombaNivel() {
    const { Program } = window.LadderEngine;

    // Rung 1 — Contator da bomba (liga por nível baixo, desliga por nível alto)
    const r1 = Program.addRung([], 'Controle da bomba por nível');
    r1.branches = [
      [{ type: 'NO', tag: 'B_INF'    }, { type: 'NC', tag: 'B_SUP' }, { type: 'COIL', tag: 'KM_BOMBA' }],
      [{ type: 'NO', tag: 'KM_BOMBA' }, { type: 'NC', tag: 'B_SUP' }, { type: 'COIL', tag: 'KM_BOMBA' }],
    ];

    // Rung 2 — Sinaleiro bomba ligada
    Program.addRung([{ type: 'NO', tag: 'KM_BOMBA' }, { type: 'COIL', tag: 'HL_BOMBA' }], 'Sinaleiro bomba ligada');

    // Rung 3 — Sinaleiro reservatório cheio
    Program.addRung([{ type: 'NO', tag: 'B_SUP' }, { type: 'COIL', tag: 'HL_CHEIO' }], 'Sinaleiro reservatório cheio');
  }
};

window.LadderExamples = Examples;

