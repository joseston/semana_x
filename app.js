import * as THREE from 'three';
import CameraControls from 'camera-controls';

CameraControls.install({ THREE });

const host = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#edf3f0');
scene.fog = new THREE.Fog('#edf3f0', 19, 40);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

const leaderLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
leaderLayer.classList.add('leader-layer');
leaderLayer.setAttribute('aria-hidden', 'true');
host.appendChild(leaderLayer);

const panelLayer = document.createElement('div');
panelLayer.className = 'panel-layer';
host.appendChild(panelLayer);

const controls = new CameraControls(camera, renderer.domElement);
controls.smoothTime = 0.24;
controls.draggingSmoothTime = 0.09;
controls.dollyToCursor = true;
controls.dollySpeed = 0.62;
controls.truckSpeed = 1.55;
controls.azimuthRotateSpeed = 0.72;
controls.polarRotateSpeed = 0.68;
controls.minDistance = 6.4;
controls.maxDistance = 28;
controls.minPolarAngle = Math.PI * 0.16;
controls.maxPolarAngle = Math.PI * 0.475;
controls.boundaryFriction = 0.18;
controls.infinityDolly = false;
controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
controls.setBoundary(new THREE.Box3(new THREE.Vector3(-9.5,0.15,-9.5),new THREE.Vector3(9.5,4.8,9.5)));

const INITIAL_VIEW = { position: new THREE.Vector3(13.8,10.8,16.8), target: new THREE.Vector3(0,1.35,0) };
controls.setLookAt(INITIAL_VIEW.position.x,INITIAL_VIEW.position.y,INITIAL_VIEW.position.z,INITIAL_VIEW.target.x,INITIAL_VIEW.target.y,INITIAL_VIEW.target.z,false);
renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());

scene.add(new THREE.HemisphereLight('#f9fffb','#9caf9f',2.15));
const sun = new THREE.DirectionalLight('#ffffff',3.4);
sun.position.set(9,14,9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 40;
scene.add(sun);

const colors = { green:'#167b5a', greenDark:'#0f654a', wall:'#eef4f0', glass:'#72aa9a', asphalt:'#9dafaa' };
const salesBySite = {
  LINCE:{ key:'LINCE', name:'CIDON', district:'Lince', totalUnits:324, totalAmount:'S/ 434,885.48', mounjaro:[['2.5 mg',66,'S/ 65,259.70'],['5.0 mg',162,'S/ 209,962.00'],['7.5 mg',17,'S/ 32,218.78'],['10.0 mg',36,'S/ 73,715.00']], wegovy:[['2.4 mg',43,'S/ 53,730.00']] },
  SURCO:{ key:'SURCO', name:'CIDON', district:'Surco', totalUnits:209, totalAmount:'S/ 270,540.20', mounjaro:[['2.5 mg',48,'S/ 47,799.70'],['5.0 mg',134,'S/ 174,651.00'],['7.5 mg',6,'S/ 11,465.50'],['10.0 mg',12,'S/ 25,197.00']], wegovy:[['2.4 mg',9,'S/ 11,427.00']] }
};

const siteRoots = {};
const salesPanels = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();

function mat(color, extra={}) { return new THREE.MeshStandardMaterial({ color, roughness:0.78, ...extra }); }
function box(size, position, material, parent, options={}) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material); mesh.position.set(...position); mesh.castShadow = options.castShadow ?? true; mesh.receiveShadow = options.receiveShadow ?? true; parent.add(mesh); return mesh; }

function createFacadeSign(parent,text) {
  const canvas = document.createElement('canvas'); canvas.width=1024; canvas.height=320; const ctx=canvas.getContext('2d');
  ctx.fillStyle='#0f654a'; ctx.roundRect(16,16,992,288,40); ctx.fill();
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=12; ctx.roundRect(27,27,970,266,32); ctx.stroke();
  ctx.fillStyle='#dff4e9'; ctx.font='700 48px IBM Plex Sans, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('FARMACIA',512,91);
  ctx.fillStyle='#ffffff'; ctx.font='700 112px Bricolage Grotesque, IBM Plex Sans, sans-serif'; ctx.fillText(text,512,207);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
  const material = new THREE.MeshBasicMaterial({ map:texture, transparent:true, side:THREE.FrontSide, toneMapped:false });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.28,1.025),material); sign.position.set(0,2.62,1.455); sign.castShadow=false; parent.add(sign); return sign;
}
function pharmacyCross(parent,position) { const cross=new THREE.Group(); cross.position.set(...position); box([0.18,0.72,0.14],[0,0,0],mat('#ffffff'),cross); box([0.72,0.18,0.14],[0,0,0.01],mat('#ffffff'),cross); parent.add(cross); }
function createLeader(side) { const path=document.createElementNS('http://www.w3.org/2000/svg','path'); path.classList.add('leader-path'); const dot=document.createElementNS('http://www.w3.org/2000/svg','circle'); dot.classList.add('leader-dot'); dot.setAttribute('r','4'); leaderLayer.append(path,dot); return {path,dot,side}; }

