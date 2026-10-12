import * as THREE from 'three';
import { scene, renderer, siteRoots, mat, box } from '../core.js';
import { createPharmacyInterior } from './pharmacy-interior.js';

function createFacadeSign(parent, text, theme) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = theme.accentDark;
  ctx.roundRect(16, 16, 992, 288, 40);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.roundRect(27, 27, 970, 266, 32);
  ctx.stroke();
  ctx.fillStyle = '#fff5f5';
  ctx.font = '700 48px IBM Plex Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FARMACIA', 512, 91);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 112px Bricolage Grotesque, IBM Plex Sans, sans-serif';
  ctx.fillText(text, 512, 207);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.FrontSide,
    toneMapped: false,
  });

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.28, 1.025), material);
  sign.position.set(0, 2.62, 1.455);
  sign.castShadow = false;
  parent.add(sign);
}

function pharmacyCross(parent, position) {
  const cross = new THREE.Group();
  cross.position.set(...position);
  box([0.18, 0.72, 0.14], [0, 0, 0], mat('#ffffff'), cross);
  box([0.72, 0.18, 0.14], [0, 0, 0.01], mat('#ffffff'), cross);
  parent.add(cross);
}

export function createPharmacy({ siteKey, name, x, z, rotation = 0, theme, inventory }) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotation;
  root.userData.site = siteKey;
  scene.add(root);
  siteRoots[siteKey] = root;

  box([4.4, 0.28, 3.1], [0, 0.14, 0], mat(theme.trim), root);

  const bodyMaterial = mat(theme.wall, {
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });
  box([3.9, 2.25, 2.65], [0, 1.35, 0], bodyMaterial, root);

  const roofGroup = new THREE.Group();
  root.add(roofGroup);
  box([4.15, 0.48, 2.86], [0, 2.58, 0], mat(theme.accent), roofGroup);
  box([1.0, 0.35, 0.72], [0.85, 2.98, -0.45], mat(theme.trim), roofGroup);
  box([0.5, 0.24, 0.48], [-0.8, 2.93, -0.55], mat(theme.trim), roofGroup);

  const frontGroup = new THREE.Group();
  root.add(frontGroup);
  box([1.12, 1.55, 0.1], [0.72, 1.22, 1.38], mat(theme.glass, { metalness: 0.05, roughness: 0.22 }), frontGroup);
  box([1.28, 0.94, 0.1], [-0.78, 1.50, 1.38], mat(theme.glassSoft, { metalness: 0.03, roughness: 0.22 }), frontGroup);
  box([0.07, 0.94, 0.13], [-0.78, 1.50, 1.44], mat('#ffffff'), frontGroup);
  box([1.28, 0.07, 0.13], [-0.78, 1.50, 1.44], mat('#ffffff'), frontGroup);
  box([0.1, 0.88, 1.1], [1.96, 1.45, 0.28], mat(theme.glass, { roughness: 0.25 }), frontGroup);
  box([0.13, 0.88, 0.07], [2.02, 1.45, 0.28], mat('#ffffff'), frontGroup);
  box([2.95, 0.13, 0.48], [-0.08, 2.12, 1.57], mat('#fffdfd'), frontGroup);
  box([1.2, 0.12, 0.75], [0.72, 0.24, 1.68], mat(theme.trim), frontGroup);
  createFacadeSign(frontGroup, name, theme);
  pharmacyCross(frontGroup, [-1.72, 2.70, 1.47]);

  const interior = createPharmacyInterior(root, inventory, theme);

  root.userData.reveal = {
    roofGroup,
    frontGroup,
    bodyMaterial,
    interior,
    amount: 0,
  };

  return root;
}

export function setPharmacyReveal(root, amount) {
  const state = root?.userData?.reveal;
  if (!state) return;

  const progress = THREE.MathUtils.clamp(amount, 0, 1);
  state.amount = progress;
  state.interior.visible = progress > 0.02;
  state.roofGroup.position.y = progress * 2.35;
  state.frontGroup.position.z = progress * 1.65;
  state.frontGroup.position.y = -progress * 0.18;
  state.bodyMaterial.opacity = THREE.MathUtils.lerp(1, 0.12, progress);
}
