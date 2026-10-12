export const SCENE_CONFIG = {
  background: '#faeeee',
  fogNear: 21,
  fogFar: 44,
  initialView: {
    position: [15.8, 11.8, 19.2],
    target: [0, 1.35, 0],
  },
  boundary: {
    min: [-10.5, 0.15, -10.5],
    max: [10.5, 4.8, 10.5],
  },
};

export const colors = {
  accent: '#b85a63',
  accentDark: '#8e4149',
  wall: '#f5eded',
  asphalt: '#aaa0a0',
};

export const siteThemes = {
  LINCE: {
    accent: '#dc8c91',
    accentDark: '#aa555d',
    wall: '#f8eaea',
    glass: '#d9a8ab',
    glassSoft: '#edc9cb',
    trim: '#f1d8da',
  },
  SURCO: {
    accent: '#87b5d1',
    accentDark: '#537e9d',
    wall: '#edf5fa',
    glass: '#a8c9dc',
    glassSoft: '#d4e7f2',
    trim: '#dcebf4',
  },
};

export const salesBySite = {
  LINCE: {
    key: 'LINCE',
    name: 'CIDON',
    district: 'Lince',
    totalUnits: 324,
    totalAmount: 'S/ 434,885.48',
    mounjaro: [
      ['2.5 mg', 66, 'S/ 65,259.70'],
      ['5.0 mg', 162, 'S/ 209,962.00'],
      ['7.5 mg', 17, 'S/ 32,218.78'],
      ['10.0 mg', 36, 'S/ 73,715.00'],
    ],
    wegovy: [['2.4 mg', 43, 'S/ 53,730.00']],
  },
  SURCO: {
    key: 'SURCO',
    name: 'CIDON',
    district: 'Surco',
    totalUnits: 209,
    totalAmount: 'S/ 270,540.20',
    mounjaro: [
      ['2.5 mg', 48, 'S/ 47,799.70'],
      ['5.0 mg', 134, 'S/ 174,651.00'],
      ['7.5 mg', 6, 'S/ 11,465.50'],
      ['10.0 mg', 12, 'S/ 25,197.00'],
    ],
    wegovy: [['2.4 mg', 9, 'S/ 11,427.00']],
  },
};

export const siteLayout = [
  {
    siteKey: 'LINCE',
    name: 'CIDON',
    x: -5.2,
    z: -3.45,
    rotation: 0.11,
    side: 'left',
  },
  {
    siteKey: 'SURCO',
    name: 'CIDON',
    x: 5.2,
    z: 3.45,
    rotation: 0.55,
    side: 'right',
  },
];
