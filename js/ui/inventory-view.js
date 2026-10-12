import * as THREE from 'three';
import { host, controls, siteRoots } from '../core.js';
import { inventoryBySite } from '../data/inventory.js';
import { setPharmacyReveal } from '../models/pharmacy.js';
import { setSalesPanelsVisible } from './sales-panels.js';

function injectStyles() {
  if (document.querySelector('#inventory-view-styles')) return;
  const style = document.createElement('style');
  style.id = 'inventory-view-styles';
  style.textContent = `
    .inventory-view { position:absolute; left:20px; bottom:20px; z-index:45; width:min(370px,calc(100% - 40px)); padding:14px; border-radius:18px; background:rgba(255,250,250,.96); border:1px solid rgba(142,65,73,.22); box-shadow:0 20px 48px rgba(71,42,45,.20); backdrop-filter:blur(14px); color:#3c2c2e; opacity:0; transform:translateY(12px); pointer-events:none; transition:opacity .22s ease,transform .22s ease; }
    .inventory-view.is-visible { opacity:1; transform:translateY(0); pointer-events:auto; }
    .inventory-view[data-site="SURCO"] { background:rgba(247,252,255,.97); border-color:rgba(83,126,157,.28); }
    .inventory-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px; }
    .inventory-kicker { font-size:9px; letter-spacing:.06em; text-transform:uppercase; font-weight:800; color:#8e4149; }
    .inventory-view[data-site="SURCO"] .inventory-kicker { color:#537e9d; }
    .inventory-title { margin:2px 0 0; font-size:18px; font-weight:800; }
    .inventory-note { margin-top:2px; color:#7e6b6d; font-size:9px; }
    .inventory-total { flex:0 0 auto; padding:6px 8px; border-radius:999px; background:#f4dfdf; color:#8e4149; font-size:10px; font-weight:800; }
    .inventory-view[data-site="SURCO"] .inventory-total { background:#e4f1f8; color:#537e9d; }
    .inventory-table { width:100%; border-collapse:collapse; font-size:10px; overflow:hidden; border-radius:12px; }
    .inventory-table th,.inventory-table td { padding:7px 6px; border-bottom:1px solid rgba(100,80,82,.09); text-align:right; }
    .inventory-table th:first-child,.inventory-table td:first-child { text-align:left; }
    .inventory-table th { color:#8b7779; font-size:8px; text-transform:uppercase; }
    .stock-ok { color:#41765c; font-weight:800; }
    .stock-low { color:#b54d56; font-weight:800; }
    .inventory-back { width:100%; margin-top:10px; border:0; border-radius:12px; padding:9px 12px; background:#8e4149; color:#fff; font-size:10px; font-weight:800; cursor:pointer; }
    .inventory-view[data-site="SURCO"] .inventory-back { background:#537e9d; }
    .inventory-back:hover { filter:brightness(1.05); }
    @media (max-width:720px) { .inventory-view { left:12px; bottom:56px; width:calc(100% - 24px); } }
  `;
  document.head.appendChild(style);
}

function buildRows(data) {
  return data.items.map((item) => {
    const low = item.stock <= item.min;
    return `
      <tr>
        <td><strong>${item.product}</strong><br><span>${item.dose}</span></td>
        <td class="${low ? 'stock-low' : 'stock-ok'}">${item.stock}</td>
        <td>${item.min}</td>
        <td class="${low ? 'stock-low' : 'stock-ok'}">${low ? 'Reponer' : 'OK'}</td>
      </tr>`;
  }).join('');
}

function createOverlay(onBack) {
  injectStyles();
  const overlay = document.createElement('aside');
  overlay.className = 'inventory-view';
  overlay.innerHTML = '<button class="inventory-back" type="button">← Volver a vista general</button>';
  host.appendChild(overlay);
  overlay.addEventListener('click', (event) => event.stopPropagation());
  overlay.addEventListener('pointerdown', (event) => event.stopPropagation());
  overlay.querySelector('.inventory-back').addEventListener('click', onBack);
  return overlay;
}

function renderOverlay(overlay, data) {
  const total = data.items.reduce((sum, item) => sum + item.stock, 0);
  overlay.dataset.site = data.siteKey;
  overlay.innerHTML = `
    <div class="inventory-top">
      <div>
        <div class="inventory-kicker">Inventario 3D · demo</div>
        <div class="inventory-title">${data.label}</div>
        <div class="inventory-note">${data.note}</div>
      </div>
      <div class="inventory-total">${total} u.</div>
    </div>
    <table class="inventory-table">
      <thead><tr><th>Producto</th><th>Stock</th><th>Mín.</th><th>Estado</th></tr></thead>
      <tbody>${buildRows(data)}</tbody>
    </table>
    <button class="inventory-back" type="button">← Volver a vista general</button>`;
}

export function createInventoryView({ onReturn }) {
  const state = {
    activeSite: null,
    activeRoot: null,
    amount: 0,
    targetAmount: 0,
    returning: false,
  };

  const overlay = createOverlay(() => close());

  function bindBackButton() {
    const button = overlay.querySelector('.inventory-back');
    if (button) button.addEventListener('click', close);
  }

  function focusInterior(root) {
    root.updateWorldMatrix(true, false);
    const target = root.localToWorld(new THREE.Vector3(0, 1.15, 0));
    const position = root.localToWorld(new THREE.Vector3(4.4, 4.05, 6.45));
    controls.normalizeRotations().setLookAt(
      position.x, position.y, position.z,
      target.x, target.y, target.z,
      true,
    );
  }

  function open(siteKey) {
    const root = siteRoots[siteKey];
    const data = inventoryBySite[siteKey];
    if (!root || !data) return;

    if (state.activeRoot && state.activeRoot !== root) {
      setPharmacyReveal(state.activeRoot, 0);
      state.amount = 0;
    }

    state.activeSite = siteKey;
    state.activeRoot = root;
    state.targetAmount = 1;
    state.returning = false;

    renderOverlay(overlay, data);
    bindBackButton();
    overlay.classList.add('is-visible');
    setSalesPanelsVisible(false);
    focusInterior(root);
  }

  function close() {
    if (!state.activeRoot || state.returning) return;
    state.returning = true;
    state.targetAmount = 0;
    overlay.classList.remove('is-visible');
    setSalesPanelsVisible(true);
    onReturn();
  }

  function update(delta) {
    if (!state.activeRoot) return;

    const speed = 7.0;
    const alpha = 1 - Math.exp(-speed * delta);
    state.amount = THREE.MathUtils.lerp(state.amount, state.targetAmount, alpha);
    setPharmacyReveal(state.activeRoot, state.amount);

    if (state.targetAmount === 0 && state.amount < 0.015) {
      setPharmacyReveal(state.activeRoot, 0);
      state.activeRoot = null;
      state.activeSite = null;
      state.amount = 0;
      state.returning = false;
    }
  }

  function isOpen() {
    return Boolean(state.activeRoot) && state.targetAmount > 0;
  }

  function getActiveSite() {
    return state.activeSite;
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.activeRoot) close();
  });

  return { open, close, update, isOpen, getActiveSite };
}
