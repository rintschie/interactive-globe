import { createScene } from './scene.js';
import { buildSphere, getActiveMesh, getDotMaterial } from './sphere.js';
import { createGUI } from './gui.js';
import { startAnimation } from './animation.js';
import { createThemeToggle } from './theme.js';

const params = {
  ringCount:       70,
  dotsPerRing:     170,
  dotSize:         0.005,
  sphereRadius:    3,
  rotationSpeed:   0.1,
  backOpacity:     0,
  backgroundColor: '#F8F9FA',
};

const cameraState = { target: null, lookAt: null };

const { scene, camera, renderer, orbitControls } = createScene();
const mat = getDotMaterial();

// Start in Cinematic view
camera.position.set(0, 3.5, 4.5);
orbitControls.target.set(0, 1.5, 0);
camera.lookAt(0, 1.5, 0);
orbitControls.update();

mat.uniforms.uBackOpacity.value = params.backOpacity;

buildSphere(scene, params);

createGUI(
  params,
  cameraState,
  () => buildSphere(scene, params),
  hex => { scene.background.set(hex); mat.uniforms.uBgColor.value.set(hex); },
  v   => { mat.uniforms.uBackOpacity.value = v; }
);

startAnimation(renderer, scene, camera, orbitControls, getActiveMesh, params, cameraState, mat);
createThemeToggle(scene, mat, params);
