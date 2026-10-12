import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const host = document.querySelector('#scene');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#edf3f0');
scene.fog = new THREE.Fog('#edf3f0', 19, 40);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(12.8, 10.2, 15.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
host.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = true;
controls.minDistance = 9;
controls.maxDistance = 27;
controls.minPolarAngle = Math.PI * 0.18;
controls.maxPolarAngle = Math.PI * 0.47;
controls.target.set(0, 1.35, 0);

scene.add(new THREE.HemisphereLight('#f9fffb', '#9caf9f', 2.15));
const sun = new THREE.DirectionalLight('#ffffff', 3.4);
sun.position.set(9, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 40;
scene.add(sun);

const colors = {
  green: '#167b5a',
  greenDark: '#0f654a',
  white: '#f8fbf9',
  wall: '#eef4f0',
  wallSide: '#dbe8e1',
  glass: '#72aa9a',
  asphalt: '#9dafaa',
  grass: '#dfe9e3',
  curb: '#c5d4cc',
};

const salesBySite = {
  CIDON: {
    name: 'CIDON', district: 'Lince', totalUnits: 324, totalAmount: 'S/ 434,885.48',
    mounjaro: [
      ['2.5 mg', 66, 'S/ 65,259.70'],
      ['5.0 mg', 162, 'S/ 209,962.00'],
      ['7.5 mg', 17, 'S/ 32,218.78'],
      ['10.0 mg', 36, 'S/ 73,715.00'],
    ],
    wegovy: [['2.4 mg', 43, 'S/ 53,730.00']],
  },
  CIATOB: {
    name: 'CIATOB', district: 'Surco', totalUnits: 209, totalAmount: 'S/ 270,540.20',
    mounjaro: [
      ['2.5 mg', 48, 'S/ 47,799.70'],
      ['5.0 mg', 134, 'S/ 174,651.00'],
      ['7.5 mg', 6, 'S/ 11,465.50'],
      ['10.0 mg', 12, 'S/ 25,197.00'],
    ],
    wegovy: [['2.4 mg', 9, 'S/ 11,427.00']],
  },
};

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...extra });
}

function box(size, position, material, parent, options = {}) {
  const geometry = new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function roundedSign(parent, text, position) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f654a';
  ctx.roundRect(18, 18, 988, 284, 42);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.roundRect(28, 28, 968, 264, 34);
  ctx.stroke();

  ctx.fillStyle = '#dff4e9';
  ctx.font = '700 48px IBM Plex Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FARMACIA', 512, 92);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 112px Bricolage Grotesque, IBM Plex Sans, sans-serif';
  ctx.fillText(text, 512, 205);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(...position);
  sprite.scale.set(4.8, 1.5, 1);
  sprite.renderOrder = 20;
  parent.add(sprite);
}

function pharmacyCross(parent, position) {
  const cross = new THREE.Group();
  cross.position.set(...position);
  box([0.18, 0.72, 0.14], [0, 0, 0], mat('#ffffff'), cross);
  box([0.72, 0.18, 0.14], [0, 0, 0.01], mat('#ffffff'), cross);
  parent.add(cross);
}

function makeLabel(name, district) {
  const el = document.createElement('div');
  el.className = 'label';
  el.innerHTML = `<strong>${name}</strong><span>${district}</span>`;
  const obj = new CSS2DObject(el);
  obj.position.set(0, 3.75, 0);
  return obj;
}

function makeSalesPanel(data) {
  const el = document.createElement('div');
  el.className = 'sales-panel';

  const mounjaroRows = data.mounjaro
    .map(([dose, units, amount]) => `<tr><td>${dose}</td><td>${units}</td><td>${amount}</td></tr>`)
    .join('');
  const wegovyRows = data.wegovy
    .map(([dose, units, amount]) => `<tr><td>${dose}</td><td>${units}</td><td>${amount}</td></tr>`)
    .join('');

  el.innerHTML = `
    <div class="sales-head">
      <div>
        <strong>${data.name} · ${data.district}</strong>
        <span>Ventas reales · Setiembre 2026</span>
      </div>
      <b>${data.totalUnits} u.</b>
    </div>
    <table>
      <thead><tr><th>Dosis</th><th>Und.</th><th>Monto</th></tr></thead>
      <tbody>
        <tr class="group"><td colspan="3">Mounjaro</td></tr>
        ${mounjaroRows}
        <tr class="group"><td colspan="3">Wegovy</td></tr>
        ${wegovyRows}
        <tr class="total"><td>Total sede</td><td>${data.totalUnits}</td><td>${data.totalAmount}</td></tr>
      </tbody>
    </table>
    <div class="sales-foot">
      <span>Traspasos internos excluidos</span>
      <strong>${data.totalAmount}</strong>
    </div>`;

  return new CSS2DObject(el);
}

