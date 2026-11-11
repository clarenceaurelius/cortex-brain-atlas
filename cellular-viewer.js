import { duration, simulateSpike, spikePhase, spikeSample, stimulusStart, stimulusEnd } from './cellular-model.js';

export const cellularPapers = {
  hodgkinHuxley: {
    title: 'A quantitative description of membrane current and its application to conduction and excitation in nerve',
    authors: 'Hodgkin, A. L. & Huxley, A. F.', year: 1952, journal: 'The Journal of Physiology',
    doi: '10.1113/jphysiol.1952.sp004764', pmid: '12991237', pmc: 'PMC1392413',
    type: 'Squid axon experiment and model',
    summary: 'Uses voltage-clamp measurements to model how sodium and potassium conductances generate an action potential. The simulator uses the classical squid axon parameters.',
  },
  pumpReview: {
    title: 'Na⁺/K⁺-pump and neurotransmitter membrane receptors',
    authors: 'Pivovarov, A. S., Calahorro, F. & Walker, R. J.', year: 2018, journal: 'Invertebrate Neuroscience',
    doi: '10.1007/s10158-018-0221-7', pmid: '30488358', pmc: 'PMC6267510',
    type: 'Neurophysiology review',
    summary: 'Explains how the pump moves three sodium ions out and two potassium ions in and how this transport helps sustain neuronal ion gradients and resting voltage.',
  },
  pumpStructure: {
    title: 'Crystal structure of the sodium-potassium pump',
    authors: 'Morth, J. P. et al.', year: 2007, journal: 'Nature',
    doi: '10.1038/nature06419', pmid: '18075585',
    type: 'Protein structure study',
    summary: 'Describes a structural state of Na⁺/K⁺ ATPase with two potassium-site ions trapped in the pump, providing a view of one part of the transport cycle.',
  },
};

export const cellularPaperIds = {
  spike: ['hodgkinHuxley', 'pumpReview'],
  pump: ['pumpReview', 'pumpStructure'],
};

const spikeStages = [
  { name: 'Resting potential', short: 'Gradients and resting permeability',
    description: 'Membrane voltage is the electrical potential inside relative to outside. In many resting neurons, potassium leak permeability pulls that voltage toward the potassium equilibrium potential. Sodium and other resting currents also contribute.',
    sodium: 'Most voltage-gated Na⁺ channels are closed and available to open.',
    potassium: 'K⁺ leak channels allow outward current while voltage-gated K⁺ activation is low.' },
  { name: 'Approaching threshold', short: 'A depolarising stimulus',
    description: 'The stimulus depolarises the membrane. A spike begins when inward current activates enough additional sodium channels to produce a regenerative rise. The voltage at which this happens depends on channel state and recent activity.',
    sodium: 'Depolarisation increases activation of voltage-gated Na⁺ channels.',
    potassium: 'Voltage-gated K⁺ channels respond more slowly in this model.' },
  { name: 'Depolarisation', short: 'Rapid Na⁺ entry',
    description: 'Opening voltage-gated sodium channels allows Na⁺ to enter down its electrochemical gradient. The resulting depolarisation opens more channels and drives the steep upstroke.',
    sodium: 'Inward Na⁺ current is prominent. Inactivation develops during the rise.',
    potassium: 'Delayed K⁺ conductance is increasing.' },
  { name: 'Repolarisation', short: 'Na⁺ inactivation and K⁺ exit',
    description: 'Sodium channels inactivate as potassium conductance rises. Outward K⁺ current drives voltage back toward negative values. Early in this interval, sodium channel inactivation contributes to the absolute refractory period.',
    sodium: 'Many Na⁺ channels are temporarily inactivated.',
    potassium: 'Increased K⁺ conductance drives outward current.' },
  { name: 'Hyperpolarisation', short: 'The undershoot',
    description: 'Potassium conductance stays elevated briefly after the voltage passes its resting level. This draws voltage closer to the potassium equilibrium potential. During the relative refractory period, a stronger stimulus may be needed to fire again.',
    sodium: 'Na⁺ channels begin recovering from inactivation.',
    potassium: 'Some voltage-gated K⁺ channels remain open and then close.' },
  { name: 'Recovery', short: 'Return toward rest',
    description: 'As voltage-gated K⁺ channels close and Na⁺ channels regain availability, the balance of resting currents brings the membrane back toward its baseline. The pump maintains the ion gradients throughout the sequence.',
    sodium: 'Availability returns as channels recover from inactivation.',
    potassium: 'Delayed K⁺ conductance returns toward its resting value.' },
];