function makeSalesPanel(data,side,anchor,focus) {
  const el=document.createElement('section'); el.className='sales-panel'; el.dataset.site=data.key; el.dataset.side=side;
  const mounjaroRows=data.mounjaro.map(([dose,units,amount])=>`<tr><td>${dose}</td><td>${units}</td><td>${amount}</td></tr>`).join('');
  const wegovyRows=data.wegovy.map(([dose,units,amount])=>`<tr><td>${dose}</td><td>${units}</td><td>${amount}</td></tr>`).join('');
  el.innerHTML=`<div class="sales-head"><div><strong>${data.name} · ${data.district}</strong><span>Ventas reales · Setiembre 2026</span></div><b>${data.totalUnits} u.</b></div><table><thead><tr><th>Dosis</th><th>Und.</th><th>Monto</th></tr></thead><tbody><tr class="group"><td colspan="3">Mounjaro</td></tr>${mounjaroRows}<tr class="group"><td colspan="3">Wegovy</td></tr>${wegovyRows}<tr class="total"><td>Total sede</td><td>${data.totalUnits}</td><td>${data.totalAmount}</td></tr></tbody></table><div class="sales-foot"><span>Traspasos internos excluidos</span><strong>${data.totalAmount}</strong></div><button class="panel-action" type="button">Enfocar sede</button>`;
  panelLayer.appendChild(el);
  const panel={data,side,el,anchor:anchor.clone(),focus:focus.clone(),leader:createLeader(side),dock:null}; salesPanels.push(panel);
  el.querySelector('.panel-action').addEventListener('click',()=>focusSite(data.key));
  el.addEventListener('wheel',(event)=>{ event.preventDefault(); event.stopPropagation(); const magnitude=THREE.MathUtils.clamp(Math.abs(event.deltaY)*0.008,0.7,2.6); const dollyAmount=event.deltaY<0?magnitude:-magnitude; controls.setTarget(panel.focus.x,panel.focus.y,panel.focus.z,true); controls.dolly(dollyAmount,true); },{passive:false});
  return panel;
}

function createPharmacy({siteKey,name,x,z,rotation=0,side}) {
  const root=new THREE.Group(); root.position.set(x,0,z); root.rotation.y=rotation; root.userData.site=siteKey; scene.add(root); siteRoots[siteKey]=root;
  box([4.4,0.28,3.1],[0,0.14,0],mat('#d4e0da'),root); box([3.9,2.25,2.65],[0,1.35,0],mat(colors.wall),root); box([4.15,0.48,2.86],[0,2.58,0],mat(colors.green),root);
  box([1.12,1.55,0.1],[0.72,1.22,1.38],mat(colors.glass,{metalness:0.05,roughness:0.22}),root); box([1.28,0.94,0.1],[-0.78,1.50,1.38],mat('#9ac6b9',{metalness:0.03,roughness:0.22}),root); box([0.07,0.94,0.13],[-0.78,1.50,1.44],mat('#f6fbf8'),root); box([1.28,0.07,0.13],[-0.78,1.50,1.44],mat('#f6fbf8'),root);
  box([0.1,0.88,1.1],[1.96,1.45,0.28],mat('#8dbbad',{roughness:0.25}),root); box([0.13,0.88,0.07],[2.02,1.45,0.28],mat('#eff8f4'),root); box([2.95,0.13,0.48],[-0.08,2.12,1.57],mat('#f8fbf9'),root); box([1.2,0.12,0.75],[0.72,0.24,1.68],mat('#bdccc4'),root);
  createFacadeSign(root,name); pharmacyCross(root,[-1.72,2.70,1.47]); box([1.0,0.35,0.72],[0.85,2.98,-0.45],mat('#c9d6d0'),root); box([0.5,0.24,0.48],[-0.8,2.93,-0.55],mat('#b5c6be'),root);
  makeSalesPanel(salesBySite[siteKey],side,new THREE.Vector3(x,3.25,z),new THREE.Vector3(x,1.35,z)); return root;
}

