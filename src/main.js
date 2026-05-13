import { createScene } from './scene.js';
import { buildSphere, getActiveMesh, getDotMaterial } from './sphere.js';
import { createGUI } from './gui.js';
import { startAnimation } from './animation.js';
import { createThemeToggle } from './theme.js';

const params = {
  ringCount:       32,
  dotsPerRing:     64,
  dotSize:         0.045,
  sphereRadius:    3,
  rotationSpeed:   0.1,
  backOpacity:     1.0,
  backgroundColor: '#F8F9FA',
};

const cameraState = { target: null, lookAt: null };

const { scene, camera, renderer, orbitControls } = createScene();
const mat = getDotMaterial();

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
