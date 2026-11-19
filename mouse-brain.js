// Allen CCFv3 structure IDs refer to the 2017 annotation mesh release.
export const MOUSE_MM_PER_UNIT = 2.5;
export const mouseGroups = [['cortex','CORTICAL AREAS'],['olfactory','OLFACTORY BULB'],['deep','DEEP STRUCTURES'],['hindbrain','MIDBRAIN & HINDBRAIN']];

const area = (structureId, code, name, group, short, description, evidence, extra={}) => ({
 id:'mouse-'+code.toLowerCase(), structureId, code, name, group, short, description,
 layer:'mouse', color:{cortex:'#87aa9b',olfactory:'#b2b783',deep:'#b19ac3',hindbrain:'#8cacc1'}[group],
 papers:[...new Set([...evidence,'mouseCCF'])], connections:[], ...extra,
});

export const mouseRegions = [
 area(985,'MOp','Primary motor area','cortex','Movement & motor learning',
  'Motor cortex participates in controlling movement and changes as animals learn motor skills. Different tasks recruit different motor circuits.', ['mouseMotor'],{color:'#cf9683',human:'frontal'}),
 area(993,'MOs','Secondary motor area','cortex','Planning actions',
  'Frontal motor networks help prepare actions. In a whisker-based task, mouse motor cortex activity reflected the upcoming movement during a delay.', ['mouseTactile'],{color:'#d5ad84',human:'frontal'}),
 area(329,'SSp-bfd','Somatosensory barrel field','cortex','Whisker touch',
  'This whisker-related part of primary somatosensory cortex combines touch with movement signals. Its circuits support learned tactile behavior.', ['mouseWhisker'],{color:'#8daf9a',human:'parietal'}),
 area(1002,'AUDp','Primary auditory area','cortex','Sound processing',
  'Primary auditory cortex contains neurons tuned to sound frequencies. Studies map its frequency organization and how responses vary across cortical locations.', ['mouseAuditory'],{color:'#a19fc5',human:'temporal'}),
 area(385,'VISp','Primary visual area','cortex','Early cortical vision',
  'Primary visual cortex processes visual information and sends signals to several higher visual areas with different response properties.', ['mouseVisual'],{color:'#d1b36e',human:'occipital'}),
 area(972,'PL','Prelimbic area','cortex','Prefrontal circuits',
  'This medial prefrontal area connects with cingulate circuits studied in cognitive control and emotional regulation.', ['mouseCingulate'],{color:'#c58e9c',human:'frontal',view:'deep'}),
 area(31,'ACA','Anterior cingulate area','cortex','Cognition & behavior',
  'Rodent cingulate cortex contains subdivisions with different connections. Researchers study these circuits in relation to cognitive control and emotional behavior.', ['mouseCingulate'],{color:'#b3aa79',human:'cingulate',view:'deep'}),
 area(254,'RSP','Retrosplenial area','cortex','Context & navigation',
  'Retrosplenial circuits link visual and spatial information with learned actions. In mice, these networks help associate environmental context with motor choice.', ['mouseRetrosplenial'],{color:'#7faaa9',human:'cingulate',view:'deep'}),
 area(507,'MOB','Main olfactory bulb','olfactory','First stages of smell',
  'Olfactory sensory neurons send input to the bulb. Its glomerular circuits organize signals from odorant receptors before transmitting them onward.', ['mouseOlfaction'],{color:'#afb97e'}),
 area(1080,'HIP','Hippocampal region','deep','Memory circuits',
  'The hippocampal region includes fields CA1–CA3 and the dentate gyrus. Mouse experiments use selected hippocampal cell populations to investigate memory recall.', ['mouseEngram'],{color:'#6fae9f',human:'hippocampus',view:'deep'}),
 area(382,'CA1','Hippocampal field CA1','deep','Hippocampal subdivision',
  'CA1 is one of the named fields within the hippocampal region. Select the whole hippocampal region to see its position within the larger structure.', ['mouseCCF'],{color:'#82bcb1',human:'hippocampus',view:'deep',parent:'mouse-hip',connections:['mouse-hip','mouse-dg']}),
 area(726,'DG','Dentate gyrus','deep','Memory ensemble experiments',
  'Activating a tagged dentate gyrus cell population elicited conditioned freezing in mice. This experiment linked selected cells active during learning to later recall behavior.', ['mouseEngram'],{color:'#c4bc76',human:'hippocampus',view:'deep',parent:'mouse-hip',connections:['mouse-hip','mouse-ca1']}),
 area(672,'CP','Caudoputamen','deep','Striatal motor circuits',
  'This dorsal striatal territory contains direct- and indirect-pathway projection neurons. Optogenetic manipulation of these pathways altered motor behavior in mice.', ['mouseStriatum'],{color:'#bc9bca',human:'ganglia',view:'deep'}),
 area(549,'TH','Thalamus','deep','Sensory & motor loops',
  'Thalamic nuclei connect with distinct cortical circuits. In mice, reciprocal activity in a frontal thalamocortical loop helped maintain preparation for a future action.', ['mouseThalamus','mouseConnectome'],{color:'#cdab80',human:'thalamus',view:'deep'}),
 area(1097,'HY','Hypothalamus','deep','Motivation & body regulation',
  'Hypothalamic circuits organize motivated behaviors related to survival, including feeding and defense. Different nuclei contribute to different behavioral and bodily responses.', ['hypothalamus'],{color:'#c18b7b',human:'hypothalamus',view:'deep'}),
 area(295,'BLA','Basolateral amygdalar nucleus','deep','Positive & negative associations',
  'Distinct excitatory neuron populations in mouse basolateral amygdala participate in behaviors linked to positive and negative experiences.', ['mouseAmygdala'],{color:'#ce8f8b',human:'amygdala',view:'deep'}),
 area(294,'SCm','Superior colliculus, motor related','hindbrain','Orienting & defensive actions',
  'The superior colliculus transforms sensory information into actions such as orienting and defense. This selection highlights the atlas’s motor-related divisions.', ['mouseColliculus'],{color:'#ad9cbe',view:'deep'}),
 area(512,'CB','Cerebellum','hindbrain','Motor timing & learning',
  'Cerebellar circuits support learned, precisely timed movements. Mouse optogenetic experiments link Purkinje cell activity to learned eyelid movements.', ['mouseCerebellum'],{color:'#8fadc1',human:'cerebellum'}),
 area(771,'P','Pons','hindbrain','Brainstem circuits',
  'Pontine and connected brainstem networks contribute to sleep-state control and the regulation of breathing.', ['sleep','breathing'],{color:'#b5a28c',human:'brainstem',view:'deep'}),
 area(354,'MY','Medulla','hindbrain','Breathing & circulation',
  'Medullary circuits help generate breathing and regulate cardiovascular activity through interacting brainstem pathways.', ['breathing','bloodPressure'],{color:'#b8b499',human:'brainstem'}),
 area(147,'LC','Locus coeruleus','hindbrain','Norepinephrine & arousal',
  'In mice, optogenetic stimulation of locus coeruleus neurons changed cortical activity and promoted sleep-to-wake transitions. The effect depended on the stimulation pattern.', ['mouseArousal'],{color:'#6c9fc0',human:'locus-coeruleus',view:'deep',parent:'mouse-p'}),
];

