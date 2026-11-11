import { sliceEvidence } from './references.js?v=11';
import {renderScaleBar} from './scale-bar.js';
import {slicePlanes,sliceStructures,structureByLabel,MRI_SIZE,MRI_FIELD_MM,voxelIndex,imageToRAS} from './slice-data.js?v=6';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
const palette=new Map(sliceStructures.map(r=>[r.id,hex(r.color)]));
export function renderSlicePixels({t1,seg,plane,mm,overlay=true,selected=null,contrast=1}){
 const size=MRI_SIZE,pixels=new Uint8ClampedArray(size*size*4),pixelLabels=new Uint8Array(size*size),stats=new Map();
 for(let v=0;v<size;v++)for(let u=0;u<size;u++){
  const ras=imageToRAS(plane,mm,u/(size-1),v/(size-1));const i=voxelIndex(...ras),p=u+v*size,o=p*4;
  const value=i<0?0:t1[i],label=i<0?0:seg[i],r=structureByLabel.get(label);
  let gray=Math.max(0,Math.min(255,(value-12)*1.42*contrast));
  pixels[o]=pixels[o+1]=pixels[o+2]=gray;pixels[o+3]=255;pixelLabels[p]=label;
  if(!r)continue;
  if(!stats.has(r.id))stats.set(r.id,{structure:r,count:0,sumU:0,sumV:0});
  const st=stats.get(r.id);st.count++;st.sumU+=u;st.sumV+=v;
  if(overlay){const alpha=selected?(selected===r.id?.58:.08):.27;const color=palette.get(r.id);for(let k=0;k<3;k++)pixels[o+k]=gray*(1-alpha)+color[k]*alpha;}
 }
 const visible=[...stats.values()].filter(s=>s.count>=6).sort((a,b)=>a.structure.priority-b.structure.priority);
 for(const s of visible){const cu=s.sumU/s.count,cv=s.sumV/s.count;let best=Infinity,anchor=[0,0];for(let p=0;p<pixelLabels.length;p++){if(structureByLabel.get(pixelLabels[p])?.id!==s.structure.id)continue;const u=p%size,v=Math.floor(p/size),dist=(u-cu)**2+(v-cv)**2;if(dist<best){best=dist;anchor=[u,v];}}s.anchor=anchor;}
 return {pixels,pixelLabels,visible,size};
}