const pumpStages = [
  { name: 'Bind sodium', short: '3 Na⁺ bind on the inside',
    description: 'The inward-facing pump binds three cytosolic sodium ions. ATP supplies a phosphate group to the pump and ADP is released.' },
  { name: 'Release sodium', short: '3 Na⁺ move outside',
    description: 'Phosphorylation favours a change to the outward-facing conformation. The pump releases three sodium ions into the extracellular space.' },
  { name: 'Bind potassium', short: '2 K⁺ bind on the outside',
    description: 'Two extracellular potassium ions bind. Potassium binding promotes dephosphorylation and the return toward the inward-facing conformation.' },
  { name: 'Release potassium', short: '2 K⁺ move inside',
    description: 'The pump releases two potassium ions into the cytosol. One cycle consumes one ATP and moves one net positive charge outward.' },
];

const $ = selector => document.querySelector(selector);
const phaseColors = ['#859a7b', '#b2a072', '#48a99d', '#bb8b67', '#9a8eb8', '#809b89'];
const plotX = time => 46 + time / duration * 522;
const plotY = voltage => 108 - (voltage + 85) / 130 * 94;
const voltageText = voltage => `${voltage < 0 ? '−' : '+'}${Math.abs(voltage).toFixed(1)} mV`;

function voltagePlot(trace) {
  const path = trace.samples.map((sample, i) => `${i ? 'L' : 'M'}${plotX(sample.time).toFixed(1)} ${plotY(sample.v).toFixed(1)}`).join(' ');
  const shading = trace.starts.map((start, index) => {
    const end = trace.starts[index + 1] ?? duration;
    return `<rect x="${plotX(start)}" y="13" width="${plotX(end) - plotX(start)}" height="95" fill="${phaseColors[index]}" opacity=".10"/>`;
  }).join('');
  const grid = [-80, -65, -40, 0, 40].map(value => `<line x1="46" x2="568" y1="${plotY(value)}" y2="${plotY(value)}"/><text x="39" y="${plotY(value) + 3}" text-anchor="end">${value}</text>`).join('');
  const ticks = [0, 5, 10, 15, 20].map(value => `<text x="${plotX(value)}" y="123" text-anchor="middle">${value}</text>`).join('');
  return `<svg viewBox="0 0 600 132" role="img" aria-label="Simulated membrane voltage by time in milliseconds" class="voltage-chart"><g class="voltage-grid">${shading}${grid}${ticks}<text x="8" y="12">mV</text><text x="584" y="123" text-anchor="end">ms</text></g><path d="${path}" class="voltage-line"/><line id="cell-cursor-line" x1="46" x2="46" y1="13" y2="108" class="voltage-cursor"/><circle id="cell-cursor-dot" r="4" cx="46" cy="94" class="voltage-dot"/><path d="M${plotX(stimulusStart)} 108v-5H${plotX(stimulusEnd)}v5" class="stimulus-mark"/></svg>`;
}

function bilayer() {
  return Array.from({ length: 31 }, (_, i) => {
    const x = 25 + i * 19;
    return `<path d="M${x-2} 95l-2 17m6-17 2 17m-6 33-2-17m6 17 2-17"/><circle cx="${x}" cy="90" r="5"/><circle cx="${x}" cy="150" r="5"/>`;
  }).join('');
}

function transportArrow(x, y1, y2, kind, name) {
  const tip = y2 > y1 ? -9 : 9;
  return `<g class="transport-arrow ${kind} ${name}"><path d="M${x} ${y1}V${y2}m-7 ${tip} 7 ${-tip} 7 ${tip}"/></g>`;
}

