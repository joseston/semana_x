import * as THREE from 'three';
import {
  host,
  camera,
  controls,
  leaderLayer,
  panelLayer,
  salesPanels,
} from '../core.js';

let panelsVisible = true;

function createLeader(side) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.classList.add('leader-path');
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.classList.add('leader-dot');
  dot.setAttribute('r', '4');
  leaderLayer.append(path, dot);
  return { path, dot, side };
}

export function createSalesPanel(data, side, anchor, focus, onFocus) {
  const el = document.createElement('section');
  el.className = 'sales-panel';
  el.dataset.site = data.key;
  el.dataset.side = side;

  const mounjaroRows = data.mounjaro
    .map(([dose, units, amount]) => `<tr><td>${dose}</td><td>${units}</td><td>${amount}</td></tr>`)
    .join('');
  const wegovyRows = data.wegovy
    .map(([dose, units, amount]) => `<tr><td>${dose}</td><td>${units}</td><td>${amount}</td></tr>`)
    .join('');

  el.innerHTML = `
    <div class="sales-head">
      <div><strong>${data.name} · ${data.district}</strong><span>Ventas reales · Setiembre 2026</span></div>
      <b>${data.totalUnits} u.</b>
    </div>
    <table>
      <thead><tr><th>Dosis</th><th>Und.</th><th>Monto</th></tr></thead>
      <tbody>
        <tr class="group"><td colspan="3">Mounjaro</td></tr>${mounjaroRows}
        <tr class="group"><td colspan="3">Wegovy</td></tr>${wegovyRows}
        <tr class="total"><td>Total sede</td><td>${data.totalUnits}</td><td>${data.totalAmount}</td></tr>
      </tbody>
    </table>
    <div class="sales-foot"><span>Traspasos internos excluidos</span><strong>${data.totalAmount}</strong></div>
    <button class="panel-action" type="button">Enfocar sede</button>`;

  panelLayer.appendChild(el);
  const panel = {
    data,
    side,
    el,
    anchor: anchor.clone(),
    focus: focus.clone(),
    leader: createLeader(side),
    dock: null,
  };
  panel.leader.path.dataset.site = data.key;
  panel.leader.dot.dataset.site = data.key;
  salesPanels.push(panel);

  el.querySelector('.panel-action').addEventListener('click', () => onFocus(data.key));
  el.addEventListener('wheel', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const magnitude = THREE.MathUtils.clamp(Math.abs(event.deltaY) * 0.008, 0.7, 2.6);
    const dollyAmount = event.deltaY < 0 ? magnitude : -magnitude;
    controls.setTarget(panel.focus.x, panel.focus.y, panel.focus.z, true);
    controls.dolly(dollyAmount, true);
  }, { passive: false });

  return panel;
}

export function setSalesPanelsVisible(visible) {
  panelsVisible = visible;
  panelLayer.style.display = visible ? '' : 'none';
  leaderLayer.style.display = visible ? '' : 'none';
}

export function refreshPanelGeometry() {
  const hostRect = host.getBoundingClientRect();
  salesPanels.forEach((panel) => {
    const rect = panel.el.getBoundingClientRect();
    panel.dock = {
      left: rect.left - hostRect.left,
      right: rect.right - hostRect.left,
      top: rect.top - hostRect.top,
      bottom: rect.bottom - hostRect.top,
      centerY: rect.top - hostRect.top + rect.height / 2,
    };
  });
}

function projectToScreen(world) {
  const p = world.clone().project(camera);
  return {
    x: (p.x * 0.5 + 0.5) * host.clientWidth,
    y: (-p.y * 0.5 + 0.5) * host.clientHeight,
    visible: p.z > -1 && p.z < 1,
  };
}

export function updateLeaderLines() {
  if (!panelsVisible) return;

  const width = host.clientWidth;
  const height = host.clientHeight;

  salesPanels.forEach((panel) => {
    if (!panel.dock) return;
    const target = projectToScreen(panel.anchor);
    const leader = panel.leader;
    const visible = target.visible
      && target.x > -80 && target.x < width + 80
      && target.y > -80 && target.y < height + 80;

    leader.path.style.opacity = visible ? '1' : '0';
    leader.dot.style.opacity = visible ? '1' : '0';
    if (!visible) return;

    const startX = panel.side === 'left' ? panel.dock.right : panel.dock.left;
    const startY = panel.dock.centerY;
    const bendX = panel.side === 'left'
      ? Math.max(startX + 34, (startX + target.x) * 0.5)
      : Math.min(startX - 34, (startX + target.x) * 0.5);

    leader.path.setAttribute('d', `M ${startX} ${startY} C ${bendX} ${startY}, ${bendX} ${target.y}, ${target.x} ${target.y}`);
    leader.dot.setAttribute('cx', String(target.x));
    leader.dot.setAttribute('cy', String(target.y));
  });
}
