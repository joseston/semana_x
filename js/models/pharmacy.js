import * as THREE from 'three';
import { scene, renderer, siteRoots, mat, box } from '../core.js';

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

export function createPharmacy({ siteKey, name, x, z, rotation = 0, theme }) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  root.rotation.y = rotation;
  root.userData.site = siteKey;
  scene.add(root);
  siteRoots[siteKey] = root;

  box([4.4, 0.28, 3.1], [0, 0.14, 0], mat(theme.trim), root);
  box([3.9, 2.25, 2.65], [0, 1.35, 0], mat(theme.wall), root);
  box([4.15, 0.48, 2.86], [0, 2.58, 0], mat(theme.accent), root);
  box([1.12, 1.55, 0.1], [0.72, 1.22, 1.38], mat(theme.glass, { metalness: 0.05, roughness: 0.22 }), root);
  box([1.28, 0.94, 0.1], [-0.78, 1.50, 1.38], mat(theme.glassSoft, { metalness: 0.03, roughness: 0.22 }), root);
  box([0.07, 0.94, 0.13], [-0.78, 1.50, 1.44], mat('#ffffff'), root);
  box([1.28, 0.07, 0.13], [-0.78, 1.50, 1.44], mat('#ffffff'), root);
  box([0.1, 0.88, 1.1], [1.96, 1.45, 0.28], mat(theme.glass, { roughness: 0.25 }), root);
  box([0.13, 0.88, 0.07], [2.02, 1.45, 0.28], mat('#ffffff'), root);
  box([2.95, 0.13, 0.48], [-0.08, 2.12, 1.57], mat('#fffdfd'), root);
  box([1.2, 0.12, 0.75], [0.72, 0.24, 1.68], mat(theme.trim), root);

  createFacadeSign(root, name, theme);
  pharmacyCross(root, [-1.72, 2.70, 1.47]);
  box([1.0, 0.35, 0.72], [0.85, 2.98, -0.45], mat(theme.trim), root);
  box([0.5, 0.24, 0.48], [-0.8, 2.93, -0.55], mat(theme.trim), root);

  return root;
}
