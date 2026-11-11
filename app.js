import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { regions as broadRegions, papers } from './data.js?v=7';
import { SliceViewer } from './slice-viewer.js?v=6';
import { imageToRAS, rasToScene, SCENE_MM_PER_UNIT } from './slice-data.js?v=6';
import { CellularViewer, cellularPapers, cellularPaperIds } from './cellular-viewer.js?v=6';
import { buildNeuron } from './cellular-model.js';
import { renderScaleBar } from './scale-bar.js';
import { anatomy, functional, pathways, extraPapers, layerGroups, layerNotes } from './atlas-data.js?v=9';
Object.assign(papers,extraPapers,cellularPapers);
const regions=[...broadRegions,...anatomy,...functional,...pathways];

const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];
const paths = {
 brain:'M12 4.5c-1.2-2-4.6-1.3-4.9 1.1-2.8-.1-4.2 3-2.8 5-2 2-1 5 1.2 5.5-.7 3.5 3.2 5.4 5.5 3.1.7-.7 1-1.7 1-2.7V4.5Zm0 0c1.2-2 4.6-1.3 4.9 1.1 2.8-.1 4.2 3 2.8 5 2 2 1 5-1.2 5.5.7 3.5-3.2 5.4-5.5 3.1-.7-.7-1-1.7-1-2.7M7 6c-.2 1.6.8 2.7 2.3 2.8m-4.8 2c1.5-.4 3 .4 3.2 2m-1.2 3.3c1.8-.2 2.8.5 3 1.8M17 6c.2 1.6-.8 2.7-2.3 2.8m4.8 2c-1.5-.4-3 .4-3.2 2m1.2 3.3c-1.8-.2-2.8.5-3 1.8',
 search:'m20 20-4-4M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
 'arrow-right':'M4 12h16m-6-6 6 6-6 6','arrow-left':'M20 12H4m6-6-6 6 6 6','arrow-up-right':'M6 18 18 6M6 6h12v12',
 sparkles:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm7-2v4m-2-2h4',
 shuffle:'M3 6h3c4 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c4 0 7-12 12-12h3m-4-4 4 4-4 4',
 network:'M7 7 17 5m-9 4 3 8m5-9-3 9M8 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm14-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-7 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 info:'M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 layers:'m12 3 10 6-10 6L2 9l10-6Zm-10 9 10 6 10-6M2 16l10 6 10-6',
 scan:'M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m8 0h4a1 1 0 0 0 1-1v-4M9 9h6v6H9V9Z',
 mouse:'M8 3h8a3 3 0 0 1 3 3v10a7 7 0 0 1-14 0V6a3 3 0 0 1 3-3Zm4 0v7M5 10h14',
 tag:'M20 13 13 20a2 2 0 0 1-3 0l-8-8V3h9l9 8a2 2 0 0 1 0 2ZM7 7h.01',
 split:'M9 3H4v18h5M15 3h5v18h-5M12 4v3m0 4v2m0 4v3',
 rotate:'M20 7a9 9 0 1 0 1 9M20 2v5h-5',reset:'M3 10a9 9 0 1 1 1 8M3 4v6h6',
 expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',plus:'M12 5v14M5 12h14',minus:'M5 12h14',
 bookmark:'M6 3h12v18l-6-4-6 4V3Z',pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 target:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-4 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-4 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
 activity:'M2 12h5l3-8 4 16 3-8h5',message:'M21 15a3 3 0 0 1-3 3H7l-5 4V5a3 3 0 0 1 3-3h13a3 3 0 0 1 3 3v10Z',
 bulb:'M9 18h6m-5 3h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z',
 book:'M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1m0-15c3-2 7-2 10-1v15c-3-1-7-1-10 1V5Z',x:'m6 6 12 12M6 18 18 6',check:'m5 12 4 4L19 6',copy:'M9 9h12v12H9V9Zm6-4V2H2v13h3',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.brain}"/></svg>`;
function icons(root=document){$$('[data-icon]',root).forEach(el=>{el.innerHTML=icon(el.dataset.icon);el.removeAttribute('data-icon');});}
icons();

function readSaved(key){try{return JSON.parse(localStorage.getItem(key)||'[]');}catch{return [];}}
let savedPapers = new Set(readSaved('cortex-reading-list'));
let savedRegions = new Set(readSaved('cortex-saved-regions'));
let selected='frontal', filter='all', detailTab='overview', view='surface', labelsOn=true, separated=false;
let layer='regions', hemisphere='both';
const currentItems=()=>regions.filter(r=>(r.layer||'regions')===layer);
let tourStep=-1, toastTimer, librarySaved=false;
const region = id => regions.find(r=>r.id===id);
const htmlEscape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
function persist(){try{localStorage.setItem('cortex-reading-list',JSON.stringify([...savedPapers]));localStorage.setItem('cortex-saved-regions',JSON.stringify([...savedRegions]));}catch{notify('Your browser could not save this reading list.');}$('#saved-count').textContent=savedPapers.size||'';}
persist();

function renderRegions(){
 if(layer==='cellular'){cellularViewer.renderSidebar();return;}
 if(layer==='slices'){sliceViewer.renderSidebar($('#region-search').value);return;}
 const query=$('#region-search').value.toLowerCase().trim();
 const groups=layerGroups[layer];
 const includeLocusCoeruleus=layer==='regions'&&filter==='deep';
 const filteredItems=currentItems().filter(r=>{
  const matchesFilter=filter==='all'||r.group===filter||(includeLocusCoeruleus&&r.id==='locus-coeruleus');
  const searchText=`${r.name} ${r.short} ${r.description} ${(r.functions||[]).flat().join(' ')} ${(r.overviewSections||[]).flat().join(' ')} ${r.code||''}`.toLowerCase();
  return matchesFilter&&(!query||searchText.includes(query));
 });
 let found=0;
 $('#region-list').innerHTML=groups.map(([key,title])=>{
  const group=filteredItems.filter(r=>r.group===key);
  found+=group.length;
  return group.length?`<div class="group-heading">${title}<span>${group.length}</span></div>`+group.map(r=>`<button class="region-row ${selected===r.id?'active':''}" data-region="${r.id}" style="--region-color:${r.color}" aria-pressed="${selected===r.id}"><span class="region-dot"></span><span><strong>${r.name}</strong><small>${r.short}</small></span>${icon('arrow-right')}</button>`).join(''):'';
 }).join('');
 if(!found)$('#region-list').innerHTML='<div class="no-results">No regions found.<br>Try “memory”, “vision”, or “movement”.</div>';
}

function paperCard(id){
 const p=papers[id], saved=savedPapers.has(id);
 const pubmed=p.pmid?`<a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener noreferrer">PubMed ${icon('arrow-up-right')}</a>`:'';
 return `<article class="paper-card"><div class="paper-meta"><span class="paper-type">${p.type}</span><span>${p.year}</span>${p.pmc||p.openAccess?'<span>· Free full text</span>':''}</div><button class="paper-save icon-button ${saved?'active':''}" data-save-paper="${id}" aria-label="${saved?'Remove from':'Add to'} reading list" aria-pressed="${saved}">${icon(saved?'check':'bookmark')}</button><h3>${p.title}</h3><div class="paper-authors">${p.authors}<br><em>${p.journal}</em></div><p class="paper-summary">${p.summary}</p><div class="paper-actions">${pubmed}${p.pmc?`<a href="https://pmc.ncbi.nlm.nih.gov/articles/${p.pmc}/" target="_blank" rel="noopener noreferrer">Full text ${icon('arrow-up-right')}</a>`:`<a href="https://doi.org/${encodeURI(p.doi)}" target="_blank" rel="noopener noreferrer">${p.openAccess?'Full text':'Publisher'} ${icon('arrow-up-right')}</a>`}<button class="copy-citation" data-copy="${id}">Copy citation</button></div></article>`;
}

function miniPaper(paper){
 const url=paper.pmid?`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`:`https://doi.org/${encodeURI(paper.doi)}`;
 return `<a class="mini-paper" href="${url}" target="_blank" rel="noopener noreferrer"><h4>${paper.title}</h4><p>${paper.authors} · ${paper.year}</p><span>${paper.pmid?'Read on PubMed':'Read the article'} ${icon('arrow-up-right')}</span></a>`;
}