function createPharmacy({ name, district, x, z, rotation = 0 }) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotation;
  scene.add(root);

  box([4.4, 0.28, 3.1], [0, 0.14, 0], mat('#d4e0da'), root);
  box([3.9, 2.25, 2.65], [0, 1.35, 0], mat(colors.wall), root);
  box([4.15, 0.48, 2.86], [0, 2.58, 0], mat(colors.green), root);

  // Front glass storefront
  box([1.12, 1.55, 0.1], [0.72, 1.22, 1.38], mat(colors.glass, { metalness: 0.05, roughness: 0.22 }), root);
  box([1.28, 0.94, 0.1], [-0.78, 1.50, 1.38], mat('#9ac6b9', { metalness: 0.03, roughness: 0.22 }), root);
  box([0.07, 0.94, 0.13], [-0.78, 1.50, 1.44], mat('#f6fbf8'), root);
  box([1.28, 0.07, 0.13], [-0.78, 1.50, 1.44], mat('#f6fbf8'), root);

  // Side windows
  box([0.1, 0.88, 1.1], [1.96, 1.45, 0.28], mat('#8dbbad', { roughness: 0.25 }), root);
  box([0.13, 0.88, 0.07], [2.02, 1.45, 0.28], mat('#eff8f4'), root);

  // Awning and entry step
  box([2.95, 0.13, 0.48], [-0.08, 2.12, 1.57], mat('#f8fbf9'), root);
  box([1.2, 0.12, 0.75], [0.72, 0.24, 1.68], mat('#bdccc4'), root);

  // The pharmacy sign is a camera-facing sprite so it stays legible while rotating.
  roundedSign(root, name, [0, 2.76, 1.78]);
  pharmacyCross(root, [-1.72, 2.70, 1.64]);

  // Roof equipment for extra depth
  box([1.0, 0.35, 0.72], [0.85, 2.98, -0.45], mat('#c9d6d0'), root);
  box([0.5, 0.24, 0.48], [-0.8, 2.93, -0.55], mat('#b5c6be'), root);

  root.add(makeLabel(name, district));

  const salesPanel = makeSalesPanel(salesBySite[name]);
  const side = x < 0 ? -1 : 1;
  salesPanel.position.set(x + side * 2.8, 5.45, z + (x < 0 ? 0.2 : -0.2));
  scene.add(salesPanel);

  return root;
}

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.9, 10), mat('#8b694e'));
  trunk.position.y = 0.58;
  trunk.castShadow = true;
  tree.add(trunk);
  const crownMat = mat('#6b9d81');
  [[0,1.35,0,.6],[-.35,1.25,.1,.43],[.35,1.25,.05,.43],[0,1.52,.18,.4]].forEach(([px,py,pz,r]) => {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), crownMat);
    crown.position.set(px,py,pz);
    crown.castShadow = true;
    tree.add(crown);
  });
  scene.add(tree);
}

function createStreetLight(x, z, rot = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, 2.0, 10), mat('#536860', { metalness: .25 }));
  pole.position.y = 1.0;
  g.add(pole);
  box([0.54,.08,.12], [.22,2.0,0], mat('#536860'), g);
  const lamp = box([.22,.09,.22], [.47,1.95,0], mat('#eaf5c9', { emissive: '#dcefb2', emissiveIntensity: .25 }), g);
  lamp.castShadow = false;
  scene.add(g);
}

// Ground platform
const island = new THREE.Mesh(
  new THREE.CylinderGeometry(9.1, 9.5, 0.45, 72),
  mat('#dce7e1')
);
island.position.y = -0.24;
island.receiveShadow = true;
scene.add(island);

const park = new THREE.Mesh(new THREE.CircleGeometry(8.65, 72), mat('#e4ede8'));
park.rotation.x = -Math.PI / 2;
park.position.y = 0.005;
park.receiveShadow = true;
scene.add(park);

// Roads
function road(w, d, x, z, rotation = 0) {
  const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.055, d), mat(colors.asphalt));
  r.position.set(x, 0.055, z);
  r.rotation.y = rotation;
  r.receiveShadow = true;
  scene.add(r);
  const dashMat = mat('#dce5e0');
  const step = 1.15;
  const count = Math.floor(w / step);
  for (let i = -count/2; i < count/2; i++) {
    const dash = box([0.55, 0.025, 0.05], [i*step, 0.095, 0], dashMat, r, { castShadow: false });
    dash.receiveShadow = false;
  }
}
road(15.6, 1.65, 0, 0, 0);
road(13.6, 1.2, -0.3, 0.4, Math.PI / 2.8);

// Buildings + per-site sales panels
createPharmacy({ name: 'CIDON', district: 'Lince', x: -4.1, z: -2.7, rotation: 0.11 });
createPharmacy({ name: 'CIATOB', district: 'Surco', x: 4.1, z: 2.75, rotation: Math.PI + 0.11 });

// Landscaping
[
  [-6.6, 3.5, .85],[-5.6, 4.4,.68],[-2.1,4.9,.75],[2.0,-4.7,.78],
  [5.8,-3.8,.85],[6.8,-2.2,.65],[-6.9,-.9,.7],[6.9,.7,.72],
  [-1.7,-4.7,.64],[1.7,4.8,.66]
].forEach(([x,z,s]) => createTree(x,z,s));

createStreetLight(-2.9, 1.2, 0);
createStreetLight(2.9, -1.2, Math.PI);
createStreetLight(-0.8, -2.4, Math.PI / 2);
createStreetLight(0.8, 2.4, -Math.PI / 2);

// Small route markers
for (let i = 0; i < 11; i++) {
  const t = i / 10;
  const x = THREE.MathUtils.lerp(-2.2, 2.2, t);
  const z = Math.sin(t * Math.PI) * 0.72;
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), mat(colors.green));
  marker.position.set(x, 0.18, z);
  scene.add(marker);
}

function resize() {
  const width = host.clientWidth;
  const height = host.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  labelRenderer.setSize(width, height);
}

window.addEventListener('resize', resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();
