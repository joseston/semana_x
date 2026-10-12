import * as THREE from 'three';
import { mat, box } from '../core.js';

function addRack(parent, x, theme, itemOffset = 0) {
  const rack = new THREE.Group();
  rack.position.set(x, 0, -0.68);
  parent.add(rack);

  const frame = mat('#c7b9b9', { metalness: 0.18, roughness: 0.55 });
  const shelf = mat('#f5eeee');

  box([0.06, 1.55, 0.06], [-0.39, 1.18, 0], frame, rack);
  box([0.06, 1.55, 0.06], [0.39, 1.18, 0], frame, rack);

  [0.56, 0.97, 1.38, 1.79].forEach((y) => {
    box([0.86, 0.055, 0.38], [0, y, 0], shelf, rack, { castShadow: false });
  });

  const productColors = [theme.accent, theme.accentDark, '#ffffff', theme.glass, '#d9c5aa', theme.glassSoft];
  let index = itemOffset;
  [0.69, 1.10, 1.51].forEach((y) => {
    [-0.22, 0.0, 0.22].forEach((px) => {
      const color = productColors[index % productColors.length];
      box([0.14, 0.22, 0.18], [px, y, 0.01], mat(color), rack, { castShadow: true });
      index += 1;
    });
  });
}

export function createPharmacyInterior(parent, inventory, theme) {
  const interior = new THREE.Group();
  interior.visible = false;
  parent.add(interior);

  box([3.45, 0.08, 2.25], [0, 0.36, 0], mat('#f7f1f0'), interior, { castShadow: false });
  box([3.35, 0.08, 0.10], [0, 0.42, -1.00], mat(theme.trim), interior, { castShadow: false });

  addRack(interior, -1.05, theme, 0);
  addRack(interior, 0, theme, 3);
  addRack(interior, 1.05, theme, 6);

  const counter = new THREE.Group();
  counter.position.set(0.75, 0, 0.72);
  interior.add(counter);
  box([1.28, 0.72, 0.48], [0, 0.73, 0], mat('#eee4e3'), counter);
  box([1.36, 0.10, 0.56], [0, 1.11, 0], mat(theme.accent), counter);

  const fridge = new THREE.Group();
  fridge.position.set(-1.38, 0, 0.62);
  interior.add(fridge);
  box([0.68, 1.46, 0.48], [0, 1.09, 0], mat('#dfe9ec'), fridge);
  box([0.58, 1.16, 0.06], [0, 1.13, 0.27], mat('#b9d4df', { metalness: 0.05, roughness: 0.18 }), fridge);
  box([0.035, 0.34, 0.04], [0.21, 1.12, 0.32], mat('#8b8d90', { metalness: 0.4 }), fridge);

  const totalStock = inventory.items.reduce((sum, item) => sum + item.stock, 0);
  interior.userData.totalStock = totalStock;
  return interior;
}