function renderDetail(){
 if(layer==='cellular'){cellularViewer.renderDetail();return;}
 if(layer==='slices'){sliceViewer.renderDetail();return;}
 const r=region(selected);document.documentElement.style.setProperty('--accent',r.color);
 if(r.layer){renderAtlasDetail(r);return;}
 $('#detail-panel').innerHTML=`<div class="detail-top"><div class="detail-eyebrow"><span>REGION IN FOCUS</span><button class="icon-button ${savedRegions.has(r.id)?'active':''}" id="save-region" aria-pressed="${savedRegions.has(r.id)}" title="Bookmark region" aria-label="Bookmark ${r.name}">${icon(savedRegions.has(r.id)?'check':'bookmark')}</button></div><div class="selected-chip"><i></i>${r.group==='cortex'?'Cerebral cortex':r.group==='deep'?'Deep structure':'Cerebellum & brainstem'}</div><h2>${r.name}</h2><p class="latin">${r.latin}</p><p class="region-tagline">${r.tagline}</p></div><div class="detail-tabs" role="tablist" aria-label="Region details"><button role="tab" aria-selected="${detailTab==='overview'}" data-tab="overview" class="${detailTab==='overview'?'active':''}">Overview</button><button role="tab" aria-selected="${detailTab==='research'}" data-tab="research" class="${detailTab==='research'?'active':''}">Research <span class="tab-count">${r.papers.length}</span></button></div><div class="detail-body" role="tabpanel">${detailTab==='overview'?`
 <p class="description">${r.description}</p><div class="location">${icon('pin')}<span>${r.location}</span></div>${r.pathway?`<button class="primary-button projection-link" data-region="${r.pathway}">${icon('network')} Explore LC projections</button>`:''}<h3 class="section-title">WHAT IT HELPS YOU DO</h3><div class="function-list">${r.functions.map(([title,body],i)=>`<div class="function-item"><span class="function-icon">${icon(['target','activity','message'][i])}</span><div><h4>${title}</h4><p>${body}</p></div></div>`).join('')}</div><div class="everyday"><div>${icon('bulb')} In everyday life</div><p>${r.example}</p></div>${r.clinicalNote?`<h3 class="section-title">PARKINSON’S DISEASE</h3><p class="description">${r.clinicalNote}</p>`: ''}<div class="connections-section"><h3 class="section-title">EXPLORE RELATED REGIONS</h3><div class="connected">${r.connections.map(id=>`<button data-region="${id}" style="--region-color:${region(id).color}"><span class="region-dot"></span>${region(id).name}</button>`).join('')}</div></div><div class="research-preview"><div class="section-title-row"><h3 class="section-title">FOLLOW THE SCIENCE</h3><button data-tab="research">View ${r.papers.length} papers ${icon('arrow-right')}</button></div>${miniPaper(papers[r.papers[0]])}</div>${r.schematic?`<p class="model-note">${r.modelNote||'This structure is shown schematically. Its shape, scale, and placement are approximate.'}</p>`:''}`:`<p class="description">A curated starting point for understanding this region. These foundational papers include reviews and original studies.</p>${r.papers.map(paperCard).join('')}<p class="model-note">Findings describe interacting networks. A paper about one region does not establish that a function belongs only to that region.</p>`}<div class="detail-navigator"><span>${String(broadRegions.indexOf(r)+1).padStart(2,'0')} / ${broadRegions.length} REGIONS</span><button id="next-region">Next region ${icon('arrow-right')}</button></div></div>`;
}