function createTree(x,z,scale=1) { const tree=new THREE.Group(); tree.position.set(x,0,z); tree.scale.setScalar(scale); const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.16,0.9,10),mat('#8b694e')); trunk.position.y=0.58; trunk.castShadow=true; tree.add(trunk); const crownMat=mat('#6b9d81'); [[0,1.35,0,.6],[-.35,1.25,.1,.43],[.35,1.25,.05,.43],[0,1.52,.18,.4]].forEach(([px,py,pz,r])=>{ const crown=new THREE.Mesh(new THREE.SphereGeometry(r,18,12),crownMat); crown.position.set(px,py,pz); crown.castShadow=true; tree.add(crown); }); scene.add(tree); }
function createStreetLight(x,z,rot=0) { const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rot; const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,2.0,10),mat('#536860',{metalness:.25})); pole.position.y=1.0; g.add(pole); box([0.54,.08,.12],[.22,2.0,0],mat('#536860'),g); const lamp=box([.22,.09,.22],[.47,1.95,0],mat('#eaf5c9',{emissive:'#dcefb2',emissiveIntensity:.25}),g); lamp.castShadow=false; scene.add(g); }
const island=new THREE.Mesh(new THREE.CylinderGeometry(9.1,9.5,0.45,72),mat('#dce7e1')); island.position.y=-0.24; island.receiveShadow=true; scene.add(island);
const park=new THREE.Mesh(new THREE.CircleGeometry(8.65,72),mat('#e4ede8')); park.rotation.x=-Math.PI/2; park.position.y=0.005; park.receiveShadow=true; scene.add(park);
function road(w,d,x,z,rotation=0) { const r=new THREE.Mesh(new THREE.BoxGeometry(w,0.055,d),mat(colors.asphalt)); r.position.set(x,0.055,z); r.rotation.y=rotation; r.receiveShadow=true; scene.add(r); const dashMat=mat('#dce5e0'); const step=1.15; const count=Math.floor(w/step); for(let i=-count/2;i<count/2;i++){ const dash=box([0.55,0.025,0.05],[i*step,0.095,0],dashMat,r,{castShadow:false}); dash.receiveShadow=false; } }
road(15.6,1.65,0,0,0); road(13.6,1.2,-0.3,0.4,Math.PI/2.8);
createPharmacy({siteKey:'LINCE',name:'CIDON',x:-4.1,z:-2.7,rotation:0.11,side:'left'});
createPharmacy({siteKey:'SURCO',name:'CIDON',x:4.1,z:2.75,rotation:Math.PI+0.11,side:'right'});
[[-6.6,3.5,.85],[-5.6,4.4,.68],[-2.1,4.9,.75],[2.0,-4.7,.78],[5.8,-3.8,.85],[6.8,-2.2,.65],[-6.9,-.9,.7],[6.9,.7,.72],[-1.7,-4.7,.64],[1.7,4.8,.66]].forEach(([x,z,s])=>createTree(x,z,s));
createStreetLight(-2.9,1.2,0); createStreetLight(2.9,-1.2,Math.PI); createStreetLight(-0.8,-2.4,Math.PI/2); createStreetLight(0.8,2.4,-Math.PI/2);
for(let i=0;i<11;i++){ const t=i/10; const x=THREE.MathUtils.lerp(-2.2,2.2,t); const z=Math.sin(t*Math.PI)*0.72; const marker=new THREE.Mesh(new THREE.SphereGeometry(0.075,12,8),mat(colors.green)); marker.position.set(x,0.18,z); scene.add(marker); }

function focusSite(siteKey){ const root=siteRoots[siteKey]; if(!root)return; const box3=new THREE.Box3().setFromObject(root); const sphere=box3.getBoundingSphere(new THREE.Sphere()); sphere.radius*=1.45; controls.normalizeRotations(); controls.fitToSphere(sphere,true); }
function resetView(){ controls.normalizeRotations().setLookAt(INITIAL_VIEW.position.x,INITIAL_VIEW.position.y,INITIAL_VIEW.position.z,INITIAL_VIEW.target.x,INITIAL_VIEW.target.y,INITIAL_VIEW.target.z,true); }
document.querySelector('#reset-view').addEventListener('click',resetView);
document.querySelectorAll('[data-focus-site]').forEach((button)=>button.addEventListener('click',()=>focusSite(button.dataset.focusSite)));
renderer.domElement.addEventListener('dblclick',(event)=>{ const rect=renderer.domElement.getBoundingClientRect(); pointer.x=((event.clientX-rect.left)/rect.width)*2-1; pointer.y=-((event.clientY-rect.top)/rect.height)*2+1; raycaster.setFromCamera(pointer,camera); const hit=raycaster.intersectObjects(Object.values(siteRoots),true)[0]; if(!hit)return; let node=hit.object; while(node&&!node.userData.site)node=node.parent; if(node?.userData.site)focusSite(node.userData.site); });

