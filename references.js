// Contextual sources complement the papers in the research library.
const sources = {
  corticalAnatomy: {label:'Javed et al., Cerebral Cortex', url:'https://www.ncbi.nlm.nih.gov/books/NBK537247/'},
  centralAnatomy: {label:'Margetis et al., Central Nervous System', url:'https://www.ncbi.nlm.nih.gov/books/NBK542179/'},
  internalAnatomy: {label:'Purves et al., Internal Anatomy', url:'https://www.ncbi.nlm.nih.gov/books/NBK10889/'},
  ventricles: {label:'Purves et al., Ventricular System', url:'https://www.ncbi.nlm.nih.gov/books/NBK11083/'},
  anatomicalPlanes: {label:'OpenStax, Anatomical Terminology', url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-6-anatomical-terminology'},
  t1Contrast: {label:'UC San Diego, T1 Image Contrast', url:'https://fmri.ucsd.edu/Howto/3T/structure.html'},
  fsaverage: {label:'MNE, FreeSurfer and fsaverage', url:'https://mne.tools/stable/auto_tutorials/forward/10_background_freesurfer.html'},
  surface: {label:'Nilearn, fsaverage5', url:'https://nilearn.github.io/stable/modules/description/fsaverage5.html'},
  ras: {label:'FreeSurfer Coordinate Systems', url:'https://surfer.nmr.mgh.harvard.edu/fswiki/CoordinateSystems'},
  mriMetadata: {label:'Cortex MRI data and coordinates', url:'./assets/mri/metadata.json'},
  segmentationLabels: {label:'FreeSurfer label definitions', url:'https://github.com/freesurfer/freesurfer/blob/dev/distribution/FreeSurferColorLUT.txt'},
  membraneRest: {label:'Purves et al., Resting Potential', url:'https://www.ncbi.nlm.nih.gov/books/NBK10844/'},
  membraneChannels: {label:'Purves et al., Voltage-Dependent Permeability', url:'https://www.ncbi.nlm.nih.gov/books/NBK11003/'},
  refractory: {label:'Purves et al., Refractory Period', url:'https://www.ncbi.nlm.nih.gov/books/NBK11146/'},
  pumpMechanism: {label:'StatPearls, Sodium Potassium Pump', url:'https://www.ncbi.nlm.nih.gov/books/NBK537088/'},
  bilayer: {label:'Alberts et al., Membrane Structure', url:'https://eva.fcien.udelar.edu.uy/pluginfile.php/154709/mod_folder/content/0/Membrane%20Structure%20-%20Alberts%20-%20Molecular%20Biology%20of%20the%20Cell%206th%20edition.pdf'},
};

const escapeHTML = value => String(value).replace(/[&<>"']/g, character =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[character]);

function shortAuthors(authors) {
  const pair = authors.match(/^([^,]+),[^,]* & ([^,]+),/);
  if (pair) return `${pair[1]} & ${pair[2]}`;
  const first = authors.split(',')[0];
  return authors.includes('et al.') || authors.includes(' & ') ? `${first} et al.` : first;
}

export function paperURL(paper) {
  return paper.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/` : `https://doi.org/${encodeURI(paper.doi)}`;
}

export function renderCitations(papers, references) {
  const links = new Map();
  for (const reference of references) {
    const paper = papers[reference];
    const source = paper
      ? {label:`${shortAuthors(paper.authors)}, ${paper.year}`, url:paperURL(paper), title:paper.title}
      : sources[reference] || reference;
    if (source?.url && !links.has(source.url)) links.set(source.url, source);
  }
  if (!links.size) return '';
  return ` <span class="inline-citations">(${[...links.values()].map(({label,url,title}) =>
    `<a href="${escapeHTML(url)}" title="${escapeHTML(title || label)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`).join(' · ')})</span>`;
}

// Match the overview, each function, and the illustrative example to the relevant studies.
export const regionEvidence = {
  frontal: {overview:['miller','motorMap','speech'], functions:[['miller','diamond'],['motorMap','premotor'],['speech','miller']], example:['miller','diamond']},
  parietal: {overview:['touch','attention','vision'], functions:[['touch'],['attention'],['vision']], example:['touch','vision']},
  temporal: {overview:['humanAuditory','speech','memory','faceNetwork'], functions:[['humanAuditory'],['speech'],['faceNetwork','memory']], example:['humanAuditory','speech']},
  occipital: {overview:['retinotopy','visualmaps','vision'], functions:[['hubel','visualmaps'],['visualmaps'],['vision']], example:['retinotopy','vwfa','attention']},
  insula: {overview:['corticalAnatomy','insulaMeta','insula'], functions:[['insula'],['insulaMeta'],['insulaMeta','insula']], example:['insula']},
  cingulate: {overview:['cingulate','posteriorCingulate'], functions:[['cingulate'],['cingulate'],['posteriorCingulate']], example:['cingulate']},
  cerebellum: {overview:['centralAnatomy','cerebellarAdaptation','cerebellum'], functions:[['centralAnatomy','cerebellarAdaptation'],['cerebellarAdaptation'],['cerebellum']], example:['cerebellarAdaptation']},
  brainstem: {overview:['centralAnatomy','breathing','bloodPressure','sleep'], functions:[['breathing','bloodPressure'],['sleep'],['centralAnatomy']], example:['sleep']},
  'locus-coeruleus': {overview:['locusCoeruleusMapping','locusCoeruleusCognition','locusCoeruleusAdaptiveGain'], functions:[['locusCoeruleusAdaptiveGain'],['locusCoeruleusAdaptiveGain','locusCoeruleusCognition'],['locusCoeruleusCognition']], example:['locusCoeruleusCognition'], location:['locusCoeruleusMapping']},
  hippocampus: {overview:['internalAnatomy','memory','taxi'], functions:[['memory','ca1Lesion'],['taxi'],['memory']], example:['taxi']},
  amygdala: {overview:['internalAnatomy','amygdalaCircuits','amygdalaMemory'], functions:[['amygdalaCircuits'],['emotion','amygdalaCircuits'],['amygdalaMemory']], example:['emotion']},
  thalamus: {overview:['thalamus','pulvinar'], functions:[['thalamus'],['thalamus'],['pulvinar','sleep']], example:['thalamus','retinotopy']},
  ganglia: {overview:['ganglia','striatalMotor','habits'], functions:[['ganglia','habits'],['striatalMotor'],['habits']], example:['striatalMotor','habits']},
  hypothalamus: {overview:['homeostasis','hypothalamus','sleep'], functions:[['homeostasis'],['centralAnatomy','homeostasis'],['hypothalamus']], example:['hypothalamus','homeostasis']},
};

export const sliceEvidence = {
  cortex:['corticalAnatomy'], white:['internalAnatomy'], lateral:['ventricles'], third:['ventricles'], fourth:['ventricles'],
  thalamus:['internalAnatomy','thalamus'], caudate:['internalAnatomy'], putamen:['internalAnatomy'], pallidum:['internalAnatomy'],
  hippocampus:['internalAnatomy','memory'], amygdala:['internalAnatomy','amygdalaCircuits'], accumbens:['internalAnatomy'],
  ventral:['segmentationLabels'], brainstem:['centralAnatomy'], cerebellum:['centralAnatomy'], 'cerebellar-white':['centralAnatomy'],
  callosum:['internalAnatomy','callosum'], choroid:['ventricles'], csf:['segmentationLabels'],
};
