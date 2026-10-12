import * as THREE from 'three';
import { scene, mat, box } from '../core.js';
import { CAR_ROUTE, TRAVEL_DISTANCE } from './traffic.js';

function transparentMat(color, extra = {}) {
  return mat(color, { transparent: true, opacity: 0, ...extra });
}

function createWheel(x, z, parent, materials, wheels) {
  const holder = new THREE.Group();
  holder.position.set(x, 0.20, z);
  holder.rotation.x = Math.PI / 2;
  parent.add(holder);

  const tireMaterial = transparentMat('#252525');
  const hubMaterial = transparentMat('#c6c9cc', {
    metalness: 0.55,
    roughness: 0.3,
  });
  materials.push(tireMaterial, hubMaterial);

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.09, 20),
    tireMaterial,
  );
  tire.castShadow = true;
  holder.add(tire);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.105, 14),
    hubMaterial,
  );
  holder.add(hub);

  wheels.push(tire);
}

function getOpacity(progress) {
  const fadeInEnd = 0.08;
  const fadeOutStart = 0.92;

  if (progress < fadeInEnd) {
    return THREE.MathUtils.smoothstep(progress, 0, fadeInEnd);
  }
  if (progress > fadeOutStart) {
    return 1 - THREE.MathUtils.smoothstep(progress, fadeOutStart, 1);
  }
  return 1;
}

export function createCar() {
  const group = new THREE.Group();
  group.rotation.y = CAR_ROUTE.rotation;
  group.scale.setScalar(0.9);
  group.visible = false;

  const materials = [];
  const wheels = [];

  const bodyMaterial = transparentMat('#566f88', {
    metalness: 0.08,
    roughness: 0.45,
  });
  const roofMaterial = transparentMat('#dce8f0', {
    metalness: 0.04,
    roughness: 0.35,
  });
  const glassMaterial = transparentMat('#9fc7da', {
    metalness: 0.03,
    roughness: 0.20,
  });
  const headlightMaterial = transparentMat('#fff0bd', {
    emissive: '#ffe29a',
    emissiveIntensity: 0.35,
  });
  const tailLightMaterial = transparentMat('#b84f55', {
    emissive: '#8b2630',
    emissiveIntensity: 0.20,
  });
  materials.push(
    bodyMaterial,
    roofMaterial,
    glassMaterial,
    headlightMaterial,
    tailLightMaterial,
  );

  box([1.28, 0.30, 0.64], [0, 0.38, 0], bodyMaterial, group);
  box([0.66, 0.30, 0.56], [-0.08, 0.65, 0], roofMaterial, group);
  box([0.32, 0.22, 0.575], [0.16, 0.64, 0], glassMaterial, group);
  box([0.08, 0.13, 0.42], [0.66, 0.42, 0], headlightMaterial, group, { castShadow: false });
  box([0.06, 0.13, 0.42], [-0.66, 0.42, 0], tailLightMaterial, group, { castShadow: false });

  createWheel(-0.42, 0.34, group, materials, wheels);
  createWheel(-0.42, -0.34, group, materials, wheels);
  createWheel(0.42, 0.34, group, materials, wheels);
  createWheel(0.42, -0.34, group, materials, wheels);

  scene.add(group);

  return { group, materials, wheels };
}

export function updateCar(state, progress) {
  const opacity = getOpacity(progress);
  const s = THREE.MathUtils.lerp(CAR_ROUTE.startS, CAR_ROUTE.endS, progress);
  const sinRoad = Math.sin(CAR_ROUTE.rotation);
  const cosRoad = Math.cos(CAR_ROUTE.rotation);

  state.group.visible = opacity > 0.01;
  state.group.position.x = (
    CAR_ROUTE.centerX
    + cosRoad * s
    + sinRoad * CAR_ROUTE.laneOffset
  );
  state.group.position.z = (
    CAR_ROUTE.centerZ
    - sinRoad * s
    + cosRoad * CAR_ROUTE.laneOffset
  );
  state.group.position.y = CAR_ROUTE.baseY + Math.sin(progress * Math.PI * 8) * 0.004;

  state.materials.forEach((material) => {
    material.opacity = opacity;
  });

  const wheelTurns = TRAVEL_DISTANCE / (2 * Math.PI * 0.15);
  const wheelAngle = -progress * wheelTurns * Math.PI * 2;
  state.wheels.forEach((wheel) => {
    wheel.rotation.y = wheelAngle;
  });
}
