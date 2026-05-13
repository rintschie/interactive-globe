import { createScene } from './scene.js';
import { buildSphere, getActiveMesh } from './sphere.js';
import { createGUI } from './gui.js';
import { startAnimation } from './animation.js';

const params = {
  ringCount: 32,
  dotsPerRing: 64,
  dotSize: 0.045,
  sphereRadius: 3,
  rotationSpeed: 0.4,
};

const { scene, camera, renderer, orbitControls } = createScene();

buildSphere(scene, params);
createGUI(params, () => buildSphere(scene, params));
startAnimation(renderer, scene, camera, orbitControls, getActiveMesh, params);
