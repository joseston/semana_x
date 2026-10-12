import * as THREE from 'three';
import { scene, mat, box } from './core.js';
import { colors, siteThemes, salesBySite, siteLayout } from './config.js';
import { createPharmacy } from './models/pharmacy.js';
import { createSalesPanel } from './ui/sales-panels.js';

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.16, 0.9, 10),
    mat('#8b694e'),
  );
  trunk.position.y = 0.58;
  trunk.castShadow = true;
  tree.add(trunk);

  const crownMat = mat('#739b82');
  [[0,1.35,0,.6],[-.35,1.25,.1,.43],[.35,1.25,.05,.43],[0,1.52,.18,.4]]
    .forEach(([px, py, pz, r]) => {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), crownMat);
      crown.position.set(px, py, pz);
      crown.castShadow = true;
      tree.add(crown);
    });

  scene.add(tree);
}

function createStreetLight(x, z, rot = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rot;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.06, 2.0, 10),
    mat('#655d5d', { metalness: 0.25 }),
  );
  pole.position.y = 1.0;
  group.add(pole);

  box([0.54, 0.08, 0.12], [0.22, 2.0, 0], mat('#655d5d'), group);
  const lamp = box(
    [0.22, 0.09, 0.22],
    [0.47, 1.95, 0],
    mat('#fff0d8', { emissive: '#ffe7ba', emissiveIntensity: 0.25 }),
    group,
  );
  lamp.castShadow = false;
  scene.add(group);
}

function road(width, depth, x, z, rotation = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.055, depth),
    mat(colors.asphalt),
  );
  mesh.position.set(x, 0.055, z);
  mesh.rotation.y = rotation;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const dashMat = mat('#eee8e8');
  const step = 1.15;
  const count = Math.floor(width / step);
  for (let i = -count / 2; i < count / 2; i++) {
    const dash = box([0.55, 0.025, 0.05], [i * step, 0.095, 0], dashMat, mesh, { castShadow: false });
    dash.receiveShadow = false;
  }
}

function createBaseEnvironment() {
  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(9.65, 10.05, 0.45, 72),
    mat('#eadada'),
  );
  island.position.y = -0.24;
  island.receiveShadow = true;
  scene.add(island);

  const park = new THREE.Mesh(
    new THREE.CircleGeometry(9.2, 72),
    mat('#f8eeee'),
  );
  park.rotation.x = -Math.PI / 2;
  park.position.y = 0.005;
  park.receiveShadow = true;
  scene.add(park);

  road(17.2, 1.65, 0, 0, 0);
  road(15.6, 1.2, -0.3, 0.4, Math.PI / 2.8);
}

function createLandscape() {
  [
    [-7.2,3.7,.85],[-6.2,4.7,.68],[-2.5,5.4,.75],[2.4,-5.3,.78],
    [6.3,-4.2,.85],[7.3,-2.4,.65],[-7.5,-1.0,.7],[7.5,.8,.72],
    [-2.0,-5.2,.64],[2.0,5.3,.66],
  ].forEach(([x, z, scale]) => createTree(x, z, scale));

  createStreetLight(-3.4, 1.4, 0);
  createStreetLight(3.4, -1.4, Math.PI);
  createStreetLight(-1.0, -2.8, Math.PI / 2);
  createStreetLight(1.0, 2.8, -Math.PI / 2);

  for (let i = 0; i < 13; i++) {
    const t = i / 12;
    const x = THREE.MathUtils.lerp(-3.1, 3.1, t);
    const z = Math.sin(t * Math.PI) * 0.82;
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 8),
      mat(colors.accent),
    );
    marker.position.set(x, 0.18, z);
    scene.add(marker);
  }
}

export function buildScene({ onFocus }) {
  createBaseEnvironment();

  siteLayout.forEach((site) => {
    createPharmacy({
      ...site,
      theme: siteThemes[site.siteKey],
    });

    createSalesPanel(
      salesBySite[site.siteKey],
      site.side,
      new THREE.Vector3(site.x, 3.25, site.z),
      new THREE.Vector3(site.x, 1.35, site.z),
      onFocus,
    );
  });

  createLandscape();
}
