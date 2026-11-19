import { GAMMA_DURATION_MS, gammaSteps, gammaEvents, gammaWaveform, gammaPhase } from './gamma-model.js?v=14';

const contexts = {visual:'Visual detection',auditory:'Auditory task',free:'Free reward'};
const conditions = {normal:'Regular input',suppress:'Suppress',evoke:'Evoke'};

export class GammaLesson {
 constructor({root,panel,cite,paperCard,onClose,onRegion,reducedMotion}) {
  Object.assign(this,{root,panel,cite,paperCard,onClose,onRegion,reducedMotion});
  this.active=false;
  this.step=0;
  this.context='visual';
  this.condition='normal';
  this.time=0;
  this.playing=false;
  this.circuit=null;
  this.circuitSide=null;
  this.lastFrame=null;
 }

 get events() { return gammaEvents(this.step,this.context,this.condition); }

 enter() {
  this.active=true;
  this.time=0;
  this.lastFrame=null;
  this.playing=!this.reducedMotion;
  document.body.dataset.gamma='true';
  this.root.classList.remove('hidden');
  this.renderTimeline();
  this.renderDetail();
 }

 exit() {
  if (!this.active) return;
  this.active=false;
  this.playing=false;
  this.lastFrame=null;
  delete document.body.dataset.gamma;
  this.root.classList.add('hidden');
  if(this.circuit)this.circuit.group.visible=false;
  this.onClose();
 }

 handle(button) {
  if (button.dataset.gammaStep!==undefined) {
   this.step=Number(button.dataset.gammaStep);
   this.time=0;
   this.playing=false;
   this.renderTimeline();
   this.renderDetail();
  }else if(button.dataset.gammaContext) {
   this.context=button.dataset.gammaContext;
   this.time=0;
   this.renderTimeline();
   this.renderDetail();
  }else if(button.dataset.gammaCondition) {
   this.condition=button.dataset.gammaCondition;
   this.time=0;
   this.renderTimeline();
   this.renderDetail();
  }else if(button.dataset.gammaEvent!==undefined) {
   this.seek(Number(button.dataset.gammaEvent));
  }else if(button.dataset.gammaRegion) {
   this.onRegion(button.dataset.gammaRegion);
  }else if(button.id==='gamma-play') {
   if(this.time>=GAMMA_DURATION_MS)this.time=0;
   this.playing=!this.playing;
   this.lastFrame=null;
   this.updateReadout();
  }else if(button.id==='gamma-close')this.exit();
 }

 seek(time) {
  this.time=Math.max(0,Math.min(GAMMA_DURATION_MS,Number(time)||0));
  this.playing=false;
  this.updateReadout();
 }

 renderDetail() {
  const {title,body}=gammaSteps[this.step];
  const tabs=gammaSteps.map((step,index)=>`<button data-gamma-step="${index}" aria-pressed="${this.step===index}" class="${this.step===index?'active':''}">${['Events','Circuit','Context'][index]}</button>`).join('');
  const controls=this.step===1
   ? `<div class="gamma-options" role="group" aria-label="Thalamic input condition">${Object.entries(conditions).map(([id,name])=>`<button data-gamma-condition="${id}" aria-pressed="${this.condition===id}" class="${this.condition===id?'active':''}">${name}</button>`).join('')}</div>`
   : this.step===2?`<div class="gamma-options" role="group" aria-label="Task context">${Object.entries(contexts).map(([id,name])=>`<button data-gamma-context="${id}" aria-pressed="${this.context===id}" class="${this.context===id?'active':''}">${name}</button>`).join('')}</div>`:'';
  const inhibition=this.step===1&&this.condition==='suppress'?'<span class="gamma-trn">TRN inhibition</span>':'';
  const help=['Select an event marker to pause on its waveform. Nearby markers form a bout.','Follow the pulse, then inspect the cortical layers. A false alarm is a lick without a visual stimulus.','Keep the waveform shape fixed while changing the distribution of events.'][this.step];
  this.panel.innerHTML=`<div class="detail-top gamma-detail-top"><div class="detail-eyebrow"><span>MOUSE · VISUAL CORTEX</span><button id="gamma-close" class="text-btn">Back to atlas</button></div><h2>Discrete gamma events</h2><p class="region-tagline">Perrenoud et al. · Nature · 2025</p></div><div class="gamma-tabs" role="group" aria-label="Gamma lesson">${tabs}</div><div class="detail-body gamma-detail-body"><h3>${title}</h3><p class="description">${body}${this.cite('mouseGamma')}</p>${controls}<p class="gamma-help">${help}${this.step===1?this.cite('mouseGamma'):''}</p><div class="gamma-layer-diagram" role="img" aria-label="Schematic dLGN input to cortical layer 4 and activity spreading through V1 layers"><div class="gamma-inputs">${inhibition}<div class="gamma-thalamus" data-gamma-node="thalamus">dLGN</div></div><div class="gamma-cortex"><span>V1 cortical layers</span><div data-gamma-layer="L2/3">L2/3</div><div data-gamma-layer="L4">L4</div><div data-gamma-layer="L5">L5</div></div></div><p class="gamma-note">Optogenetic interventions altered dLGN input.${this.cite('mouseGamma')} Layer timing and the 3D route are schematic.</p><div class="gamma-locate"><button data-gamma-region="mouse-visp">Locate V1</button><button data-gamma-region="mouse-lgd">Locate dLGN</button></div><p class="gamma-note">The traces use hand-placed events and arbitrary amplitude units. Animation runs at 0.1×. The paper’s CBASS method detected events in recorded signals.${this.cite('mouseGamma')}</p><details class="gamma-paper"><summary>Read the study</summary>${this.paperCard('mouseGamma')}</details></div>`;
  this.updateReadout();
 }

