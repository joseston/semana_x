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

function resetView() {
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

console.info(
  `[traffic] velocidad compartida: ${TRAFFIC_DIAGNOSTICS.vehicleSpeed.toFixed(2)} u/s · `
  + `separación en cruce: ${TRAFFIC_DIAGNOSTICS.safetySeparationSeconds.toFixed(2)} s`,
);

document.querySelector('#reset-view').addEventListener('click', resetView);
document.querySelectorAll('[data-focus-site]').forEach((button) => {
  button.addEventListener('click', () => focusSite(button.dataset.focusSite));
});

renderer.domElement.addEventListener('dblclick', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObjects(Object.values(siteRoots), true)[0];
  if (!hit) return;

  let node = hit.object;
  while (node && !node.userData.site) node = node.parent;
  if (node?.userData.site) focusSite(node.userData.site);
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

  advanceTraffic(trafficClock, delta);
  updateMotorcyclist(motorcyclist, getMotorcycleProgress(trafficClock));
  updateCar(car, getCarProgress(trafficClock));

  if (slides.getActiveSlide() === 0) {
    updateLeaderLines();
    renderer.render(scene, camera);
  }
}

animate();
