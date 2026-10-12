import * as THREE from 'three';
import { scene, mat, box } from '../core.js';

const DURATION_SECONDS = 10;
const START_X = -8.35;
const END_X = 8.35;
const LANE_Z = 0.42;
const BASE_Y = 0.11;

function createWheel(x, parent, materials, wheels) {
  const material = mat('#252525', { transparent: true, opacity: 0 });
  materials.push(material);

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.09, 20),
    material,
  );
  wheel.position.set(x, 0.25, 0);
  wheel.rotation.x = Math.PI / 2;
  wheel.castShadow = true;
  parent.add(wheel);
  wheels.push(wheel);

  const hubMaterial = mat('#b7b9ba', {
    metalness: 0.55,
    roughness: 0.35,
    transparent: true,
    opacity: 0,
  });
  materials.push(hubMaterial);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.11, 14),
    hubMaterial,
  );
  hub.position.copy(wheel.position);
  hub.rotation.x = Math.PI / 2;
  parent.add(hub);
}

export function createMotorcyclist() {
  const group = new THREE.Group();
  group.position.set(START_X, BASE_Y, LANE_Z);
  group.scale.setScalar(0.9);
  group.visible = false;

  const materials = [];
  const wheels = [];

  createWheel(-0.34, group, materials, wheels);
  createWheel(0.34, group, materials, wheels);

  const bikeMaterial = mat('#8e4149', {
    metalness: 0.08,
    roughness: 0.5,
    transparent: true,
    opacity: 0,
  });
  const metalMaterial = mat('#d8d7d6', {
    metalness: 0.55,
    roughness: 0.3,
    transparent: true,
    opacity: 0,
  });
  const riderMaterial = mat('#374047', {
    transparent: true,
    opacity: 0,
  });
  const helmetMaterial = mat('#f2e7e7', {
    transparent: true,
    opacity: 0,
  });
  const skinMaterial = mat('#c99573', {
    transparent: true,
    opacity: 0,
  });
  materials.push(bikeMaterial, metalMaterial, riderMaterial, helmetMaterial, skinMaterial);

  box([0.62, 0.10, 0.16], [0, 0.40, 0], bikeMaterial, group);
  box([0.30, 0.18, 0.22], [0.03, 0.53, 0], bikeMaterial, group);
  box([0.28, 0.08, 0.20], [-0.18, 0.59, 0], riderMaterial, group);
  box([0.08, 0.34, 0.08], [0.27, 0.49, 0], metalMaterial, group);
  box([0.06, 0.06, 0.44], [0.30, 0.70, 0], metalMaterial, group);

  const torso = box([0.24, 0.42, 0.24], [-0.08, 0.91, 0], riderMaterial, group);
  torso.rotation.z = -0.23;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 12),
    skinMaterial,
  );
  head.position.set(0.02, 1.19, 0);
  head.castShadow = true;
  group.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    helmetMaterial,
  );
  helmet.position.set(0.02, 1.23, 0);
  helmet.castShadow = true;
  group.add(helmet);

  const armLeft = box([0.24, 0.055, 0.055], [0.11, 0.97, 0.11], riderMaterial, group);
  armLeft.rotation.z = -0.62;
  const armRight = armLeft.clone();
  armRight.position.z = -0.11;
  group.add(armRight);

  const legLeft = box([0.30, 0.075, 0.075], [-0.13, 0.69, 0.11], riderMaterial, group);
  legLeft.rotation.z = 0.72;
  const legRight = legLeft.clone();
  legRight.position.z = -0.11;
  group.add(legRight);

  scene.add(group);

  return {
    group,
    materials,
    wheels,
    elapsed: 0,
  };
}

function getOpacity(progress) {
  const fadeInEnd = 0.09;
  const fadeOutStart = 0.90;

  if (progress < fadeInEnd) {
    return THREE.MathUtils.smoothstep(progress, 0, fadeInEnd);
  }
  if (progress > fadeOutStart) {
    return 1 - THREE.MathUtils.smoothstep(progress, fadeOutStart, 1);
  }
  return 1;
}

export function updateMotorcyclist(state, delta) {
  state.elapsed = (state.elapsed + delta) % DURATION_SECONDS;
  const progress = state.elapsed / DURATION_SECONDS;
  const opacity = getOpacity(progress);

  state.group.visible = opacity > 0.01;
  state.group.position.x = THREE.MathUtils.lerp(START_X, END_X, progress);
  state.group.position.y = BASE_Y + Math.sin(progress * Math.PI * 10) * 0.008;
  state.group.position.z = LANE_Z;

  state.materials.forEach((material) => {
    material.opacity = opacity;
  });

  const travelDistance = END_X - START_X;
  const wheelTurns = travelDistance / (2 * Math.PI * 0.18);
  const wheelAngle = -progress * wheelTurns * Math.PI * 2;
  state.wheels.forEach((wheel) => {
    wheel.rotation.y = wheelAngle;
  });
}
