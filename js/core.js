import * as THREE from 'three';
import CameraControls from 'camera-controls';
import { SCENE_CONFIG } from './config.js';

CameraControls.install({ THREE });

export const host = document.querySelector('#scene');
export const scene = new THREE.Scene();
scene.background = new THREE.Color(SCENE_CONFIG.background);
scene.fog = new THREE.Fog(SCENE_CONFIG.background, SCENE_CONFIG.fogNear, SCENE_CONFIG.fogFar);

export const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

export const leaderLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
leaderLayer.classList.add('leader-layer');
leaderLayer.setAttribute('aria-hidden', 'true');
host.appendChild(leaderLayer);

export const panelLayer = document.createElement('div');
panelLayer.className = 'panel-layer';
host.appendChild(panelLayer);

export const controls = new CameraControls(camera, renderer.domElement);
controls.smoothTime = 0.24;
controls.draggingSmoothTime = 0.09;
controls.dollyToCursor = true;
controls.dollySpeed = 0.62;
controls.truckSpeed = 1.55;
controls.azimuthRotateSpeed = 0.72;
controls.polarRotateSpeed = 0.68;
controls.minDistance = 6.4;
controls.maxDistance = 30;
controls.minPolarAngle = Math.PI * 0.16;
controls.maxPolarAngle = Math.PI * 0.475;
controls.boundaryFriction = 0.18;
controls.infinityDolly = false;
controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
controls.setBoundary(new THREE.Box3(
  new THREE.Vector3(...SCENE_CONFIG.boundary.min),
  new THREE.Vector3(...SCENE_CONFIG.boundary.max),
));

export const INITIAL_VIEW = {
  position: new THREE.Vector3(...SCENE_CONFIG.initialView.position),
  target: new THREE.Vector3(...SCENE_CONFIG.initialView.target),
};
controls.setLookAt(
  INITIAL_VIEW.position.x, INITIAL_VIEW.position.y, INITIAL_VIEW.position.z,
  INITIAL_VIEW.target.x, INITIAL_VIEW.target.y, INITIAL_VIEW.target.z,
  false,
);
renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());

scene.add(new THREE.HemisphereLight('#fffafa', '#b9aaa8', 2.15));
const sun = new THREE.DirectionalLight('#ffffff', 3.4);
sun.position.set(9, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -16;
sun.shadow.camera.right = 16;
sun.shadow.camera.top = 16;
sun.shadow.camera.bottom = -16;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 44;
scene.add(sun);

export const siteRoots = {};
export const salesPanels = [];
export const raycaster = new THREE.Raycaster();
export const pointer = new THREE.Vector2();
export const clock = new THREE.Clock();

export function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...extra });
}

export function box(size, position, material, parent, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}