function projectToScreen(world){ const p=world.clone().project(camera); return {x:(p.x*0.5+0.5)*host.clientWidth,y:(-p.y*0.5+0.5)*host.clientHeight,visible:p.z>-1&&p.z<1}; }
function refreshPanelGeometry(){ const hostRect=host.getBoundingClientRect(); salesPanels.forEach((panel)=>{ const rect=panel.el.getBoundingClientRect(); panel.dock={left:rect.left-hostRect.left,right:rect.right-hostRect.left,top:rect.top-hostRect.top,bottom:rect.bottom-hostRect.top,centerY:rect.top-hostRect.top+rect.height/2}; }); }
function updateLeaderLines(){ const width=host.clientWidth,height=host.clientHeight; salesPanels.forEach((panel)=>{ if(!panel.dock)return; const target=projectToScreen(panel.anchor), leader=panel.leader; const visible=target.visible&&target.x>-80&&target.x<width+80&&target.y>-80&&target.y<height+80; leader.path.style.opacity=visible?'1':'0'; leader.dot.style.opacity=visible?'1':'0'; if(!visible)return; const startX=panel.side==='left'?panel.dock.right:panel.dock.left; const startY=panel.dock.centerY; const bendX=panel.side==='left'?Math.max(startX+34,(startX+target.x)*0.5):Math.min(startX-34,(startX+target.x)*0.5); leader.path.setAttribute('d',`M ${startX} ${startY} C ${bendX} ${startY}, ${bendX} ${target.y}, ${target.x} ${target.y}`); leader.dot.setAttribute('cx',String(target.x)); leader.dot.setAttribute('cy',String(target.y)); }); }
function resize(){ const width=host.clientWidth,height=host.clientHeight; if(!width||!height)return; camera.aspect=width/height; camera.updateProjectionMatrix(); renderer.setSize(width,height,false); leaderLayer.setAttribute('viewBox',`0 0 ${width} ${height}`); leaderLayer.setAttribute('width',String(width)); leaderLayer.setAttribute('height',String(height)); requestAnimationFrame(refreshPanelGeometry); }
const resizeObserver=new ResizeObserver(()=>{ resize(); refreshPanelGeometry(); }); resizeObserver.observe(host); salesPanels.forEach((panel)=>resizeObserver.observe(panel.el)); window.addEventListener('resize',resize); resize(); requestAnimationFrame(refreshPanelGeometry);

let activeSlide=0;
const slidePanels=[...document.querySelectorAll('[data-slide-panel]')];
const slideTabs=[...document.querySelectorAll('.slide-tab')];
const slideTriggers=[...document.querySelectorAll('[data-slide-target]')];
function setSlide(index){ const next=Math.max(0,Math.min(slidePanels.length-1,Number(index))); activeSlide=next; slidePanels.forEach((panel,i)=>panel.classList.toggle('is-active',i===next)); slideTabs.forEach((tab,i)=>tab.classList.toggle('is-active',i===next)); window.scrollTo({top:0,behavior:'smooth'}); if(next===0){ requestAnimationFrame(()=>{resize();refreshPanelGeometry();updateLeaderLines();}); } }
slideTriggers.forEach((trigger)=>trigger.addEventListener('click',()=>setSlide(trigger.dataset.slideTarget)));
window.addEventListener('keydown',(event)=>{ if(event.key==='ArrowRight'&&activeSlide<slidePanels.length-1)setSlide(activeSlide+1); if(event.key==='ArrowLeft'&&activeSlide>0)setSlide(activeSlide-1); });

function animate(){ requestAnimationFrame(animate); const delta=Math.min(clock.getDelta(),1/20); controls.update(delta); if(activeSlide===0){ updateLeaderLines(); renderer.render(scene,camera); } }
animate();
