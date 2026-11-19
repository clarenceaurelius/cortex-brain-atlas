// Deterministic teaching traces. Times, amplitudes and event counts are illustrative.
export const GAMMA_DURATION_MS = 600;
export const gammaSteps = [
 {title:'Inspect an event',body:'V1 gamma events (30–80 Hz) occurred singly and in short bouts. They synchronized firing across cortical layers.'},
 {title:'Follow the circuit',body:'Patterned dLGN input evoked V1 events. Recruiting inhibitory TRN input suppressed them. Suppression impaired visual detection; evocation increased false alarms in trained mice.'},
 {title:'Change the task',body:'Event rates rose before visually cued responses. Their relation to behavior changed when reward contingencies or the relevant sensory modality changed.'},
];

export function gammaEvents(step, context, condition) {
 if (step===0) return [65,165,189,213,355,455,479];
 if (step===1) {
  if (condition==='suppress') return [70,350];
  if (condition==='evoke') return [95,190,214,238,360,455,479,503];
  return [70,170,194,218,350,455,479];
 }
 if (context==='visual') return [55,145,228,298,354,397,431,457,480,503,550];
 return [55,150,245,340,435,550];
}

export function gammaWaveform(time, events) {
 let value=.045*Math.sin(time*.083)+.025*Math.sin(time*.177);
 for (const event of events) {
  const x=(time-event)/5;
  // A brief biphasic deflection gives each network event a visible waveform.
  value-=(1-x*x)*Math.exp(-x*x/2);
 }
 return value;
}

export function gammaPhase(time, events) {
 const event=events.find(event=>time>=event-12&&time<=event+18);
 if (event===undefined) return {level:0,relay:0,layers:[]};
 const relay=(time-event+12)/30;
 const level=Math.sin(relay*Math.PI);
 const layers=relay<.4?['L4']:['L4','L2/3','L5'];
 return {level,relay,layers};
}