 renderTimeline() {
  const events=this.events;
  const points=Array.from({length:701},(_,index)=>{
   const time=index/700*GAMMA_DURATION_MS;
   return `${20+index},${68-gammaWaveform(time,events)*26}`;
  }).join(' ');
  const markers=events.map((time,index)=>`<button class="gamma-event" data-gamma-event="${time}" style="left:${(20+time/GAMMA_DURATION_MS*700)/740*100}%" aria-label="Inspect event ${index+1} at ${time} milliseconds" title="Event at ${time} ms"></button>`).join('');
  const response=this.step===2?`<line x1="603.3" x2="603.3" y1="15" y2="110" stroke="#9d79ab" stroke-dasharray="4 4"/><text x="597" y="25" text-anchor="end">Lick</text>`:'';
  const cue=this.step===2?this.context:'none';
  const cueImage=cue==='visual'?'<svg viewBox="0 0 40 30" aria-label="Visual grating cue" role="img"><defs><pattern id="gamma-grating" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><rect width="4" height="8" fill="#566a5c"/></pattern></defs><rect width="40" height="30" rx="3" fill="#e6ebdf"/><rect width="40" height="30" rx="3" fill="url(#gamma-grating)"/></svg>':cue==='auditory'?'<svg viewBox="0 0 40 30" aria-label="Auditory cue symbol" role="img"><path d="M0 15Q5 0 10 15T20 15T30 15T40 15" fill="none" stroke="#718e79" stroke-width="2"/></svg>':'';
  const status=this.step===2?contexts[this.context]:this.step===1?conditions[this.condition]:'Single events & a bout';
  this.root.innerHTML=`<div class="gamma-trace-heading"><strong>Illustrative V1 activity</strong><span class="gamma-cue">${cueImage}${status}</span></div><div class="gamma-trace"><svg viewBox="0 0 740 132" role="img" aria-label="Illustrative local field potential with marked discrete gamma events"><line x1="20" x2="720" y1="68" y2="68" stroke="#dce3d9"/><polyline points="${points}" fill="none" stroke="#526f67" stroke-width="1.8"/>${response}<line id="gamma-cursor" x1="20" x2="20" y1="14" y2="113" stroke="#c17d3f" stroke-width="2"/><text x="20" y="126">0</text><text x="370" y="126" text-anchor="middle">300</text><text x="720" y="126" text-anchor="end">600 ms</text><text x="20" y="14">LFP · a.u.</text></svg>${markers}</div><div class="gamma-time-controls"><button id="gamma-play">Play at 0.1×</button><input id="gamma-time" type="range" min="0" max="600" step="1" value="${this.time}" aria-label="Gamma timeline in milliseconds"><output id="gamma-time-label" for="gamma-time">0 ms</output></div><div class="gamma-trace-status"><span id="gamma-phase">Between events</span><span id="gamma-stimulus">Cue at 100 ms</span></div>`;
  this.updateReadout();
 }

