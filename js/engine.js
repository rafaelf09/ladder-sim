// engine.js — Scan cycle engine do simulador Ladder

const State = {
  bits: {},
  get(tag) { return this.bits[tag] === true; },
  set(tag, value) { this.bits[tag] = !!value; },
  toggle(tag) { this.bits[tag] = !this.bits[tag]; },
  reset() { this.bits = {}; }
};

const Program = {
  rungs: [],
  addRung(elements = []) {
    const rung = { id: this.rungs.length, elements };
    this.rungs.push(rung);
    return rung;
  },
  clear() { this.rungs = []; }
};

function evaluateElement(element, powerIn) {
  const val = State.get(element.tag);
  switch (element.type) {
    case "NO":       return powerIn && val;
    case "NC":       return powerIn && !val;
    case "COIL":     State.set(element.tag, powerIn); return powerIn;
    case "COIL_NEG": State.set(element.tag, !powerIn); return powerIn;
    case "SET":      if (powerIn) State.set(element.tag, true); return powerIn;
    case "RESET":    if (powerIn) State.set(element.tag, false); return powerIn;
    default: console.warn("Elemento desconhecido: " + element.type); return false;
  }
}

function evaluateRung(rung) {
  let power = true;
  for (const element of rung.elements) {
    power = evaluateElement(element, power);
  }
  return power;
}

function scanCycle() {
  for (const rung of Program.rungs) {
    evaluateRung(rung);
  }
}

let scanInterval = null;
let scanTime = 100;
let onScanComplete = function() {};

function startEngine() {
  if (scanInterval) return;
  scanInterval = setInterval(() => { scanCycle(); onScanComplete(); }, scanTime);
}

function stopEngine() {
  clearInterval(scanInterval);
  scanInterval = null;
}

function setScanTime(ms) {
  scanTime = ms;
  if (scanInterval) { stopEngine(); startEngine(); }
}

window.LadderEngine = {
  State, Program, scanCycle, startEngine, stopEngine, setScanTime,
  set onScanComplete(fn) { onScanComplete = fn; }
};
