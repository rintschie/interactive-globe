import * as THREE from 'three';
import { createScene } from './scene.js';
import { buildSphere, getActiveMesh, getDotMaterial } from './sphere.js';
import { createGUI } from './gui.js';
import { startAnimation } from './animation.js';
import { createThemeToggle } from './theme.js';

const params = {
  ringCount:         70,
  dotsPerRing:       170,
  dotSize:           0.005,
  sphereRadius:      3,
  rotationSpeed:     0.1,
  backOpacity:       0,
  continentsEnabled: false,
  dotSizeBlack:      0.005,
  dotSizeWhite:      0.005,
  hoverStrength:     0.25,
  hoverRadius:       100,
  hoverElevation:    0,
  backgroundColor:   '#F8F9FA',
};

const cameraState = { target: null, lookAt: null };

const { scene, camera, renderer, orbitControls } = createScene();
const mat = getDotMaterial();

// Start in Cinematic view
camera.position.set(0, 3.5, 4.5);
orbitControls.target.set(0, 1.5, 0);
camera.lookAt(0, 1.5, 0);
orbitControls.update();

// Sync uniforms from initial params
mat.uniforms.uBackOpacity.value  = params.backOpacity;
mat.uniforms.uSphereRadius.value  = params.sphereRadius;
mat.uniforms.uDotSizeBlack.value  = params.dotSizeBlack;
mat.uniforms.uDotSizeWhite.value  = params.dotSizeWhite;
mat.uniforms.uHoverRadius.value    = params.hoverRadius;
mat.uniforms.uHoverStrength.value  = params.hoverStrength;
mat.uniforms.uHoverElevation.value = params.hoverElevation;

new THREE.TextureLoader().load(
  './images/8081_earthspec2k.jpg',
  tex => { mat.uniforms.uMap.value = tex; },
  undefined,
  () => console.warn('Continent map not found at images/8081_earthspec2k.jpg')
);

buildSphere(scene, params);

createGUI(
  params, cameraState,
  ()  => buildSphere(scene, params),
  hex => { scene.background.set(hex); mat.uniforms.uBgColor.value.set(hex); },
  v   => { mat.uniforms.uBackOpacity.value = v; },
  v   => { mat.uniforms.uUseMap.value = v; },
  v   => { mat.uniforms.uSphereRadius.value = v; },
  v   => { mat.uniforms.uDotSizeBlack.value = v; },
  v   => { mat.uniforms.uDotSizeWhite.value = v; },
  v   => { mat.uniforms.uHoverStrength.value = v; },
  v   => { mat.uniforms.uHoverRadius.value = v; },
  v   => { mat.uniforms.uHoverElevation.value = v; }
);

startAnimation(renderer, scene, camera, orbitControls, getActiveMesh, params, cameraState, mat);
createThemeToggle(scene, mat, params);

// Hover effect — track mouse in WebGL screen coords (Y flipped)
const canvas = renderer.domElement;
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mat.uniforms.uMouseScreen.value.set(
    e.clientX - rect.left,
    rect.height - (e.clientY - rect.top)
  );
});
canvas.addEventListener('mouseleave', () => {
  mat.uniforms.uMouseScreen.value.set(-9999, -9999);
});

// Keep resolution uniform in sync
window.addEventListener('resize', () => {
  mat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});