function ionGroup(x, y, count, symbol, kind, animation = '') {
  const start = x - (count - 1) * 15;
  return `<g class="cell-ions ${kind} ${animation}">${Array.from({ length: count }, (_, i) => {
    const cx = start + i * 30;
    return `<circle cx="${cx}" cy="${y}" r="12"/><text x="${cx}" y="${y+3}" text-anchor="middle">${symbol}</text>`;
  }).join('')}</g>`;
}

function membraneDiagram(lesson, pumpStep) {
  const pump = lesson === 'pump';
  const pumpX = pump ? 310 : 485;
  const protein = `<path class="pump-protein" d="M${pumpX-30} 83q30-18 60 0l-8 24 8 42q-30 20-60 0l8-42z"/><text class="protein-label" x="${pumpX}" y="124" text-anchor="middle">ATPase</text>`;
  let contents;
  if (pump) {
    const sodiumOutside = pumpStep > 0;
    const potassiumInside = pumpStep === 3;
    const facesOut = pumpStep === 1 || pumpStep === 2;
    const gate = facesOut ? 'M295 77q15 29 30 0' : 'M295 157q15-29 30 0';
    contents = `${protein}<path d="${gate}" class="pump-gate"/><text x="432" y="76">${facesOut ? 'Outward-facing' : 'Inward-facing'}</text>`;
    contents += ionGroup(260, sodiumOutside ? 53 : 184, 3, 'Na⁺', 'sodium', pumpStep === 1 ? 'release-out' : '');
    contents += ionGroup(375, potassiumInside ? 184 : 53, 2, 'K⁺', 'potassium', potassiumInside ? 'release-in' : '');
    if (pumpStep === 1) contents += transportArrow(310, 77, 47, 'sodium', 'always');
    if (pumpStep === 3) contents += transportArrow(310, 161, 194, 'potassium', 'always');
    if (pumpStep === 0) contents += '<text class="pump-energy" x="355" y="207">ATP → ADP</text>';
    if (pumpStep === 2) contents += '<text class="pump-energy" x="358" y="191">Pi released</text>';
  } else {
    contents = `<path class="channel-na" d="M125 80h37l-8 39 8 39h-37l8-39z"/><path class="channel-k" d="M295 80h37l-8 39 8 39h-37l8-39z"/>${protein}${transportArrow(182, 53, 187, 'sodium', 'sodium-current')}${transportArrow(351, 187, 53, 'potassium', 'potassium-current')}<text class="protein-label" x="143" y="124" text-anchor="middle">Na⁺</text><text class="protein-label" x="313" y="124" text-anchor="middle">K⁺</text><text x="143" y="212" text-anchor="middle">Voltage-gated Na⁺</text><text x="313" y="212" text-anchor="middle">Voltage-gated K⁺</text><text x="485" y="212" text-anchor="middle">Maintains gradients</text>`;
  }
  return `<svg viewBox="0 0 620 238" class="membrane-diagram" role="img" aria-label="${pump ? 'Schematic sodium potassium pump cycle' : 'Schematic membrane showing sodium and potassium channel currents'}"><text x="24" y="29">EXTRACELLULAR SPACE</text><text x="24" y="225">CYTOSOL</text><g class="bilayer">${bilayer()}</g>${contents}<path class="membrane-scale" d="M601 85h12m-6 0v70m-6 0h12"/><text x="613" y="68" text-anchor="end">≈ 5 nm</text></svg>`;
}

