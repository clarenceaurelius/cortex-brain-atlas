export const duration = 22;
export const stimulusStart = 2;
export const stimulusEnd = 3;
const step = 0.01;
const recordEvery = 4;

// Classical Hodgkin–Huxley squid axon, with voltages expressed inside minus outside.
// Conductances are mS/cm², current densities µA/cm², and capacitance 1 µF/cm².
function trap(value, scale) {
  return Math.abs(value) < 1e-7 ? scale : value / -Math.expm1(-value / scale);
}

function rates(v) {
  return [
    [0.1 * trap(v + 40, 10), 4 * Math.exp(-(v + 65) / 18)],
    [0.07 * Math.exp(-(v + 65) / 20), 1 / (1 + Math.exp(-(v + 35) / 10))],
    [0.01 * trap(v + 55, 10), 0.125 * Math.exp(-(v + 65) / 80)],
  ];
}

export function simulateSpike(strength = 14) {
  const stimulus = Number.isFinite(strength) ? Math.max(0, Math.min(24, strength)) : 14;
  let v = -65;
  const gates = rates(v).map(([a, b]) => a / (a + b));
  const samples = [];
  const count = Math.round(duration / step);
  for (let index = 0; index <= count; index++) {
    const time = index * step;
    const [m, h, n] = gates;
    const sodium = 120 * m ** 3 * h;
    const potassium = 36 * n ** 4;
    if (index % recordEvery === 0) {
      samples.push({ time, v, h, sodium: sodium * (v - 50), potassium: potassium * (v + 77) });
    }
    const input = time >= stimulusStart && time < stimulusEnd ? stimulus : 0;
    const conductance = sodium + potassium + 0.3;
    const equilibrium = (input + sodium * 50 - potassium * 77 - 0.3 * 54.387) / conductance;
    const coefficients = rates(v);
    for (let gate = 0; gate < gates.length; gate++) {
      const [alpha, beta] = coefficients[gate];
      const steadyState = alpha / (alpha + beta);
      gates[gate] = steadyState + (gates[gate] - steadyState) * Math.exp(-(alpha + beta) * step);
    }
    v = equilibrium + (v - equilibrium) * Math.exp(-conductance * step);
  }

  const peak = samples.reduce((best, sample) => sample.v > best.v ? sample : best);
  const fired = peak.v > 0;
  if (!fired) {
    const starts = stimulus ? [0, stimulusStart] : [0];
    const anchors = stimulus ? [0.8, 3] : [0.8];
    return { samples, fired, peak, starts, anchors };
  }

  const rise = samples.find(sample => sample.time > stimulusStart && sample.time < peak.time && sample.v >= -50);
  const afterPeak = samples.filter(sample => sample.time > peak.time);
  const undershoot = afterPeak.find(sample => sample.v < -65);
  const trough = afterPeak.reduce((lowest, sample) => sample.v < lowest.v ? sample : lowest, peak);
  const starts = [0, stimulusStart, rise?.time ?? peak.time, peak.time];
  if (undershoot) starts.push(undershoot.time, trough.time);
  const anchors = starts.map((start, index) => (start + (starts[index + 1] ?? duration)) / 2);
  return { samples, fired, peak, trough, starts, anchors };
}

export function spikePhase(trace, time) {
  let phase = 0;
  while (phase + 1 < trace.starts.length && time >= trace.starts[phase + 1]) phase++;
  return phase;
}

export function spikeSample(trace, time) {
  const index = Math.round(time / (step * recordEvery));
  return trace.samples[Math.max(0, Math.min(index, trace.samples.length - 1))];
}

// A stylized unmyelinated neuron for the scale transition and signal animation.
export function buildNeuron(THREE) {
  const group = new THREE.Group();
  const fiber = new THREE.MeshStandardMaterial({ color: '#6c977b', roughness: 0.63 });
  const axonMaterial = new THREE.MeshStandardMaterial({ color: '#4f8377', roughness: 0.63 });
  const somaMaterial = new THREE.MeshStandardMaterial({ color: '#b49b6c', roughness: 0.58 });
  const somaGeometry = new THREE.SphereGeometry(1, 40, 28);
  const positions = somaGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const contour = 1 + 0.07 * Math.sin(5 * x + 2 * y) * Math.cos(6 * y - 3 * z);
    positions.setXYZ(i, x * contour * 0.9, y * contour * 0.65, z * contour * 0.54);
  }
  somaGeometry.computeVertexNormals();
  group.add(new THREE.Mesh(somaGeometry, somaMaterial));

  function branch(points, radius, material = fiber) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), material));
    return curve;
  }

  const stems = [
    [[-0.48, 0.32, 0], [-1.1, 0.78, -0.14], [-1.76, 1.32, 0.06]],
    [[-0.60, 0.12, 0.1], [-1.47, 0.22, 0.19], [-2.37, 0.59, -0.05]],
    [[-0.60, -0.17, 0], [-1.42, -0.56, -0.19], [-2.35, -0.43, 0.08]],
    [[-0.25, -0.41, 0.1], [-0.68, -1.01, 0.18], [-1.27, -1.51, 0]],
    [[0.03, 0.44, -0.14], [0.28, 1.01, -0.33], [0.11, 1.48, -0.23]],
  ];
  stems.forEach((points, i) => {
    branch(points, 0.078 - i * 0.006);
    const tip = points[2];
    for (let j = 0; j < 3; j++) {
      const direction = (j - 1) * 0.45;
      const end = [tip[0] - 0.63 + j * 0.09, tip[1] + direction, tip[2] + 0.12 * (j - 1)];
      branch([tip, [tip[0] - 0.28, tip[1] + direction * 0.35, end[2]], end], 0.032);
      branch([end, [end[0] - 0.19, end[1] + 0.11, end[2] - 0.1], [end[0] - 0.42, end[1] + 0.17, end[2] - 0.03]], 0.016);
      branch([end, [end[0] - 0.16, end[1] - 0.11, end[2] + 0.12], [end[0] - 0.35, end[1] - 0.21, end[2] + 0.07]], 0.014);
    }
  });

  const axon = branch([[0.57, -0.04, 0], [1.19, -0.32, 0.1], [2.2, -0.48, 0.14], [3.12, -0.2, -0.04]], 0.073, axonMaterial);
  for (const offset of [-0.46, 0, 0.42]) {
    branch([[3.07, -0.21, -0.04], [3.55, -0.15 + offset * 0.55, -0.11], [3.98, -0.13 + offset, 0.02]], 0.035, axonMaterial);
  }
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), new THREE.MeshBasicMaterial({ color: '#5fcbbd' }));
  pulse.visible = false;
  group.add(pulse);
  group.visible = false;
  return {
    group,
    signal(progress) {
      pulse.visible = progress !== null;
      if (pulse.visible) pulse.position.copy(axon.getPointAt(progress));
    },
  };
}