export class SliceViewer{
 constructor({onChange,onDetail,onSidebar,cite}){
  this.onChange=onChange;this.onDetail=onDetail;this.onSidebar=onSidebar;this.cite=cite;
  this.plane='coronal';this.mm=-12;this.display='mri';this.overlay=true;this.labels=true;this.contrast=1;this.selected=null;this.point=null;this.active=false;this.loaded=false;
  this.root=$('#slice-workspace');this.canvas=$('#mri-canvas');this.textureCanvas=document.createElement('canvas');this.textureCanvas.width=this.textureCanvas.height=MRI_SIZE;
  if(typeof ResizeObserver!=='undefined'){this.resizeObserver=new ResizeObserver(()=>{const frame=$('.mri-frame'),field=$('.mri-field');const side=Math.max(10,Math.min(frame.clientWidth-45,frame.clientHeight-70));field.style.width=field.style.height=side+'px';this.updateScale(side);});this.resizeObserver.observe($('.mri-frame'));}
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!this.active)return;
   if(b.dataset.slicePlane)this.setPlane(b.dataset.slicePlane);
   if(b.dataset.slicePreset!==undefined)this.setPosition(Number(b.dataset.slicePreset));
   if(b.dataset.sliceStructure)this.selectStructure(b.dataset.sliceStructure);
   if(b.dataset.sliceDisplay){this.display=b.dataset.sliceDisplay;this.update();}
   if(b.id==='slice-overlay'){this.overlay=!this.overlay;this.update();}
   if(b.id==='slice-labels'){this.labels=!this.labels;this.update();}
   if(b.id==='slice-prev')this.setPosition(this.mm-1);
   if(b.id==='slice-next')this.setPosition(this.mm+1);
   if(b.id==='slice-center')this.setPosition(slicePlanes[this.plane].initial);
   if(b.id==='slice-retry')this.load();
  });
  $('#slice-position').addEventListener('input',e=>this.setPosition(Number(e.target.value)));
  $('#slice-contrast').addEventListener('input',e=>{this.contrast=Number(e.target.value);this.update();});
  this.canvas.addEventListener('pointermove',e=>{const p=this.eventPoint(e),ras=imageToRAS(this.plane,this.mm,...p);const idx=voxelIndex(...ras);const r=structureByLabel.get(this.seg?.[idx]);$('#slice-hover').textContent=(r?.name||'No anatomical label')+' · '+ras.map(v=>Math.round(v)).join(', ')+' mm';});
  this.canvas.addEventListener('click',e=>{if(!this.loaded)return;const uv=this.eventPoint(e),ras=imageToRAS(this.plane,this.mm,...uv),r=structureByLabel.get(this.seg[voxelIndex(...ras)]);this.point=uv;this.selected=r?.id||null;this.update();});
  this.canvas.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();this.setPosition(this.mm+1);}if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();this.setPosition(this.mm-1);}});
 }
 eventPoint(e){const r=this.canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];}
 async load(){
  if(this.loading)return this.loading;
  if(this.loaded)return;
  this.root.classList.add('is-loading');$('#slice-loading').innerHTML='<span class="loading-ring"></span><p>Loading the MRI template…</p>';
  this.loading=(async()=>{try{
   const res=await fetch('./assets/mri/volume.bin.gz');if(!res.ok)throw Error('MRI download failed');
   const packed=await res.arrayBuffer(),magic=new Uint8Array(packed,0,Math.min(2,packed.byteLength));
   let raw=packed;
   if(magic[0]===31&&magic[1]===139){
    if(typeof DecompressionStream==='undefined')throw Error('This browser does not support streamed MRI decompression.');
    raw=await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   }
   const n=MRI_SIZE**3;if(raw.byteLength!==n*2)throw Error('Unexpected MRI volume size');
   this.t1=new Uint8Array(raw,0,n);this.seg=new Uint8Array(raw,n,n);this.loaded=true;this.root.classList.remove('is-loading');
   if(this.active)this.update();
  }catch(e){console.error(e);$('#slice-loading').innerHTML='<p>The MRI template could not load.</p><p>Check your connection and use a current browser.</p><button class="primary-button" id="slice-retry">Try again</button>';}
  finally{this.loading=null;}})();return this.loading;
 }
 enter(){this.active=true;this.root.classList.remove('hidden');this.update();this.load();}
 exit(){this.active=false;this.root.classList.add('hidden');}
 setPlane(plane){if(!slicePlanes[plane])return;this.plane=plane;this.mm=slicePlanes[plane].initial;this.selected=null;this.point=null;this.update();}
 setPosition(value){const [min,max]=slicePlanes[this.plane].range;this.mm=Math.max(min,Math.min(max,Math.round(value)));this.point=null;this.update();}
 selectStructure(id){const entry=this.result?.visible.find(s=>s.structure.id===id);if(!entry)return;this.selected=id;this.point=entry.anchor.map(v=>v/(MRI_SIZE-1));this.update();}
 get state(){return {plane:this.plane,mm:this.mm,display:this.display,active:this.active,loaded:this.loaded,textureCanvas:this.textureCanvas};}
 update(){
  if(!this.active)return;
  const p=slicePlanes[this.plane],slider=$('#slice-position');slider.min=p.range[0];slider.max=p.range[1];slider.value=this.mm;slider.setAttribute('aria-valuetext',`${p.name}, ${p.axis} = ${this.mm} millimeters`);
  $('#slice-coordinate').textContent=`${p.axis} = ${this.mm>0?'+':''}${this.mm} mm`;
  $('#slice-direction-low').textContent=p.direction[0];$('#slice-direction-high').textContent=p.direction[1];
  $('#slice-image-name').textContent=p.name+' · T1-weighted template';
  this.root.dataset.display=this.display;
  $('#slice-labels').disabled=this.display==='cut';
  document.querySelectorAll('[data-slice-plane]').forEach(b=>{b.classList.toggle('active',b.dataset.slicePlane===this.plane);b.setAttribute('aria-pressed',b.dataset.slicePlane===this.plane);});
  document.querySelectorAll('[data-slice-display]').forEach(b=>{b.classList.toggle('active',b.dataset.sliceDisplay===this.display);b.setAttribute('aria-pressed',b.dataset.sliceDisplay===this.display);});
  for(const [selector,value]of [['#slice-overlay',this.overlay],['#slice-labels',this.labels]]){$(selector).classList.toggle('active',value);$(selector).setAttribute('aria-pressed',value);}
  ['top','bottom','left','right'].forEach((direction,i)=>$('#slice-orient-'+direction).textContent=p.orientation[i]);
  $('#slice-presets').innerHTML=p.presets.map(([name,mm])=>`<button data-slice-preset="${mm}" class="${mm===this.mm?'active':''}">${name}</button>`).join('');
  if(this.loaded){
   this.result=renderSlicePixels(this);
   if(this.selected&&!this.result.visible.some(s=>s.structure.id===this.selected)){this.selected=null;this.point=null;this.result=renderSlicePixels(this);}
   this.draw();this.updateScale(this.canvas.clientWidth);
  }
  this.renderSidebar($('#region-search')?.value||'');this.renderDetail();this.onChange?.(this.state);
 }
 updateScale(width){
  if(this.loaded&&this.display==='mri'&&width)renderScaleBar($('#mri-scale-bar'),MRI_FIELD_MM/width,Math.min(90,width/4));
 }
 draw(){
  const {pixels,visible,size}=this.result;
  const ctx=this.textureCanvas.getContext('2d');const image=ctx.createImageData(size,size);image.data.set(pixels);ctx.putImageData(image,0,0);
  const out=this.canvas.getContext('2d');this.canvas.width=this.canvas.height=512;out.imageSmoothingEnabled=true;out.drawImage(this.textureCanvas,0,0,512,512);
  if(this.labels){visible.slice(0,8).forEach((s,i)=>{const x=s.anchor[0]/255*512,y=s.anchor[1]/255*512;out.beginPath();out.arc(x,y,9,0,Math.PI*2);out.fillStyle='#101919dd';out.fill();out.strokeStyle=s.structure.color;out.lineWidth=1.4;out.stroke();out.fillStyle='#ffffff';out.font='9px sans-serif';out.textAlign='center';out.textBaseline='middle';out.fillText(String(i+1),x,y+.5);});}
  if(this.point){const [x,y]=this.point.map(v=>v*512);out.strokeStyle='#f1d998';out.lineWidth=1;out.beginPath();out.moveTo(x-18,y);out.lineTo(x-5,y);out.moveTo(x+5,y);out.lineTo(x+18,y);out.moveTo(x,y-18);out.lineTo(x,y-5);out.moveTo(x,y+5);out.lineTo(x,y+18);out.stroke();}
 }
 renderSidebar(query=''){
  const q=query.toLowerCase().trim();
  const visible=(this.result?.visible||[]).filter(s=>!q||(s.structure.name+' '+s.structure.description).toLowerCase().includes(q));
  $('#region-list').innerHTML='<div class="group-heading">SECTION PLANES</div>'+Object.entries(slicePlanes).map(([id,p])=>`<button class="region-row ${this.plane===id?'active':''}" data-slice-plane="${id}" aria-pressed="${this.plane===id}" style="--region-color:#91aaa1"><span class="region-dot"></span><span><strong>${p.name}</strong><small>${p.alias}</small></span></button>`).join('')+'<div class="group-heading">LABELED IN THIS SLICE<span>'+visible.length+'</span></div>'+(visible.length?visible.map(s=>{const num=(this.result?.visible||[]).indexOf(s)+1;return `<button class="region-row ${this.selected===s.structure.id?'active':''}" data-slice-structure="${s.structure.id}" style="--region-color:${s.structure.color}"><span class="slice-number">${num<=8?num:'·'}</span><span><strong>${s.structure.name}</strong><small>Template segmentation</small></span></button>`;}).join(''):`<p class="no-results">${this.loaded?'No matching structures at this level. Move the slice or try another search.':'Loading labeled structures…'}</p>`);
 }
 renderDetail(){
  const cite=this.cite;
  const p=slicePlanes[this.plane],visible=this.result?.visible||[],chosen=visible.find(s=>s.structure.id===this.selected)?.structure;
  const names=visible.filter(s=>!['white','cortex','csf','choroid'].includes(s.structure.id)).slice(0,5).map(s=>s.structure.name.toLowerCase());
  const reading=this.display==='mri'?p.reading:'The plane is placed in 3D anatomical space. Its on-screen orientation changes as you rotate. Switch to MRI image for fixed orientation markers.';
  $('#detail-panel').innerHTML=`<div class="detail-top"><div class="detail-eyebrow"><span>LEARNING FROM SECTIONS</span></div><div class="selected-chip"><i></i>Real MRI template</div><h2 class="detailed-name">${p.name} section</h2><p class="region-tagline">${p.axis} = ${this.mm>0?'+':''}${this.mm} mm · FreeSurfer surface RAS</p></div><div class="detail-body"><p class="description">${p.description}${cite('anatomicalPlanes','mriMetadata')}</p><div class="slice-reading"><h3 class="section-title">HOW TO READ THIS IMAGE</h3><p>${reading}${cite('mriMetadata','ras')}</p><p>On this T1-weighted image, white matter is generally brighter than gray matter; CSF is generally dark. Color is an optional segmentation overlay.${cite('t1Contrast')}</p></div>${chosen?`<div class="slice-selected" style="--region-color:${chosen.color}"><h3>${esc(chosen.name)}</h3><p>${chosen.description}${cite(...sliceEvidence[chosen.id],'segmentationLabels','mriMetadata')}</p>${chosen.atlas?`<button class="primary-button" data-region="${chosen.atlas}">Explore in the atlas →</button>`:''}</div>`:''}<h3 class="section-title">WHAT IS LABELED HERE?</h3><p class="description">${names.length?'The segmentation at this level includes '+names.join(', ')+'.':'Move the slice through the brain to find labeled structures.'} Select a structure in the list, or use MRI image to identify a location.</p><div class="slice-visible-chips">${visible.map(s=>`<button data-slice-structure="${s.structure.id}" style="--region-color:${s.structure.color}"><i></i>${s.structure.name}</button>`).join('')}</div><p class="model-note">Labels come from the matched fsaverage segmentation. A label’s presence does not mean every boundary is visually distinct on the MRI. This is an averaged template, not an individual scan; small structures and partial-volume boundaries are simplified.${cite('fsaverage','segmentation','mriMetadata')}</p><p class="model-note">Positions use FreeSurfer surface RAS, not MNI coordinates. Axial cuts follow the template axes and are not individually prescribed clinical scan angles.${cite('ras','mriMetadata')}</p><div class="research-preview"><h3 class="section-title">DATA & LEARNING REFERENCES</h3><a class="anatomy-source" href="https://mne.tools/stable/auto_tutorials/forward/10_background_freesurfer.html" target="_blank" rel="noopener noreferrer">About the fsaverage MRI template ↗</a><a class="anatomy-source" href="https://pubmed.ncbi.nlm.nih.gov/11832223/" target="_blank" rel="noopener noreferrer">FreeSurfer MRI segmentation method ↗</a><a class="anatomy-source" href="https://www.ncbi.nlm.nih.gov/books/NBK10889/" target="_blank" rel="noopener noreferrer">Internal anatomy of the cerebral hemispheres ↗</a><a class="anatomy-source" href="https://fmri.ucsd.edu/Howto/3T/structure.html" target="_blank" rel="noopener noreferrer">Reading T1 image contrast ↗</a><a class="anatomy-source" href="https://www.ncbi.nlm.nih.gov/books/NBK11083/" target="_blank" rel="noopener noreferrer">Ventricular anatomy ↗</a><a class="anatomy-source" href="./assets/mri/FREESURFER-LICENSE.txt" target="_blank">FreeSurfer data license ↗</a></div></div>`;
 }
}