export function buildMouseBrain(THREE, data) {
 const group = new THREE.Group();
 const meshes = [], hemispheres = [];
 const lookup = new Map(mouseRegions.map(region=>[region.structureId,region]));
 for (const side of ['left','right']) {
  const hemisphere = new THREE.Group();
  hemisphere.userData.side = side==='left'?-1:1;
  group.add(hemisphere);
  hemispheres.push(hemisphere);
 }
 for (const [key, surface] of Object.entries(data.meshes)) {
  const structureId = Number(key), region = lookup.get(structureId);
  const base = new THREE.BufferGeometry();
  base.setAttribute('position',new THREE.Float32BufferAttribute(surface.positions,3));
  base.setIndex(surface.indices);
  base.computeVertexNormals();
  const sides = {left:[],right:[]};
  for (let i=0;i<surface.indices.length;i+=3) {
   const triangle = surface.indices.slice(i,i+3);
   const x = triangle.reduce((sum,index)=>sum+surface.positions[index*3],0);
   sides[x<0?'left':'right'].push(...triangle);
  }
  for (const [side,indices] of Object.entries(sides)) {
   if (!indices.length) continue;
   const geometry = new THREE.BufferGeometry();
   geometry.setAttribute('position',base.attributes.position);
   geometry.setAttribute('normal',base.attributes.normal);
   geometry.setIndex(indices);
   const material = new THREE.MeshStandardMaterial({color:region?.color||'#b8c8bc',roughness:.82,side:THREE.DoubleSide});
   const mesh = new THREE.Mesh(geometry,material);
   mesh.userData = {region:region?.id,layer:'mouse',hemisphere:side,structureId,context:!region};
   hemispheres[side==='left'?0:1].add(mesh);
   meshes.push(mesh);
   if (region) {
    const bounds = new THREE.Box3();
    for (const index of new Set(indices)) bounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(base.attributes.position,index));
    region.positions??={};
    region.positions[side]=bounds.getCenter(new THREE.Vector3()).toArray();
    region.position=region.positions.left||region.positions.right;
   }
  }
 }
 return {group,meshes,hemispheres};
}

export function styleMouseMesh(mesh, selected, view, hemisphere, filter) {
 const region = mouseRegions.find(region=>region.id===mesh.userData.region);
 const active = region?.id===selected;
 const selection = mouseRegions.find(region=>region.id===selected);
 const visibleSide = hemisphere==='both'||hemisphere===mesh.userData.hemisphere;
 const visibleInView = active||(view==='deep'?region?.group!=='cortex':!region?.view);
 mesh.visible = visibleSide&&(mesh.userData.context||(visibleInView&&!region?.parent&&(filter==='all'||region?.group===filter))||active);
 if (!mesh.visible) return;
 const parentOfSelection = region?.id===selection?.parent;
 let opacity = active ? 1 : (region?.parent || parentOfSelection) ? .08 : view==='deep' ? .38 : .78;
 if (mesh.userData.context) opacity=mesh.userData.structureId===997?.025:view==='deep'?.045:.32;
 mesh.material.color.set(region?.color||'#bac9bd');
 mesh.material.emissive.set(active?region.color:'#000000');
 mesh.material.emissiveIntensity=active?.16:0;
 mesh.material.opacity=opacity;
 mesh.material.transparent=opacity<1;
 mesh.material.depthWrite=opacity>.9;
 mesh.renderOrder=opacity<.1?3:0;
}