function selectRegion(id,focus=true){
 const r=region(id);if(!r)return;
 const nextLayer=r.layer||'regions';
 if(nextLayer!==layer)configureLayer(nextLayer);
 selected=id;detailTab='overview';
 if(r.layer){
  if(r.layer==='pathways'){setView('deep',false);setHemisphere('both');}
  else {setView(r.parcels?.some(n=>[17,18,33,35,36,48,49,50].includes(n))?'deep':'surface',false);setHemisphere(r.preferredSide||'left');}
  if(focus)setCameraPreset(r.camera||(r.layer==='pathways'?'lateral':'lateral'));
 } else {
  setHemisphere('both');
  if(r.group==='deep'||['insula','cingulate','locus-coeruleus'].includes(id))setView('deep',false);
  else if(view==='deep')setView('surface',false);
  if(focus)focusRegion(id);
 }
 renderRegions();renderDetail();updateMaterials();
 $('#detail-panel').scrollTop=0;
}
function exploreRandomRegion(){
 const choices=regions.filter(r=>r.layer!=='pathways'&&r.id!==selected);
 const next=choices[Math.floor(Math.random()*choices.length)];
 tourStep=-1;
 renderTour();
 configureLayer(next.layer||'regions');
 selectRegion(next.id);
}
function configureLayer(next){
 if(layer==='slices'&&next!=='slices')sliceViewer.exit();
 if(layer==='cellular'&&next!=='cellular'){
  cancelCellularZoom();
  cellularViewer.exit();
  if(neuronScene)neuronScene.group.visible=false;
  if(controls)controls.maxDistance=12;
  stage.setAttribute('aria-label',brainStageLabel);
  cameraMotion=null;
  delete document.body.dataset.cellularScale;
 }
 layer=next;
 $$('[data-layer]').forEach(b=>{b.classList.toggle('active',b.dataset.layer===layer);b.setAttribute('aria-pressed',b.dataset.layer===layer);});
 document.body.dataset.layer=layer;
 if(next==='slices'||next==='cellular'){
  const cellular=next==='cellular';
  lastSliceView=null;
  $('#sidebar-heading').textContent=cellular?'Cellular neuroscience':'Sections & MRI';
  $('#item-count').textContent=cellular?'2':'3';
  $('.sidebar-intro').textContent=cellular?'From a cortical surface to a cell.':'Look beneath the surface.';
  if(brain)createLabels();return;
 }filter='all';$('#region-search').value='';
 const titles={regions:'Brain regions',anatomy:'Gyri, sulci & fissures',functional:'Functional areas',pathways:'Common pathways'};
 $('#sidebar-heading').textContent=titles[layer];$('#item-count').textContent=currentItems().length;
 $('.sidebar-intro').textContent={regions:'Every region has a story.',anatomy:'Follow the folds.',functional:'Explore the cortical systems.',pathways:'Follow the connections.'}[layer];
 $('.region-filter').innerHTML='<button data-filter="all" class="active">All</button>'+layerGroups[layer].map(([id,name])=>`<button data-filter="${id}">${{cortex:'Cortical',hindbrain:'Hindbrain',deep:'Deep',gyri:'Gyri',sulci:'Sulci',fissures:'Fissures',visual:'Visual',auditory:'Auditory',motor:'Motor',sensory:'Sensory',association:'Other',language:'Language',commissural:'Callosal',neuromodulatory:'Neuromodulatory'}[id]}</button>`).join('');
 $('#layer-note').textContent=layerNotes[layer];
 if(brain)createLabels();
}
function setLayer(next){
 configureLayer(next);
 if(next==='cellular'||next==='slices'){
  separated=false;
  setHemisphere('both');
  if(controls)controls.autoRotate=false;
  $('#rotate-btn').classList.remove('active');
  $('#rotate-btn').setAttribute('aria-pressed','false');
  if(next==='cellular'){
   tourStep=-1;renderTour();
   $('#workspace').classList.remove('expanded');
   $('#detail-panel').scrollTop=0;
   cellularViewer.enter();
  }else sliceViewer.enter();
  return;
 }
 selectRegion({regions:'frontal',anatomy:'anat-46',functional:'fn-v1',pathways:'path-optic'}[next]);
}
function renderAtlasDetail(r){
 const anatomical=r.layer==='anatomy',path=r.layer==='pathways';
 const kind=anatomical?'Anatomical landmark':path?'Schematic pathway':'Functional teaching location';
 const note=r.modelNote||(anatomical?(r.schematic?'This cleft is indicated by a schematic curve.':'The highlighted surface follows an anatomical Destrieux parcel; it does not define a functional boundary.'):(path?layerNotes.pathways:layerNotes.functional));
 const location=anatomical?'Destrieux a2009s · both hemispheres':path?'Illustrative route · not diffusion MRI':(r.hemis?.length===1?'Typically left hemisphere':'Bilateral territories')+' · approximate marker';
 const related=(r.connections||[]).filter(id=>region(id));
 const overviewSections=(r.overviewSections||[]).map(([title,body])=>
  `<h3 class="section-title">${htmlEscape(title)}</h3><p class="description">${htmlEscape(body)}</p>`).join('');
 const projectionLegend=r.legend?`<ul class="projection-legend">${r.legend.map(([label,color])=>`<li><i style="background:${color}"></i>${label}</li>`).join('')}</ul>`:'';
 const pathwayReference=r.source?`<a class="anatomy-source" href="${r.source}" target="_blank" rel="noopener noreferrer">Pathway anatomy reference ${icon('arrow-up-right')}</a>`:'';
 $('#detail-panel').innerHTML=`<div class="detail-top"><div class="detail-eyebrow"><span>${path?'PATHWAY':anatomical?'ANATOMY':'FUNCTION'} IN FOCUS</span><button class="icon-button ${savedRegions.has(r.id)?'active':''}" id="save-region" aria-pressed="${savedRegions.has(r.id)}" aria-label="Bookmark ${r.name}">${icon(savedRegions.has(r.id)?'check':'bookmark')}</button></div><div class="selected-chip"><i></i>${kind}</div><h2 class="detailed-name">${r.name}</h2><p class="region-tagline">${r.short}</p></div><div class="detail-tabs" role="tablist" aria-label="Atlas details"><button role="tab" aria-selected="${detailTab==='overview'}" data-tab="overview" class="${detailTab==='overview'?'active':''}">Overview</button><button role="tab" aria-selected="${detailTab==='research'}" data-tab="research" class="${detailTab==='research'?'active':''}">Research <span class="tab-count">${r.papers.length}</span></button></div><div class="detail-body" role="tabpanel">${detailTab==='research'?r.papers.map(paperCard).join('')+pathwayReference:`<p class="description">${r.description}</p><div class="location">${icon('pin')}<span>${location}</span></div>${overviewSections}${path?`<h3 class="section-title">${r.branches?'PROJECTION TARGETS':r.bidirectional?'SIMPLIFIED ROUTE · BIDIRECTIONAL':'SIMPLIFIED ROUTE · DIRECTION OF FLOW'}</h3>${projectionLegend}<ol class="pathway-steps">${r.steps.map((step,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><p>${step}</p></li>`).join('')}</ol><button class="primary-button" id="trace-path">${icon('activity')} Trace this pathway</button>`:''}<p class="model-note">${note}</p>${!anatomical&&!path&&!r.overviewSections?'<p class="model-note">Numbering is system-dependent. A1/A2 and M1/premotor/SMA are not equivalent stages of a common universal hierarchy. FFA and VWFA require functional localizers; their boundaries vary between people.</p>':''}${related.length?`<div class="connections-section"><h3 class="section-title">EXPLORE RELATED STRUCTURES</h3><div class="connected">${related.map(id=>`<button data-region="${id}" style="--region-color:${region(id).color}"><span class="region-dot"></span>${region(id).name}</button>`).join('')}</div></div>`:''}<div class="research-preview"><div class="section-title-row"><h3 class="section-title">FOLLOW THE SCIENCE</h3><button data-tab="research">${r.papers.length} references ${icon('arrow-right')}</button></div>${miniPaper(papers[r.papers[0]])}${pathwayReference}</div>`}<div class="detail-navigator"><span>${currentItems().findIndex(x=>x.id===r.id)+1} / ${currentItems().length} ITEMS</span><button id="next-region">Next ${icon('arrow-right')}</button></div></div>`;
}

function showModal(title,subtitle,content){
 $('#modal-heading').innerHTML=`<h2>${title}</h2><p>${subtitle}</p>`;
 $('#modal-content').innerHTML=content;
 if(!$('#modal').open)$('#modal').showModal();
}
function showLibrary(saved=false){
 librarySaved=saved;
 showModal(saved?'Your reading list':'The research library',saved?'A space for papers you want to return to.':'Studies and reviews matched to regions, pathways, cellular signalling, and atlas methods.',`${saved&&savedRegions.size?`<h3 class="section-title">BOOKMARKED REGIONS</h3><div class="connected" style="margin-bottom:24px">${[...savedRegions].filter(id=>region(id)).map(id=>`<button data-region="${id}" style="--region-color:${region(id).color}"><span class="region-dot"></span>${region(id).name}</button>`).join('')}</div>`:''}<div class="library-controls"><label class="search">${icon('search')}<input id="paper-search" aria-label="Search research papers" placeholder="Search papers, authors, or topics…"></label><select id="paper-region" aria-label="Filter papers by topic"><option value="all">All topics</option><option value="cellular">Cellular neuroscience</option>${regions.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select></div><div id="library-papers"></div>`);
 renderLibrary();
}
function renderLibrary(){
 if(!$('#library-papers'))return;
 const query=$('#paper-search').value.toLowerCase().trim();const r=$('#paper-region').value;
 const cellularIds=Object.values(cellularPaperIds).flat();
 const topicPapers=r==='cellular'?cellularIds:region(r)?.papers;
 const ids=Object.keys(papers).filter(id=>(!librarySaved||savedPapers.has(id))&&(r==='all'||topicPapers?.includes(id))&&(!query||`${papers[id].title} ${papers[id].authors} ${papers[id].summary} ${regions.filter(r=>r.papers.includes(id)).map(r=>r.name).join(' ')}`.toLowerCase().includes(query)));
 $('#library-papers').innerHTML=ids.length?`<p class="section-title">${ids.length} ${ids.length===1?'PAPER':'PAPERS'} ${librarySaved?'SAVED':'TO EXPLORE'}</p>`+ids.map(paperCard).join(''):`<div class="empty-state">${icon('book')}<h3>${librarySaved&&!query?'Your curiosity, collected.':'No matching papers'}</h3><p>${librarySaved&&!query?'Save papers with the bookmark icon to build your reading list.':'Try another topic or choose a different region.'}</p>${librarySaved?'<button class="primary-button" id="browse-papers">Explore the research library</button>':''}</div>`;
}

function showAbout(){showModal('A map for your curiosity.','About the model, the science, and this atlas.',`<div class="about-content"><p>Cortex combines ${broadRegions.length} brain regions and nuclei, ${anatomy.length} anatomical landmarks, ${functional.length} functional teaching locations, and ${pathways.length} common pathways. Select a region, explore its functions, and use the research links to go deeper.</p><h3>A real cortical surface</h3><p>The cerebral hemispheres use the <a href="https://nilearn.github.io/stable/modules/description/fsaverage5.html" target="_blank" rel="noopener noreferrer">fsaverage5 surface distributed with Nilearn</a>, with 10,242 vertices per hemisphere. Cortical labels come from the Destrieux atlas, grouped into broader educational regions.</p><p>Lobe groupings simplify shared sulci and transition zones. The insula and cingulate are included as separate cortical regions; the medial wall is neutral. These are anatomical groupings, not precise maps of functional boundaries.</p><h3>Deep structures are schematic</h3><p>The hippocampus, amygdala, thalamus, basal ganglia, hypothalamus, cerebellum, brainstem, and locus coeruleus are simplified shapes with approximate placement and relative scale. They are not MRI segmentations. The “Deep structures” view makes the cortex transparent and separates the hemispheres to reveal their relationships.</p><h3>Anatomy, functional locations, and pathways</h3><p>The Anatomy layer exposes all 74 named non-medial-wall Destrieux parcels per hemisphere, plus two schematic fissures. Functional markers show approximate teaching locations anchored to anatomical parcels. They do not reproduce measured retinotopic or cytoarchitectonic boundaries, and the guide is not an exhaustive list of cortical fields. Modern schemes such as HCP-MMP1 distinguish 180 areas per hemisphere. FFA/VWFA and other markers require individual functional localization for precision.</p><p>Pathway curves summarize selected routes and direction of flow. They are not tractography; crossings, branching, relay nuclei, and peripheral or spinal segments are simplified. A named stream may contain multiple tracts and feedback connections.</p><h3>Follow the evidence</h3><p>The ${Object.keys(papers).length}-paper collection pairs foundational work with studies and reviews that address specific functions and pathways. Each card identifies the study type and explains its relevance. Anatomy and segmentation papers document how labels were defined. Study cards link to PubMed or the publisher, with open full text where available.</p><p>Regional functions are simplified. Brain activity depends on distributed networks, and anatomy varies between individuals. This atlas is not intended for diagnosis or surgical planning.</p><h3>Real MRI sections</h3><p>The Sections & MRI viewer uses matched fsaverage T1 and aseg volumes from the MNE testing-data distribution. The original 1 mm grid and segmentation values are retained, with intensity windowing for display. <a href="https://pubmed.ncbi.nlm.nih.gov/11832223/" target="_blank" rel="noopener noreferrer">Fischl and colleagues describe the FreeSurfer segmentation method</a>. Labels are sampled from the segmentation at the current plane, rather than inferred from the picture. Coronal and axial images use radiological left/right orientation; sagittal images show anterior on the left. Coordinates are FreeSurfer surface RAS, not MNI. The 3D cut uses this MRI plane alongside the cortical surface; schematic hindbrain geometry is context only.</p><p>This is an averaged research template, not a patient study. Displayed segmentations do not guarantee visually resolved boundaries and are not diagnostic. The files are repackaged derivatives. <a href="./assets/mri/ATTRIBUTION.txt" target="_blank">MRI attribution</a> · <a href="./assets/mri/FREESURFER-LICENSE.txt" target="_blank">FreeSurfer data license and terms</a>.</p><h3>Cellular neuroscience</h3><p>The voltage trace uses <a href="https://pubmed.ncbi.nlm.nih.gov/12991237/" target="_blank" rel="noopener noreferrer">Hodgkin and Huxley’s classical squid giant axon model</a> with a brief current stimulus and constant ion gradients. The cortical zoom leads to a schematic neuron and membrane. The pump cycle shows active transport separately from the trace.</p><p>3D scale bars show distance at the camera’s focus depth. The MRI image bar uses the displayed field of view. The neuron uses a schematic 20 µm cell body as a size reference. In the membrane drawing, the ≈ 5 nm bracket marks the approximate lipid bilayer thickness.</p><h3>Atlas reference & attribution</h3><p>Destrieux, C., Fischl, B., Dale, A. & Halgren, E. (2010). <a href="https://pubmed.ncbi.nlm.nih.gov/20547229/" target="_blank" rel="noopener noreferrer">Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature</a>. NeuroImage, 53(1), 1–15. DOI: 10.1016/j.neuroimage.2010.06.010.</p><p>Surface data: FreeSurfer fsaverage5, distributed by <a href="https://nilearn.github.io/" target="_blank" rel="noopener noreferrer">Nilearn</a>. <a href="./assets/NILEARN-LICENSE.txt" target="_blank">Nilearn license</a>. General cortical anatomy: <a href="https://www.ncbi.nlm.nih.gov/books/NBK537247/" target="_blank" rel="noopener noreferrer">Javed, Reddy & Lui, Neuroanatomy, Cerebral Cortex</a>. Renderer: Three.js (MIT).</p><h3>Make yourself at home</h3><div class="keyboard-grid"><span><kbd>Drag</kbd> Rotate the model</span><span><kbd>Scroll</kbd> Zoom in or out</span><span><kbd>/</kbd> Search brain regions</span><span><kbd>Esc</kbd> Close a dialog or tour</span><span><kbd>+</kbd> Zoom in</span><span><kbd>−</kbd> Zoom out</span></div><p>Your reading list and bookmarked regions are stored in this browser.</p></div>`);}

// The anatomical surface is kept separate from the illustrative internal models.
const stage=$('#brain-stage');let renderer,scene,camera,controls,brain;
const brainStageLabel=stage.getAttribute('aria-label');
const sceneScaleBar=$('#scene-scale-bar'),zoomFrame=$('#cell-zoom-frame');
let neuronScene=null;
let cellularZoom=null;
const CELL_ZOOM_DIVE_MS=300,CELL_ZOOM_TOTAL_MS=550;
// The schematic soma spans about 1.8 scene units, set to roughly 20 µm wide.
const NEURON_MM_PER_UNIT=.020/1.8;
let mriPlaneMesh=null,mriTexture=null,lastSliceView=null;
const sliceClippingPlane=new THREE.Plane(new THREE.Vector3(0,0,-1),0);
const meshes=[],hemisphereGroups=[],labels=[];let cameraMotion=null;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const defaultCamera=new THREE.Vector3(-5.3,2.1,5.4),defaultTarget=new THREE.Vector3(0,-.1,-.15);
function material(id){return new THREE.MeshStandardMaterial({color:region(id)?.color||'#c1c1ae',roughness:.83,metalness:0,side:THREE.DoubleSide});}
function addShape(geometry,id,pos,scale,parent=brain){const m=new THREE.Mesh(geometry,material(id));m.position.set(...pos);if(scale)m.scale.set(...scale);m.userData={region:id,schematic:true,basePosition:m.position.clone()};parent.add(m);meshes.push(m);return m;}

function addSchematicStructures(){
 for(const side of [-1,1]){
  const cerebellar=new THREE.SphereGeometry(1,72,54);const p=cerebellar.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const ripple=1+.024*Math.sin(y*65+Math.sin(x*7)*1.8+z*2);p.setXYZ(i,x*ripple,y*ripple,z*ripple);}
  cerebellar.computeVertexNormals();addShape(cerebellar,'cerebellum',[side*.48,-1.28,-1.19],[.68,.48,.64]);
  addShape(new THREE.SphereGeometry(1,40,32),'thalamus',[side*.25,-.06,-.19],[.22,.28,.35]);
  addShape(new THREE.SphereGeometry(1,36,28),'amygdala',[side*.59,-.62,.49],[.15,.19,.17]);
  addShape(new THREE.SphereGeometry(1,36,28),'ganglia',[side*.48,.03,.19],[.16,.26,.36]);
  addShape(new THREE.SphereGeometry(1,32,24),'ganglia',[side*.66,-.04,.04],[.1,.3,.39]);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.56,-.64,.29),new THREE.Vector3(side*.64,-.74,-.02),new THREE.Vector3(side*.61,-.66,-.46),new THREE.Vector3(side*.43,-.44,-.66)]);
  addShape(new THREE.TubeGeometry(curve,50,.105,12,false),'hippocampus',[0,0,0]);
  const caudateCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.35,.05,.47),new THREE.Vector3(side*.39,.35,.16),new THREE.Vector3(side*.43,.3,-.35),new THREE.Vector3(side*.55,-.17,-.54)]);
  addShape(new THREE.TubeGeometry(caudateCurve,40,.067,10,false),'ganglia',[0,0,0]);
 }
 addShape(new THREE.SphereGeometry(1,36,28),'hypothalamus',[0,-.49,.1],[.22,.18,.23]);
 const stemCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.56,-.21),new THREE.Vector3(0,-1.01,-.26),new THREE.Vector3(0,-1.5,-.16),new THREE.Vector3(0,-1.91,-.06)]);
 addShape(new THREE.TubeGeometry(stemCurve,32,.17,22,false),'brainstem',[0,0,0]);
 addShape(new THREE.SphereGeometry(1,40,30),'brainstem',[0,-1.02,-.12],[.29,.3,.24]);
 const nucleusGeometry=new THREE.SphereGeometry(1,24,16);
 for(const [side,position] of Object.entries(region('locus-coeruleus').positions)){
  const nucleus=addShape(nucleusGeometry,'locus-coeruleus',position,[.031,.091,.032]);
  nucleus.userData.hemisphere=side;
 }
}

const routeAnimations=[];let traceStart=performance.now();
function createLabels(){
 $('#labels').innerHTML='';labels.length=0;
 for(const r of currentItems()){
  const label=r.layer==='functional'?(r.code||r.name):r.name;
  const el=document.createElement('button');el.className='model-label'+(r.layer==='functional'?' functional-label':'');el.dataset.region=r.id;el.style.setProperty('--region-color',r.color);el.innerHTML=label+icon('arrow-up-right');el.setAttribute('aria-label','Explore '+r.name);
  if(r.id==='locus-coeruleus'){
   el.classList.add('locus-marker');
   el.innerHTML=`<span class="locus-marker-label">${r.name}</span>`;
  }
  $('#labels').append(el);labels.push({el,region:r});
 }
}
function updateMaterials(){
 if(mriPlaneMesh)mriPlaneMesh.visible=layer==='slices'&&sliceViewer.loaded&&sliceViewer.display==='cut';
 const displayLayer=layer==='cellular'?'regions':layer;
 const deepRegionView=layer==='regions'&&view==='deep';
 const focusLC=deepRegionView&&selected==='locus-coeruleus';
 const showLCProjection=layer==='pathways'&&selected==='path-locus-coeruleus';
 for(const m of meshes){
  if(layer==='slices'){const id=m.userData.region;const isContext=(m.userData.layer||'regions')==='regions'&&(!m.userData.schematic||['cerebellum','brainstem'].includes(id));m.visible=isContext;if(isContext){m.material.color.set('#bdc8b0');m.material.emissive.set('#000000');m.material.opacity=m.userData.schematic?.3:.85;m.material.transparent=true;m.material.depthWrite=false;m.material.clippingPlanes=[sliceClippingPlane];m.renderOrder=1;}continue;}
  m.material.clippingPlanes=null;
  const id=m.userData.region,r=region(id),ml=m.userData.layer||'regions';
  const visibleSide=!m.userData.hemisphere||hemisphere==='both'||hemisphere===m.userData.hemisphere;
  m.visible=visibleSide&&(ml===displayLayer||(ml==='regions'&&displayLayer!=='regions'));
  if(id==='locus-coeruleus')m.visible=visibleSide&&(deepRegionView||showLCProjection);
  if(m.userData.routeColor&&id!==selected)m.visible=false;
  if(layer==='cellular'&&cellularViewer.scale!=='brain')m.visible=false;
  if(!m.visible)continue;
  const active=id===selected;
  let color=new THREE.Color(r?.color||'#c8ccbe');
  m.material.emissive.set('#000000');m.material.emissiveIntensity=0;
  let opacity=1;
  if(ml==='regions'){
   if(displayLayer!=='regions'){color.set('#d4d8cc');opacity=m.userData.schematic?.12:(layer==='functional'?.32:layer==='pathways'?.09:.16);}
   else if(layer!=='cellular'&&view==='deep'&&!m.userData.schematic){
    // Keep the lobe selection visible without obscuring the internal markers.
    if(!active)opacity=.105;
    else if(deepRegionView&&!['insula','cingulate'].includes(id))opacity=.16;
   }
   else if(r&&!active)color.lerp(new THREE.Color('#dddcd0'),.12);
   if(id==='medial')opacity=displayLayer==='regions'?(layer!=='cellular'&&view==='deep'?.02:.5):.025;
   if(layer==='anatomy'&&view==='surface'&&!m.userData.schematic)opacity=.12;
   if(layer==='functional'&&m.userData.schematic)m.visible=false;
   if(deepRegionView&&id==='brainstem'&&!active)opacity=.28;
   if(focusLC&&m.userData.schematic&&!active&&id!=='brainstem')opacity=.08;
   if(id==='locus-coeruleus'){
    color.set(r.color);
    opacity=1;
    m.material.emissive.copy(color);m.material.emissiveIntensity=.32;
   }
  }else if(ml==='anatomy'){
   const special=layer==='anatomy'&&active;
   const emphasis=layer==='anatomy'&&region(selected)?.parcels?.includes(m.userData.parcel);
   color.set(special||emphasis?(region(selected)?.color||'#c49b7f'):'#b8c2ae');
   opacity=special||emphasis?1:(view==='deep'?.055:.57);
  }else if(ml==='functional'){
   opacity=active?1:.5;m.scale.setScalar(active?1.5:1);
   m.material.emissive.copy(color);m.material.emissiveIntensity=active?.48:.13;
  }else if(ml==='pathways'){
   if(m.userData.routeColor)color.set(m.userData.routeColor);
   opacity=active?1:.07;m.material.emissive.copy(color);m.material.emissiveIntensity=active?.45:.05;
  }
  m.material.color.copy(color);m.material.transparent=opacity<1;m.material.opacity=opacity;m.material.depthWrite=opacity>.9;m.renderOrder=opacity<.4?2:0;
 }
 for(const {el,region:r} of labels)el.classList.toggle('active',r.id===selected);
}
function addAtlasGeometry(d,side,hg,base){
 for(const [idx,faces] of Object.entries(d.parcels)){
  const id='anat-'+idx,r=region(id);if(!r)continue;
  r.positions??={};r.positions[side]=d.centers[idx];r.position??=d.centers[idx];
  const geo=base.clone(),ix=[...faces];for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];geo.setIndex(ix);
  const mat=material(id);mat.vertexColors=true;const m=new THREE.Mesh(geo,mat);m.userData={region:id,layer:'anatomy',hemisphere:side,parcel:Number(idx)};hg.add(m);meshes.push(m);
 }
 for(const r of functional){
  if(!r.hemis.includes(side))continue;
  const faceIndices=r.parcels.flatMap(n=>d.parcels[n]||[]);const vertices=[...new Set(faceIndices)];if(!vertices.length)throw Error('Missing functional anchor '+r.id);
  const target=[0,0,0];for(const idx of r.parcels){const c=d.centers[idx];if(c)for(let k=0;k<3;k++)target[k]+=c[k]/r.parcels.length;}
  for(let k=0;k<3;k++)target[k]+=(r.offset?.[k]||0)*(k===0&&side==='right'?-1:1);
  let nearest=vertices[0],distance=Infinity;
  for(const v of vertices){let dist=0;for(let k=0;k<3;k++)dist+=(d.positions[v*3+k]-target[k])**2;if(dist<distance){distance=dist;nearest=v;}}
  const normal=new THREE.Vector3().fromBufferAttribute(base.attributes.normal,nearest);
  const pos=new THREE.Vector3().fromBufferAttribute(base.attributes.position,nearest).addScaledVector(normal,.055);
  r.positions??={};r.positions[side]=pos.toArray();r.position??=pos.toArray();
  const m=new THREE.Mesh(new THREE.SphereGeometry(.055,18,14),material(r.id));m.position.copy(pos);m.userData={region:r.id,layer:'functional',hemisphere:side};hg.add(m);meshes.push(m);
 }
}
function addRouteGeometry(r,points,kind,routeColor){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,85,kind==='anatomy'?.026:.022,8,false),material(r.id));tube.userData={region:r.id,layer:kind,routeColor};brain.add(tube);meshes.push(tube);
 if(kind==='anatomy')return;
 for(const t of routeColor?[.85]:[.28,.68]){
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.065,.15,12),material(r.id));arrow.position.copy(curve.getPoint(t));const tangent=curve.getTangent(t).multiplyScalar(r.bidirectional&&t<.5?-1:1);arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tangent.normalize());arrow.userData={region:r.id,layer:kind,routeColor};brain.add(arrow);meshes.push(arrow);
 }
 const tracer=new THREE.Mesh(new THREE.SphereGeometry(.057,16,12),material(r.id));tracer.material.color.set(routeColor||r.color);tracer.material.emissive.set(routeColor||r.color);tracer.material.emissiveIntensity=.65;tracer.visible=false;brain.add(tracer);routeAnimations.push({tracer,curve,id:r.id,bidirectional:r.bidirectional});
}
function setHemisphere(next){hemisphere=next;$('#hemisphere').value=next;for(const g of hemisphereGroups)g.visible=next==='both'||(g.userData.side<0?'left':'right')===next;updateMaterials();}
function setCameraPreset(next){
 $('#camera-preset').value=next;
 if(next==='medial'&&hemisphere==='both')setHemisphere('left');
 const side=hemisphere==='right'?1:-1;
 const pos={lateral:[side*6.2,1.5,.9],medial:[-side*6.2,1,-.2],inferior:[side*1.2,-6.3,-.1],superior:[side*1.1,6.7,-.3],posterior:[side*2.2,1,-6.3]};
 moveCamera(new THREE.Vector3(...(pos[next]||pos.lateral)));$('#orientation-caption').textContent=(hemisphere==='both'?'Both hemispheres':hemisphere==='left'?'Left':'Right')+' · '+next;
 if(controls){controls.autoRotate=false;$('#rotate-btn').classList.remove('active');$('#rotate-btn').setAttribute('aria-pressed','false');}
}

async function initBrain(){
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.localClippingEnabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;stage.prepend(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.05,80);camera.position.copy(defaultCamera);
  controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(defaultTarget);controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=2.3;controls.maxDistance=12;controls.autoRotateSpeed=.6;controls.update();
  controls.addEventListener('start',()=>{cameraMotion=null;$('#orientation-caption').textContent='Free orbit';});
  scene.add(new THREE.HemisphereLight(0xfffcf2,0x8e8b79,2.15));
  const key=new THREE.DirectionalLight(0xfff8e6,3.2);key.position.set(-4,6,5);scene.add(key);
  const fill=new THREE.DirectionalLight(0xf0f7ff,1.25);fill.position.set(4,2,-3);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffffff,.85);rim.position.set(1,-2,5);scene.add(rim);
  brain=new THREE.Group();scene.add(brain);
  const res=await fetch('./assets/brain.json');if(!res.ok)throw Error('Surface data unavailable');const data=await res.json();
  for(const [side,d] of Object.entries(data)){
   const hg=new THREE.Group();hg.userData.side=side==='left'?-1:1;brain.add(hg);hemisphereGroups.push(hg);
   const base=new THREE.BufferGeometry();base.setAttribute('position',new THREE.Float32BufferAttribute(d.positions,3));
   // The RAS-to-display axis permutation reverses handedness; reverse winding.
   const all=Object.values(d.groups).flat();for(let i=0;i<all.length;i+=3)[all[i+1],all[i+2]]=[all[i+2],all[i+1]];base.setIndex(all);base.computeVertexNormals();
   const colors=[];for(const s of d.sulc){const shade=.89-.12*Math.tanh(s*1.4);colors.push(shade,shade,shade);}
   base.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
   for(const [id,indices] of Object.entries(d.groups)){
    if(!indices.length)continue;const geo=base.clone();const ix=[...indices];for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];geo.setIndex(ix);
    const mat=material(id);mat.vertexColors=true;const mesh=new THREE.Mesh(geo,mat);mesh.userData={region:id,hemisphere:side};hg.add(mesh);meshes.push(mesh);
   }
   addAtlasGeometry(d,side,hg,base);
  }
  for(const r of pathways){
   const branches=r.branches??[{points:r.points}];
   for(const branch of branches)addRouteGeometry(r,branch.points,'pathways',branch.color);
  }
  for(const r of anatomy.filter(r=>r.curve))addRouteGeometry(r,r.curve,'anatomy');
  addSchematicStructures();createLabels();updateMaterials();
  if(layer==='slices')applySliceState(sliceViewer.state);
  if(layer==='cellular')applyCellularScale(cellularViewer.scale,cellularViewer.root.dataset.zooming==='true');
  $('#loading').classList.add('hidden');
  const observer=new ResizeObserver(resize);observer.observe(stage);resize();
  renderer.domElement.addEventListener('pointerdown',e=>{dragStart=[e.clientX,e.clientY];});
  renderer.domElement.addEventListener('pointerup',onPick);renderer.domElement.addEventListener('pointermove',onHover);renderer.domElement.addEventListener('pointerleave',()=>$('#hover-tooltip').style.display='none');
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();notify('3D graphics paused. Reload to restore the model.');});
  renderer.setAnimationLoop(animate);window.cortexReady=true;
 }catch(error){console.error(error);$('#loading').innerHTML=`${icon('info')}<p>The 3D model could not load.</p><p>You can still explore every region and paper using the list.</p><button class="primary-button" id="retry-model">Try again</button>`;$('#retry-model').onclick=()=>location.reload();}
}
function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
let lastFrame=0;
function animate(now){
 const delta=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
 if(cameraMotion){const {from,to,start,targetFrom,targetTo,duration}=cameraMotion;const t=Math.min((now-start)/duration,1),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;camera.position.lerpVectors(from,to,e);controls.target.lerpVectors(targetFrom,targetTo,e);if(t===1)cameraMotion=null;}
 const spread=hemisphere==='both'&&(separated||view==='deep')&&!['pathways','slices','cellular'].includes(layer)?.65:0;for(const g of hemisphereGroups)g.position.x=THREE.MathUtils.damp(g.position.x,g.userData.side*spread,7,delta);
 for(const route of routeAnimations){route.tracer.visible=layer==='pathways'&&selected===route.id;if(route.tracer.visible){const progress=reducedMotion?.55:((now-traceStart)%6500)/6500;const t=route.bidirectional?(progress<.5?progress*2:2-progress*2):progress;route.tracer.position.copy(route.curve.getPoint(t));}}
 if(cellularZoom)advanceCellularZoom(now);
 else controls.update();
 updateSceneScale();updateLabels();renderer.render(scene,camera);
}
function updateSceneScale(){
 const height=stage.clientHeight;
 if(!height)return;
 const neuron=layer==='cellular'&&cellularViewer.scale==='neuron';
 const mmPerUnit=neuron?NEURON_MM_PER_UNIT:SCENE_MM_PER_UNIT;
 const depth=camera.position.distanceTo(controls.target);
 const mmPerPixel=2*depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*mmPerUnit/height;
 renderScaleBar(sceneScaleBar,mmPerPixel,Math.min(108,stage.clientWidth/4),neuron);
}
function updateLabels(){
 const w=stage.clientWidth,h=stage.clientHeight,deep=view==='deep';
 const visibleSurface=['frontal','parietal','temporal','occipital','cerebellum','brainstem'];
 const visibleDeep=['hippocampus','amygdala','thalamus','ganglia','hypothalamus'];
 const screenLabels=[];
 for(const item of labels){
  const {el,region:r}=item;
  const locusMarker=r.id==='locus-coeruleus';
  const visible=locusMarker?layer==='regions'&&deep:labelsOn&&(layer==='regions'?(deep?visibleDeep.includes(r.id)||r.id===selected:visibleSurface.includes(r.id)):(r.id===selected||(layer==='functional'&&r.group===region(selected)?.group&&currentItems().filter(x=>x.group===r.group).slice(0,4).some(x=>x.id===r.id))));
  el.style.display=visible?'flex':'none';if(!visible)continue;
  const side=hemisphere==='right'?'right':'left';const position=r.positions?.[side]||r.position;if(!position){el.style.display='none';continue;}const point=new THREE.Vector3(...position);if((r.group==='cortex'||r.layer==='anatomy'||r.layer==='functional')&&hemisphere==='both'&&(separated||deep))point.x+=side==='left'?-.65:.65;
  point.project(camera);
  const x=(point.x*.5+.5)*w,y=(-point.y*.5+.5)*h;
  if(locusMarker){
   // Keep the clickable area centered on the nucleus, above the rendered meshes.
   const inView=x>=0&&x<=w&&y>=0&&y<=h&&point.z>=-1&&point.z<=1;
   el.style.display=inView?'flex':'none';
   el.style.left=x+'px';el.style.top=y+'px';
   el.classList.toggle('locus-marker-left',x>w/2);
   el.classList.toggle('locus-marker-icon-only',!labelsOn);
   continue;
  }
  let ox=0,oy=-23;
  if(r.id==='frontal'){ox=-35;oy=-45;}if(r.id==='parietal'){ox=14;oy=-45;}if(r.id==='temporal'){ox=-48;oy=30;}if(r.id==='occipital'){ox=55;oy=-10;}if(r.id==='cerebellum'){ox=45;oy=35;}if(r.id==='brainstem'){ox=-50;oy=42;}
  if(deep&&layer==='regions'){const offsets={hippocampus:[-88,35],amygdala:[-85,12],thalamus:[25,-55],ganglia:[-75,-70],hypothalamus:[65,15],insula:[-130,-20],cingulate:[20,-70]};[ox,oy]=offsets[r.id]||[ox,oy];}
  let px=THREE.MathUtils.clamp(x+ox,65,w-65),py=THREE.MathUtils.clamp(y+oy,85,h-53);
  // Keep labels readable when the camera projects neighboring anchors together.
  for(const prev of screenLabels){if(Math.abs(prev.x-px)<105&&Math.abs(prev.y-py)<31)py+=32;}
  py=Math.min(py,h-28);screenLabels.push({x:px,y:py});el.style.left=px+'px';el.style.top=py+'px';el.style.opacity=point.z>1||point.z< -1?'0':'1';
 }
}
let dragStart=[0,0];
function intersection(event){if(!camera||layer==='slices'||layer==='cellular')return null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const candidates=meshes.filter(m=>m.visible&&m.parent?.visible&&(m.userData.layer||'regions')===layer&&m.material.opacity>.3);const hit=raycaster.intersectObjects(candidates).find(h=>region(h.object.userData.region));return hit?.object.userData.region;}

function onPick(e){if(Math.hypot(e.clientX-dragStart[0],e.clientY-dragStart[1])>5)return;const id=intersection(e);if(id)selectRegion(id);}
function onHover(e){if(e.buttons||layer==='slices')return;const id=intersection(e),tip=$('#hover-tooltip');renderer.domElement.style.cursor=id?'pointer':'grab';if(!id){tip.style.display='none';return;}const rect=stage.getBoundingClientRect();tip.textContent=region(id).name;tip.style.left=Math.min(e.clientX-rect.left+15,stage.clientWidth-125)+'px';tip.style.top=e.clientY-rect.top-30+'px';tip.style.display='block';}
function moveCamera(pos,target=defaultTarget,duration=850){if(!camera)return;cameraMotion={from:camera.position.clone(),to:pos.clone(),targetFrom:controls.target.clone(),targetTo:target.clone(),start:performance.now(),duration:reducedMotion?1:duration};}
function focusRegion(id){if(!camera)return;const r=region(id);controls.autoRotate=false;$('#rotate-btn').classList.remove('active');$('#rotate-btn').setAttribute('aria-pressed','false');
 if(id==='locus-coeruleus'){
  moveCamera(new THREE.Vector3(-2.8,-1.1,-2.6),new THREE.Vector3(0,-.87,-.29));
  $('#orientation-caption').textContent='Dorsal pons';
  return;
 }
 const positions={frontal:[-5.1,1.9,5.3],parietal:[-5.1,4.2,-3.5],temporal:[-6.8,.9,2.2],occipital:[-4.8,1.7,-5.4],cerebellum:[-4.8,-2,-4.5],brainstem:[-4,-1.7,5],insula:[-6,1,3.8],cingulate:[-5,2.6,3],hippocampus:[-4.5,1.5,4.5],amygdala:[-4.2,.4,4.4],thalamus:[-4.5,2.3,4.2],ganglia:[-4.6,2.4,4.7],hypothalamus:[-4.2,.2,4.7]};
 const target=r.group==='deep'?new THREE.Vector3(0,-.25,0):defaultTarget;
 moveCamera(new THREE.Vector3(...positions[id]),target);$('#orientation-caption').textContent=r.group==='deep'?'Internal view':'Focused view';
}
function setView(next,focus=true){view=next;$$('[data-view]').forEach(el=>{el.classList.toggle('active',el.dataset.view===view);el.setAttribute('aria-pressed',el.dataset.view===view);});$('#model-caption').textContent=layer==='anatomy'?'Destrieux anatomical parcels':layer==='functional'?'Approximate functional markers':layer==='pathways'?'Schematic pathway routes':view==='deep'?'Schematic internal structures':'fsaverage5 cortical surface';$('#separate-btn').classList.toggle('active',separated||view==='deep');$('#separate-btn').setAttribute('aria-pressed',separated||view==='deep');updateMaterials();if(focus&&camera)moveCamera(defaultCamera);}
function zoom(factor){if(!camera||cellularZoom)return;cameraMotion=null;const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();}
function resetView(){setHemisphere('both');$('#camera-preset').value='lateral';separated=false;setView('surface',false);controls&&(controls.autoRotate=false);$('#rotate-btn').classList.remove('active');$('#rotate-btn').setAttribute('aria-pressed','false');selected='frontal';detailTab='overview';renderRegions();renderDetail();updateMaterials();moveCamera(defaultCamera);$('#orientation-caption').textContent='Left anterior view';}

const tour=[
 ['frontal','Start with an intention.','The frontal lobe helps turn goals into action. Drag the model to look around, or click a colored region to follow your curiosity.'],
 ['parietal','Find your place in the world.','Parietal networks combine sensory and spatial information. The region panel explains what each area contributes in everyday life.'],
 ['hippocampus','Look a little deeper.','The transparent cortex reveals internal structures. The curved hippocampi help organize memories and spatial relationships. Internal shapes are schematic.'],
 ['cerebellum','Discover the quiet coordinator.','The cerebellum fine-tunes skilled movement and contributes to cognitive and emotional networks. No region works alone.'],
 ['frontal','Follow the science.','Open the Research tab for selected papers. Read on PubMed or save a paper to your reading list to return to it later.'],
];
function renderTour(){if(tourStep<0){$('#tour-card').classList.add('hidden');return;}const [id,title,text]=tour[tourStep];selectRegion(id);if(tourStep===4){detailTab='research';renderDetail();}$('#tour-card').classList.remove('hidden');$('#tour-card').innerHTML=`<div class="tour-top"><span>A LITTLE GUIDED DISCOVERY · ${tourStep+1} / ${tour.length}</span><button id="end-tour" aria-label="End guided tour">×</button></div><h3>${title}</h3><p>${text}</p><div class="tour-actions"><div class="tour-dots">${tour.map((_,i)=>`<i class="${i===tourStep?'active':''}"></i>`).join('')}</div><button id="tour-next">${tourStep===tour.length-1?'Keep exploring':'Next stop'} ${icon('arrow-right')}</button></div>`;}

// All lists and model labels use the same selection path, including keyboard activation.
document.addEventListener('click',async e=>{
 const el=e.target.closest('button');if(!el)return;
 if(el.dataset.layer){setLayer(el.dataset.layer);return;}
 if(el.dataset.region){selectRegion(el.dataset.region);if(el.closest('#modal'))$('#modal').close();return;}
 if(el.dataset.filter){filter=el.dataset.filter;$$('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));renderRegions();return;}
 if(el.dataset.tab){detailTab=el.dataset.tab;renderDetail();return;}
 if(el.dataset.view){setView(el.dataset.view);return;}
 if(el.dataset.savePaper){const id=el.dataset.savePaper;savedPapers.has(id)?savedPapers.delete(id):savedPapers.add(id);persist();if($('#modal').open&&$('#library-papers'))renderLibrary();renderDetail();notify(savedPapers.has(id)?'Added to your reading list':'Removed from your reading list');return;}
 if(el.dataset.copy){const p=papers[el.dataset.copy],citation=`${p.authors} (${p.year}). ${p.title}. ${p.journal}. https://doi.org/${p.doi}`;try{await navigator.clipboard.writeText(citation);notify('Citation copied');}catch{showModal('Your citation','Select and copy the reference below.',`<p class="about-content">${htmlEscape(citation)}</p>`);}return;}
 switch(el.id){
  case 'research-nav':case 'browse-papers':showLibrary();break;
  case 'saved-nav':showLibrary(true);break;
  case 'explore-nav':$('#modal').close();break;
  case 'about-btn':case 'sources-btn':showAbout();break;
  case 'close-modal':$('#modal').close();break;
  case 'save-region':savedRegions.has(selected)?savedRegions.delete(selected):savedRegions.add(selected);persist();renderDetail();notify(savedRegions.has(selected)?'Region bookmarked in this browser':'Bookmark removed');break;
  case 'labels-btn':labelsOn=!labelsOn;el.classList.toggle('active',labelsOn);el.setAttribute('aria-pressed',labelsOn);break;
  case 'separate-btn':separated=!(separated||view==='deep');if(view==='deep')setView('surface',false);el.classList.toggle('active',separated);el.setAttribute('aria-pressed',separated);break;
  case 'rotate-btn':if(controls){controls.autoRotate=!controls.autoRotate;cameraMotion=null;el.classList.toggle('active',controls.autoRotate);el.setAttribute('aria-pressed',controls.autoRotate);}break;
  case 'reset-btn':configureLayer('regions');resetView();break;
  case 'trace-path':traceStart=performance.now();notify('Tracing the simplified route');break;
  case 'zoom-in':zoom(.85);break;
  case 'zoom-out':zoom(1.17);break;
  case 'fullscreen-btn':$('#workspace').classList.toggle('expanded');el.setAttribute('aria-label',$('#workspace').classList.contains('expanded')?'Exit expanded model':'Expand model');resize();break;
  case 'next-region':{const items=currentItems();selectRegion(items[(items.findIndex(r=>r.id===selected)+1)%items.length].id);break;}
  case 'tour-btn':tourStep=0;renderTour();break;
  case 'random-region':exploreRandomRegion();break;
  case 'tour-next':tourStep=tourStep===tour.length-1?-1:tourStep+1;renderTour();break;
  case 'end-tour':tourStep=-1;renderTour();break;
 }
});
$('#region-search').addEventListener('input',renderRegions);
document.addEventListener('input',e=>{if(e.target.id==='paper-search')renderLibrary();});
document.addEventListener('change',e=>{if(e.target.id==='paper-region')renderLibrary();if(e.target.id==='hemisphere')setHemisphere(e.target.value);if(e.target.id==='camera-preset')setCameraPreset(e.target.value);});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const rect=$('#modal').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)$('#modal').close();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){tourStep=-1;renderTour();$('#workspace').classList.remove('expanded');resize();}if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)||$('#modal').open)return;if(e.key==='/'&&layer!=='cellular'){e.preventDefault();$('#region-search').focus();}if(e.key==='+'||e.key==='=')zoom(.85);if(e.key==='-')zoom(1.17);});
function applySliceState(state){
 document.body.dataset.sliceDisplay=state.display;
 if(!brain||!state.loaded){updateMaterials();return;}
 const plane=state.plane,mm=state.mm;
 if(!mriTexture){mriTexture=new THREE.CanvasTexture(state.textureCanvas);mriTexture.colorSpace=THREE.SRGBColorSpace;mriTexture.minFilter=THREE.LinearFilter;mriTexture.magFilter=THREE.LinearFilter;}
 mriTexture.needsUpdate=true;
 const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>rasToScene(imageToRAS(plane,mm,u,v)));
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(corners.flat(),3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
 if(!mriPlaneMesh){mriPlaneMesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:mriTexture,side:THREE.DoubleSide,toneMapped:false}));brain.add(mriPlaneMesh);}else{mriPlaneMesh.geometry.dispose();mriPlaneMesh.geometry=geometry;}
 if(plane==='coronal')sliceClippingPlane.set(new THREE.Vector3(0,0,-1),mm/50);
 else if(plane==='axial')sliceClippingPlane.set(new THREE.Vector3(0,-1,0),(mm-5)/50);
 else sliceClippingPlane.set(new THREE.Vector3(1,0,0),-mm/50);
 const key=plane+state.display;
 if(state.display==='cut'&&key!==lastSliceView){const positions={coronal:[-2.5,1.3,6.5],axial:[-2.5,6.5,2.5],sagittal:[-6.5,1.5,1]};moveCamera(new THREE.Vector3(...positions[plane]));}
 lastSliceView=key;updateMaterials();resize();
}
const sliceViewer=new SliceViewer({onChange:applySliceState});
function cancelCellularZoom(){
 if(!cellularZoom)return;
 cellularZoom=null;
 controls.enabled=true;
 zoomFrame.classList.add('hidden');
}
function startCellularZoom(){
 const anchor=region(selected);
 const point=new THREE.Vector3(...(anchor?.group==='cortex'&&anchor.position?anchor.position:region('frontal').position));
 const from=camera.position.clone();
 brain.updateMatrixWorld(true);
 raycaster.set(from,point.clone().sub(from).normalize());
 const surface=meshes.filter(mesh=>mesh.visible&&mesh.userData.hemisphere&&!mesh.userData.layer);
 const target=raycaster.intersectObjects(surface,false)[0]?.point??point;
 const to=target.clone().add(from.clone().sub(target).setLength(.65));
 cellularZoom={start:performance.now(),from,to,target,targetFrom:controls.target.clone(),neuronDistance:null};
 controls.enabled=false;
}
function advanceCellularZoom(now){
 const zoom=cellularZoom;
 const elapsed=Math.max(0,now-zoom.start);
 if(zoom.neuronDistance===null){
  const t=Math.min(elapsed/CELL_ZOOM_DIVE_MS,1);
  camera.position.lerpVectors(zoom.from,zoom.to,t*t*(2-t));
  controls.target.lerpVectors(zoom.targetFrom,zoom.target,1-(1-t)**3);
  camera.lookAt(controls.target);
  if(t<1)return;
  if(elapsed>=CELL_ZOOM_TOTAL_MS){cellularViewer.setScale('neuron');return;}
  // Capture the last cortical frame in the same render task before the WebGL buffer clears.
  const canvas=renderer.domElement;
  zoomFrame.width=canvas.width;zoomFrame.height=canvas.height;
  renderer.render(scene,camera);
  const context=zoomFrame.getContext('2d');
  if(context){context.drawImage(canvas,0,0);zoomFrame.classList.remove('hidden');}
  cellularViewer.setScale('neuron',true);
 }
 const t=Math.min((elapsed-CELL_ZOOM_DIVE_MS)/(CELL_ZOOM_TOTAL_MS-CELL_ZOOM_DIVE_MS),1);
 const ease=1-(1-t)**3;
 zoomFrame.style.opacity=String(1-ease);
 camera.position.z=zoom.neuronDistance*(1+.22*(1-ease));
 camera.lookAt(controls.target);
 if(t===1){
  cellularViewer.root.dataset.zooming='false';
  cancelCellularZoom();
 }
}
function applyCellularScale(scale, zooming){
 const previousScale=document.body.dataset.cellularScale;
 document.body.dataset.cellularScale=scale;
 stage.setAttribute('aria-label',scale==='neuron'?'Interactive 3D neuron. Drag to rotate or scroll to zoom.':brainStageLabel);
 $('#hover-tooltip').style.display='none';
 if(!scene||!controls||!hemisphereGroups.length)return;
 if(scale!=='neuron'||!zooming)cancelCellularZoom();
 cameraMotion=null;
 if(scale==='neuron'&&!neuronScene){
  neuronScene=buildNeuron(THREE);
  scene.add(neuronScene.group);
 }
 if(neuronScene)neuronScene.group.visible=scale==='neuron';
 controls.maxDistance=scale==='neuron'?24:12;
 if(scale==='brain'){
  if((previousScale&&previousScale!=='brain')||camera.position.distanceTo(controls.target)<2.3){
   camera.position.copy(defaultCamera);
   controls.target.copy(defaultTarget);
  }
 }else if(scale==='neuron'){
  const aspect=stage.clientWidth/Math.max(1,stage.clientHeight);
  const distance=Math.min(22,Math.max(6.6,14/Math.max(.5,aspect)));
  camera.position.set(.65,.24,distance);
  controls.target.set(.2,.1,0);
  if(zooming&&cellularZoom)cellularZoom.neuronDistance=distance;
 }
 updateMaterials();
 resize();
 if(scale==='brain'&&zooming)startCellularZoom();
 else if(!cellularZoom)controls.update();
}
const cellularViewer=new CellularViewer({
 onScale:applyCellularScale,
 onSignal:progress=>neuronScene?.signal(progress),
 paperCard,
});
$('.tiny-count').textContent=Object.keys(papers).length;renderRegions();renderDetail();initBrain();
