import * as THREE from 'three';
import {
  host,
  scene,
  camera,
  renderer,
  controls,
  leaderLayer,
  siteRoots,
  salesPanels,
  raycaster,
  pointer,
  clock,
  INITIAL_VIEW,
} from './core.js';
import { buildScene } from './scene.js';
import {
  refreshPanelGeometry,
  updateLeaderLines,
} from './ui/sales-panels.js';
import { setupSlides } from './ui/slides.js';
import { createInventoryView } from './ui/inventory-view.js';
import {
  createMotorcyclist,
  updateMotorcyclist,
} from './animations/motorcyclist.js';
import {
  createCar,
  updateCar,
} from './animations/car.js';
import {
  createTrafficClock,
  advanceTraffic,
  getMotorcycleProgress,
  getCarProgress,
  TRAFFIC_DIAGNOSTICS,
} from './animations/traffic.js';

function focusSite(siteKey) {
  const root = siteRoots[siteKey];
  if (!root) return;

  const box3 = new THREE.Box3().setFromObject(root);
  const sphere = box3.getBoundingSphere(new THREE.Sphere());
  sphere.radius *= 1.45;
  controls.normalizeRotations();
  controls.fitToSphere(sphere, true);
}

function resetCameraView() {
  controls.normalizeRotations().setLookAt(
    INITIAL_VIEW.position.x,
    INITIAL_VIEW.position.y,
    INITIAL_VIEW.position.z,
    INITIAL_VIEW.target.x,
    INITIAL_VIEW.target.y,
    INITIAL_VIEW.target.z,
    true,
  );
}

buildScene({ onFocus: focusSite });

const trafficClock = createTrafficClock();
const motorcyclist = createMotorcyclist();
const car = createCar();
const inventoryView = createInventoryView({ onReturn: resetCameraView });

console.info(
  `[traffic] velocidad compartida: ${TRAFFIC_DIAGNOSTICS.vehicleSpeed.toFixed(2)} u/s · `
  + `separación en cruce: ${TRAFFIC_DIAGNOSTICS.safetySeparationSeconds.toFixed(2)} s`,
);

function raycastSite(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObjects(Object.values(siteRoots), true)[0];
  if (!hit) return null;

  let node = hit.object;
  while (node && !node.userData.site) node = node.parent;
  return node?.userData?.site ?? null;
}

const clickGesture = {
  active: false,
  x: 0,
  y: 0,
  startedAt: 0,
  moved: false,
};

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  clickGesture.active = true;
  clickGesture.x = event.clientX;
  clickGesture.y = event.clientY;
  clickGesture.startedAt = performance.now();
  clickGesture.moved = false;
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!clickGesture.active) return;
  const distance = Math.hypot(event.clientX - clickGesture.x, event.clientY - clickGesture.y);
  if (distance > 7) clickGesture.moved = true;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!clickGesture.active || event.button !== 0) return;
  const elapsed = performance.now() - clickGesture.startedAt;
  const isShortClick = !clickGesture.moved && elapsed < 450;
  clickGesture.active = false;
  if (!isShortClick) return;

  const siteKey = raycastSite(event.clientX, event.clientY);
  if (siteKey) inventoryView.open(siteKey);
});

renderer.domElement.addEventListener('pointercancel', () => {
  clickGesture.active = false;
});

document.querySelector('#reset-view').addEventListener('click', () => {
  if (inventoryView.isOpen()) inventoryView.close();
  else resetCameraView();
});

document.querySelectorAll('[data-focus-site]').forEach((button) => {
  button.addEventListener('click', () => {
    const siteKey = button.dataset.focusSite;
    if (inventoryView.isOpen()) inventoryView.open(siteKey);
    else focusSite(siteKey);
  });
});

document.querySelectorAll('[data-slide-target="1"]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    if (inventoryView.isOpen()) inventoryView.close();
  });
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' && inventoryView.isOpen()) inventoryView.close();
});

function resize() {
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  leaderLayer.setAttribute('viewBox', `0 0 ${width} ${height}`);
  leaderLayer.setAttribute('width', String(width));
  leaderLayer.setAttribute('height', String(height));
  requestAnimationFrame(refreshPanelGeometry);
}

const resizeObserver = new ResizeObserver(() => {
  resize();
  refreshPanelGeometry();
});
resizeObserver.observe(host);
salesPanels.forEach((panel) => resizeObserver.observe(panel.el));
window.addEventListener('resize', resize);
resize();
requestAnimationFrame(refreshPanelGeometry);

const slides = setupSlides({
  onShowThreeD: () => {
    resize();
    refreshPanelGeometry();
    updateLeaderLines();
  },
});

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 1 / 20);
  controls.update(delta);
  inventoryView.update(delta);

  advanceTraffic(trafficClock, delta);
  updateMotorcyclist(motorcyclist, getMotorcycleProgress(trafficClock));
  updateCar(car, getCarProgress(trafficClock));

  if (slides.getActiveSlide() === 0) {
    updateLeaderLines();
    renderer.render(scene, camera);
  }
}

animate();
