const mod = (value, modulus) => ((value % modulus) + modulus) % modulus;

export const TRAFFIC_CYCLE_SECONDS = 10;
export const TRAVEL_HALF_DISTANCE = 8.35;
export const TRAVEL_DISTANCE = TRAVEL_HALF_DISTANCE * 2;
export const VEHICLE_SPEED = TRAVEL_DISTANCE / TRAFFIC_CYCLE_SECONDS;

export const MOTORCYCLE_ROUTE = {
  startX: -TRAVEL_HALF_DISTANCE,
  endX: TRAVEL_HALF_DISTANCE,
  laneZ: 0.42,
  baseY: 0.11,
};

export const CAR_ROUTE = {
  startS: -TRAVEL_HALF_DISTANCE,
  endS: TRAVEL_HALF_DISTANCE,
  centerX: -0.3,
  centerZ: 0.4,
  rotation: Math.PI / 2.8,
  laneOffset: 0.18,
  baseY: 0.10,
};

// Calculamos el punto exacto donde se cruzan las trayectorias centrales
// de la moto y el auto. Esto permite separar sus tiempos de ocupacion
// de la interseccion de forma deterministica, no visual.
const sinRoad = Math.sin(CAR_ROUTE.rotation);
const cosRoad = Math.cos(CAR_ROUTE.rotation);

const carIntersectionS = (
  CAR_ROUTE.centerZ
  + cosRoad * CAR_ROUTE.laneOffset
  - MOTORCYCLE_ROUTE.laneZ
) / sinRoad;

const intersectionX = (
  CAR_ROUTE.centerX
  + cosRoad * carIntersectionS
  + sinRoad * CAR_ROUTE.laneOffset
);

const motorcycleIntersectionProgress = (
  (intersectionX - MOTORCYCLE_ROUTE.startX)
  / (MOTORCYCLE_ROUTE.endX - MOTORCYCLE_ROUTE.startX)
);

const carIntersectionProgress = (
  (carIntersectionS - CAR_ROUTE.startS)
  / (CAR_ROUTE.endS - CAR_ROUTE.startS)
);

const motorcycleIntersectionTime = motorcycleIntersectionProgress * TRAFFIC_CYCLE_SECONDS;
const carLocalIntersectionTime = carIntersectionProgress * TRAFFIC_CYCLE_SECONDS;

// La separacion maxima posible dentro de un ciclo es medio ciclo.
// Programamos al auto para atravesar el cruce 5 s despues de la moto.
const desiredCarGlobalIntersectionTime = mod(
  motorcycleIntersectionTime + TRAFFIC_CYCLE_SECONDS / 2,
  TRAFFIC_CYCLE_SECONDS,
);

const carPhaseOffset = mod(
  carLocalIntersectionTime - desiredCarGlobalIntersectionTime,
  TRAFFIC_CYCLE_SECONDS,
);

function circularDistance(a, b, cycle) {
  const direct = Math.abs(a - b);
  return Math.min(direct, cycle - direct);
}

export const TRAFFIC_DIAGNOSTICS = {
  vehicleSpeed: VEHICLE_SPEED,
  intersectionX,
  motorcycleIntersectionTime,
  carIntersectionTime: desiredCarGlobalIntersectionTime,
  safetySeparationSeconds: circularDistance(
    motorcycleIntersectionTime,
    desiredCarGlobalIntersectionTime,
    TRAFFIC_CYCLE_SECONDS,
  ),
  carPhaseOffset,
};

export function createTrafficClock() {
  return { elapsed: 0 };
}

export function advanceTraffic(clock, delta) {
  clock.elapsed = mod(clock.elapsed + delta, TRAFFIC_CYCLE_SECONDS);
}

export function getMotorcycleProgress(clock) {
  return clock.elapsed / TRAFFIC_CYCLE_SECONDS;
}

export function getCarProgress(clock) {
  return mod(clock.elapsed + carPhaseOffset, TRAFFIC_CYCLE_SECONDS) / TRAFFIC_CYCLE_SECONDS;
}