export class CellularViewer {
  constructor({ onScale, onSignal, paperCard, cite }) {
    this.onScale = onScale;
    this.onSignal = onSignal;
    this.paperCard = paperCard;
    this.cite = cite;
    this.root = $('#cellular-workspace');
    this.active = false;
    this.lesson = 'spike';
    this.scale = 'neuron';
    this.strength = 14;
    this.trace = simulateSpike(this.strength);
    this.time = 0;
    this.pumpStep = 0;
    this.cycleElapsed = 0;
    this.playing = false;
    this.reading = false;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.frame = this.frame.bind(this);

    document.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!this.active || !button) return;
      if (button.dataset.cellLesson) this.setLesson(button.dataset.cellLesson);
      if (button.dataset.cellScale) this.setScale(button.dataset.cellScale);
      if (button.dataset.cellStep !== undefined) this.setStep(Number(button.dataset.cellStep));
      if (button.id === 'cell-zoom') this.zoomIn();
      if (button.id === 'cell-play') this.togglePlay();
      if (button.id === 'cell-reset') this.reset();
      if (button.id === 'cell-weak') { this.setStimulus(3); this.start(); }
      if (button.id === 'cell-strong') { this.setStimulus(14); this.start(); }
      if (button.id === 'cell-research') { this.reading = !this.reading; this.renderDetail(); }
    });
    $('#cell-stimulus').addEventListener('input', event => this.setStimulus(Number(event.target.value)));
    $('#cell-time').addEventListener('input', event => {
      this.stop();
      this.time = Number(event.target.value);
      this.refresh();
    });
  }

  enter() {
    this.active = true;
    this.root.classList.remove('hidden');
    this.reading = false;
    this.stop();
    if (this.lesson === 'pump') this.setScale('membrane');
    else this.zoomIn();
  }

  exit() {
    this.stop();
    this.active = false;
    this.root.classList.add('hidden');
    this.onSignal(null);
  }

  zoomIn() {
    if (this.reducedMotion) { this.setScale('neuron'); return; }
    this.setScale('brain', true);
  }

  setScale(scale, zooming = false) {
    this.scale = scale;
    this.root.dataset.scale = scale;
    this.root.dataset.zooming = String(zooming);
    this.onScale(scale, zooming);
    this.render();
  }

  setLesson(lesson) {
    this.stop();
    this.lesson = lesson;
    this.reading = false;
    this.setScale(lesson === 'pump' ? 'membrane' : 'neuron');
  }

  get phase() { return this.lesson === 'pump' ? this.pumpStep : spikePhase(this.trace, this.time); }

  setStep(index) {
    this.stop();
    if (this.lesson === 'pump') { this.pumpStep = index; this.cycleElapsed = 0; }
    else if (this.trace.anchors[index] !== undefined) this.time = this.trace.anchors[index];
    this.refresh();
  }

  setStimulus(strength) {
    this.stop();
    this.strength = strength;
    this.trace = simulateSpike(strength);
    this.time = 0;
    this.render();
  }

  reset() {
    this.stop();
    this.time = 0;
    this.pumpStep = 0;
    this.cycleElapsed = 0;
    this.refresh();
  }

  start() {
    this.stop();
    if (this.time >= duration) this.time = 0;
    if (this.lesson === 'pump' && !this.cycleElapsed) this.pumpStep = 0;
    this.playing = true;
    this.startTime = null;
    this.refresh();
    this.frameId = requestAnimationFrame(this.frame);
  }

  stop() {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.playing = false;
  }

  togglePlay() {
    if (this.playing) { this.stop(); this.refresh(); }
    else this.start();
  }

  frame(now) {
    if (!this.playing) return;
    const previous = this.phase;
    if (this.startTime === null) this.startTime = now - (this.lesson === 'spike' ? this.time / duration * 6200 : this.cycleElapsed);
    const elapsed = now - this.startTime;
    if (this.lesson === 'pump') {
      this.pumpStep = Math.min(3, Math.floor(elapsed / 1250));
      if (elapsed >= 5000) { this.stop(); this.cycleElapsed = 0; }
      else this.cycleElapsed = elapsed;
    } else {
      this.time = Math.min(duration, elapsed / 6200 * duration);
      if (this.time >= duration) this.stop();
    }
    this.updateReadouts();
    if (previous !== this.phase || !this.playing) this.refresh();
    if (this.playing) this.frameId = requestAnimationFrame(this.frame);
  }

  renderSidebar() {
    const isPump = this.lesson === 'pump';
    const stages = isPump ? pumpStages : spikeStages;
    const list = $('#region-list');
    const focusedStep = list.contains(document.activeElement) ? document.activeElement.dataset.cellStep : undefined;
    list.innerHTML = `<div class="group-heading">${isPump ? 'PUMP CYCLE' : 'SPIKE PHASES'}</div>` + stages.map((item, index) => {
      const active = this.phase === index;
      const disabled = !isPump && index >= this.trace.anchors.length;
      const graded = !isPump && !this.trace.fired && index === 1 && !disabled;
      return `<button class="region-row ${active ? 'active' : ''}" data-cell-step="${index}" aria-pressed="${active}" ${disabled ? 'disabled' : ''}>
        <span class="cell-stage-number">${index + 1}</span><span><strong>${graded ? 'Graded response' : item.name}</strong><small>${graded ? 'Stimulus below threshold' : item.short}</small></span>
      </button>`;
    }).join('');
    if (focusedStep !== undefined) list.querySelector(`[data-cell-step="${focusedStep}"]`)?.focus({ preventScroll: true });
  }

  renderDetail() {
    const cite = this.cite;
    const pump = this.lesson === 'pump';
    const item = (pump ? pumpStages : spikeStages)[this.phase];
    const subthreshold = !pump && !this.trace.fired && this.phase > 0;
    const name = subthreshold ? 'Graded response' : item.name;
    const description = subthreshold ? 'This stimulus produces a small depolarisation followed by a return toward rest. Increase stimulus strength to explore the regenerative spike.' : item.description;
    const refs = cellularPaperIds[this.lesson];
    const phaseRefs = pump ? ['pumpMechanism','pumpReview']
      : this.phase === 0 ? ['membraneRest','membraneChannels']
      : this.phase === 3 || this.phase === 4 ? ['membraneChannels','refractory']
      : ['hodgkinHuxley','membraneChannels'];
    const readingLink = pump
      ? '<a class="anatomy-source" href="https://www.ncbi.nlm.nih.gov/books/NBK537088/" target="_blank" rel="noopener noreferrer">Pump physiology ↗</a>'
      : '<a class="anatomy-source" href="https://www.ncbi.nlm.nih.gov/books/NBK11146/" target="_blank" rel="noopener noreferrer">Refractory periods ↗</a>';
    const mechanisms = pump
      ? `<div class="cell-transport-summary"><strong>3 Na⁺ out</strong><strong>2 K⁺ in</strong><strong>1 ATP used</strong></div>
         <p class="model-note">Each cycle moves one net positive charge outward. Over time, the pump maintains the Na⁺ and K⁺ gradients that make electrical signalling possible.${cite('pumpReview','pumpMechanism')}</p>`
      : `<div class="cell-mechanisms">
           <p><strong>Voltage-gated Na⁺</strong>${subthreshold ? 'The stimulus produces too little inward current for a regenerative rise.' : item.sodium}${cite(...phaseRefs)}</p>
           <p><strong>Voltage-gated K⁺</strong>${subthreshold ? 'Resting and voltage-sensitive currents bring the voltage back toward baseline.' : item.potassium}${cite(...phaseRefs)}</p>
           <p><strong>Na⁺/K⁺ ATPase</strong>Maintains the gradients during and between spikes. Rapid voltage changes follow the channel currents.${cite('pumpReview','membraneChannels')}</p>
         </div>
         <p class="model-note">This classical squid axon simulation holds ion gradients constant and combines resting leak currents into one term. The neuron and membrane are schematic. Channel properties and resting voltages vary across cell types.${cite('hodgkinHuxley','membraneRest')}</p>`;
    const membraneNote = this.scale === 'membrane'
      ? `<p class="model-note">The bracket indicates the approximate lipid bilayer thickness.${cite('bilayer')}</p>`
      : '';
    const body = this.reading ? refs.map(this.paperCard).join('') + readingLink : `<p class="description">${description}${cite(...phaseRefs)}</p>${mechanisms}${membraneNote}`;
    $('#detail-panel').innerHTML = `
      <div class="detail-top">
        <div class="detail-eyebrow">${pump ? 'TRANSPORT CYCLE' : 'MEMBRANE VOLTAGE'}</div>
        <div class="selected-chip"><i></i>${pump ? 'Na⁺/K⁺ ATPase' : 'Action potential'}</div>
        <h2 class="detailed-name">${name}</h2>
        <p class="region-tagline">${subthreshold ? 'A stimulus below threshold' : item.short}</p>
      </div>
      <div class="detail-body">
        <button id="cell-research" class="cell-research-button" aria-pressed="${this.reading}">${this.reading ? 'Back to explanation' : 'Research and reading'}</button>
        ${body}
      </div>`;
  }

  render() {
    this.root.dataset.lesson = this.lesson;
    $('#cell-plot').innerHTML = voltagePlot(this.trace);
    $('#cell-stimulus').value = this.strength;
    $('#cell-strength').textContent = `${this.strength} µA/cm²`;
    this.refresh();
  }

  refresh() {
    const pump = this.lesson === 'pump';
    const stages = pump ? pumpStages : spikeStages;
    $('#cell-membrane').innerHTML = membraneDiagram(this.lesson, this.pumpStep);
    $('#cell-phase-name').textContent = !pump && !this.trace.fired && this.phase > 0 ? 'Graded response' : stages[this.phase].name;
    $('#cell-play').textContent = this.playing ? 'Pause' : pump ? (this.cycleElapsed > 0 ? 'Resume cycle' : 'Run cycle') : this.time > 0 && this.time < duration ? 'Resume' : 'Run stimulus';
    $('#cell-model-note').textContent = this.scale === 'brain' ? 'Cortical surface · zoom into the cellular scale' : this.scale === 'neuron' ? 'Schematic neuron · scale based on an illustrative 20 µm cell body' : pump ? 'Schematic transport cycle · bracket shows bilayer thickness' : 'Schematic membrane · bracket shows bilayer thickness';
    for (const button of this.root.querySelectorAll('[data-cell-scale]')) {
      const selected = button.dataset.cellScale === this.scale;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', selected);
    }
    for (const button of this.root.querySelectorAll('[data-cell-lesson]')) {
      const selected = button.dataset.cellLesson === this.lesson;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', selected);
    }
    const cycle = $('#cell-pump-steps');
    const focusedPumpStep = cycle.contains(document.activeElement) ? document.activeElement.dataset.cellStep : undefined;
    cycle.innerHTML = pumpStages.map((item, index) => `<button data-cell-step="${index}" class="${this.pumpStep === index ? 'active' : ''}" aria-pressed="${this.pumpStep === index}"><span>${index + 1}</span>${item.name}</button>`).join('');
    if (focusedPumpStep !== undefined) cycle.querySelector(`[data-cell-step="${focusedPumpStep}"]`)?.focus({ preventScroll: true });
    this.renderSidebar();
    this.renderDetail();
    this.updateReadouts();
  }

  updateReadouts() {
    const sample = spikeSample(this.trace, this.time);
    const x = plotX(this.time);
    $('#cell-vm').textContent = voltageText(sample.v);
    $('#cell-time').value = this.time;
    $('#cell-time-label').textContent = `${this.time.toFixed(1)} ms`;
    $('#cell-cursor-line').setAttribute('x1', x);
    $('#cell-cursor-line').setAttribute('x2', x);
    $('#cell-cursor-dot').setAttribute('cx', x);
    $('#cell-cursor-dot').setAttribute('cy', plotY(sample.v));
    $('#cell-membrane').dataset.sodium = String(sample.sodium < -10);
    $('#cell-membrane').dataset.potassium = String(sample.potassium > 10);
    const progress = (this.time - this.trace.starts[2]) / 6;
    const travelling = this.lesson === 'spike' && this.trace.fired && progress >= 0 && progress <= 1;
    this.onSignal(travelling ? progress : null);
  }
}
