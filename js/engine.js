// ============================================================
// engine.js — Scan cycle engine do simulador Ladder
// Versão 2.0 — suporte a branches paralelas (lógica OR)
// ============================================================

'use strict';

// ------------------------------------------------------------
// 1. ESTADO GLOBAL
// ------------------------------------------------------------
const State = {
  bits: {},

  get(tag)         { return this.bits[tag] === true; },
  set(tag, value)  { this.bits[tag] = !!value; },
  toggle(tag)      { this.bits[tag] = !this.bits[tag]; },
  reset()          { this.bits = {}; },

  snapshot()       { return { ...this.bits }; },
  restore(snap)    { this.bits = { ...snap }; }
};

// ------------------------------------------------------------
// 2. PROGRAMA
// ------------------------------------------------------------
// Estrutura de um rung:
// {
//   id: Number,
//   comment: String,
//   branches: [
//     [ {type, tag}, {type, tag}, ... ],  // branch 0 (principal)
//     [ {type, tag}, ... ],               // branch 1 (paralela)
//   ]
// }
//
// Rung em série puro = branches com um único array
// Rung com paralelo = branches com múltiplos arrays avaliados em OR

const Program = {
  rungs: [],

  // Cria rung com uma branch principal vazia
  addRung(elements = [], comment = '') {
    const rung = {
      id:       this.rungs.length,
      comment,
      branches: [elements]
    };
    this.rungs.push(rung);
    return rung;
  },

  // Adiciona uma branch paralela a um rung existente
  addBranch(rungIndex) {
    const rung = this.rungs[rungIndex];
    if (!rung) return null;
    rung.branches.push([]);
    return rung;
  },

  // Remove uma branch de um rung (mínimo 1)
  removeBranch(rungIndex, branchIndex) {
    const rung = this.rungs[rungIndex];
    if (!rung || rung.branches.length <= 1) return;
    rung.branches.splice(branchIndex, 1);
  },

  // Remove um rung
  removeRung(rungIndex) {
    this.rungs.splice(rungIndex, 1);
    this.rungs.forEach((r, i) => r.id = i);
  },

  // Insere elemento numa branch
  insertElement(rungIndex, branchIndex, position, element) {
    const branch = this.rungs[rungIndex]?.branches[branchIndex];
    if (!branch) return;
    branch.splice(position, 0, element);
  },

  // Remove elemento de uma branch
  removeElement(rungIndex, branchIndex, elIndex) {
    const branch = this.rungs[rungIndex]?.branches[branchIndex];
    if (!branch) return;
    branch.splice(elIndex, 1);
  },

  // Serializa para JSON
  toJSON() {
    return JSON.stringify({ rungs: this.rungs }, null, 2);
  },

  // Carrega de JSON
  fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    this.rungs = data.rungs.map((r, i) => ({ ...r, id: i }));
  },

  clear() {
    this.rungs = [];
  }
};

// ------------------------------------------------------------
// 3. AVALIAÇÃO DE ELEMENTOS
// ------------------------------------------------------------
function evaluateElement(element, powerIn) {
  const val = State.get(element.tag);

  switch (element.type) {
    case 'NO':
      return powerIn && val;

    case 'NC':
      return powerIn && !val;

    case 'COIL':
      State.set(element.tag, powerIn);
      return powerIn;

    case 'COIL_NEG':
      State.set(element.tag, !powerIn);
      return powerIn;

    case 'SET':
      if (powerIn) State.set(element.tag, true);
      return powerIn;

    case 'RESET':
      if (powerIn) State.set(element.tag, false);
      return powerIn;

    case 'TON':
      return evaluateTON(element, powerIn);

    case 'CTU':
      return evaluateCTU(element, powerIn);

    default:
      console.warn('[Engine] Elemento desconhecido:', element.type);
      return false;
  }
}

// ------------------------------------------------------------
// 4. AVALIAÇÃO DE UMA BRANCH (série)
// ------------------------------------------------------------
function evaluateBranch(elements, powerIn) {
  let power = powerIn;
  for (const el of elements) {
    power = evaluateElement(el, power);
  }
  return power;
}

// ------------------------------------------------------------
// 5. AVALIAÇÃO DE UM RUNG (branches em paralelo = OR)
// ------------------------------------------------------------
function evaluateRung(rung) {
  // Cada branch é avaliada em série
  // O resultado final é OR de todas as branches
  let result = false;
  for (const branch of rung.branches) {
    if (evaluateBranch(branch, true)) {
      result = true;
    }
  }
  return result;
}

// ------------------------------------------------------------
// 6. TIMERS — TON (On-delay)
// ------------------------------------------------------------
const _timers = {};

function evaluateTON(element, powerIn) {
  const key = element.tag;
  if (!_timers[key]) {
    _timers[key] = { running: false, elapsed: 0, done: false, lastTick: null };
  }
  const t = _timers[key];
  const preset = element.preset || 1000; // ms

  if (powerIn) {
    if (!t.running) {
      t.running   = true;
      t.lastTick  = Date.now();
    } else {
      const now = Date.now();
      t.elapsed  += now - t.lastTick;
      t.lastTick  = now;
    }
    t.done = t.elapsed >= preset;
  } else {
    t.running = false;
    t.elapsed = 0;
    t.done    = false;
  }

  State.set(element.tag + '_Q', t.done);
  State.set(element.tag + '_T', Math.min(t.elapsed, preset));
  return t.done;
}

// ------------------------------------------------------------
// 7. CONTADORES — CTU (Up counter)
// ------------------------------------------------------------
const _counters = {};

function evaluateCTU(element, powerIn) {
  const key = element.tag;
  if (!_counters[key]) {
    _counters[key] = { count: 0, lastPower: false };
  }
  const c = _counters[key];
  const preset = element.preset || 5;

  // Borda de subida
  if (powerIn && !c.lastPower) {
    c.count++;
  }
  c.lastPower = powerIn;

  // Reset externo via tag_R
  if (State.get(element.tag + '_R')) {
    c.count = 0;
  }

  const done = c.count >= preset;
  State.set(element.tag + '_Q', done);
  State.set(element.tag + '_CV', c.count);
  return done;
}

// ------------------------------------------------------------
// 8. SCAN CYCLE
// ------------------------------------------------------------
function scanCycle() {
  for (const rung of Program.rungs) {
    evaluateRung(rung);
  }
}

// ------------------------------------------------------------
// 9. LOOP DE EXECUÇÃO
// ------------------------------------------------------------
let _scanInterval = null;
let _scanTime     = 100;
let _onScanComplete = () => {};

function startEngine() {
  if (_scanInterval) return;
  _scanInterval = setInterval(() => {
    scanCycle();
    _onScanComplete();
  }, _scanTime);
}

function stopEngine() {
  clearInterval(_scanInterval);
  _scanInterval = null;
}

function setScanTime(ms) {
  _scanTime = ms;
  if (_scanInterval) { stopEngine(); startEngine(); }
}

function isRunning() {
  return _scanInterval !== null;
}

// ------------------------------------------------------------
// 10. API PÚBLICA
// ------------------------------------------------------------
window.LadderEngine = {
  State,
  Program,
  scanCycle,
  startEngine,
  stopEngine,
  setScanTime,
  isRunning,
  get onScanComplete()     { return _onScanComplete; },
  set onScanComplete(fn)   { _onScanComplete = fn; }
};