 updateReadout() {
  if (!this.active) return;
  const phase=gammaPhase(this.time,this.events);
  const cursor=this.root.querySelector('#gamma-cursor');
  const x=20+this.time/GAMMA_DURATION_MS*700;
  cursor?.setAttribute('x1',String(x));
  cursor?.setAttribute('x2',String(x));
  const slider=this.root.querySelector('#gamma-time');
  if(slider)slider.value=String(this.time);
  const output=this.root.querySelector('#gamma-time-label');
  if(output)output.textContent=`${Math.round(this.time)} ms`;
  const play=this.root.querySelector('#gamma-play');
  if(play)play.textContent=this.playing?'Pause':this.time>=GAMMA_DURATION_MS?'Replay at 0.1×':'Play at 0.1×';
  const label=this.root.querySelector('#gamma-phase');
  if(label)label.textContent=phase.level>0?'Gamma event':'Between events';
  const stimulus=this.root.querySelector('#gamma-stimulus');
  const cue=this.step===2&&this.context==='auditory'?'Auditory cue':this.step===2&&this.context==='free'?'Free reward':'Visual cue';
  if(stimulus){
   let message='Select an event marker';
   if(this.step===1)message=this.condition==='suppress'?'TRN inhibition':this.condition==='evoke'?'dLGN terminal stimulation':'dLGN input';
   if(this.step===2)message=this.context==='free'?(this.time>=500?'Illustrative lick':'Free reward available'):this.time<100?`${cue} at 100 ms`:this.time<400?cue:this.time<500?'Response window':'Illustrative lick';
   stimulus.textContent=message;
  }
  for(const marker of this.root.querySelectorAll('[data-gamma-event]'))marker.classList.toggle('active',Math.abs(Number(marker.dataset.gammaEvent)-this.time)<15);
  for(const layer of this.panel.querySelectorAll('[data-gamma-layer]'))layer.classList.toggle('active',phase.layers.includes(layer.dataset.gammaLayer));
  this.panel.querySelector('[data-gamma-node]')?.classList.toggle('active',phase.level>0&&phase.relay<.4);
 }

 update(now) {
  if(!this.active)return;
  if(this.playing&&this.lastFrame!==null){
   this.time=Math.min(GAMMA_DURATION_MS,this.time+Math.max(0,Math.min(now-this.lastFrame,100))/10);
   if(this.time===GAMMA_DURATION_MS)this.playing=false;
  }
  this.lastFrame=now;
  this.updateReadout();
 }

 updateCircuit(THREE,mouseBrain,hemisphere) {
  if(!this.active||!mouseBrain)return;
  const side=hemisphere==='right'?'right':'left';
  if(this.circuitSide!==side){
   if(this.circuit){
    this.circuit.group.removeFromParent();
    for(const child of this.circuit.group.children){child.geometry.dispose();child.material.dispose();}
   }
   const sources=mouseBrain.meshes.filter(mesh=>mesh.userData.hemisphere===side);
   const center=id=>{
    const mesh=sources.find(mesh=>mesh.userData.region===id);
    const bounds=new THREE.Box3();
    for(const index of new Set(mesh.geometry.index.array))bounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,index));
    return bounds.getCenter(new THREE.Vector3());
   };
   const from=center('mouse-lgd'),to=center('mouse-visp');
   const middle=from.clone().lerp(to,.5).add(new THREE.Vector3(0,.2,0));
   const curve=new THREE.CatmullRomCurve3([from,middle,to]);
   const group=new THREE.Group();
   const route=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.012,6,false),new THREE.MeshBasicMaterial({color:'#8c9c80',transparent:true,opacity:.6,depthTest:false}));
   const pulse=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),new THREE.MeshBasicMaterial({color:'#d79c48',depthTest:false}));
   route.renderOrder=pulse.renderOrder=6;
   group.add(route,pulse);
   mouseBrain.hemispheres[side==='left'?0:1].add(group);
   this.circuit={group,curve,pulse};
   this.circuitSide=side;
  }
  const phase=gammaPhase(this.time,this.events);
  this.circuit.group.visible=true;
  this.circuit.pulse.visible=phase.level>0;
  this.circuit.pulse.position.copy(this.circuit.curve.getPoint(Math.min(1,phase.relay)));
  for(const mesh of mouseBrain.meshes){
   const node=mesh.userData.region==='mouse-visp'||mesh.userData.region==='mouse-lgd';
   mesh.visible=(hemisphere==='both'||mesh.userData.hemisphere===hemisphere)&&(node||!mesh.userData.region||!['mouse-ca1','mouse-dg','mouse-lc'].includes(mesh.userData.region));
   mesh.material.opacity=node?1:.045;
   mesh.material.transparent=!node;
   mesh.material.depthWrite=node;
   mesh.renderOrder=node?1:2;
   if(node){mesh.material.emissive.set('#bd873f');mesh.material.emissiveIntensity=.1+phase.level*.55;}
  }
 }
}
