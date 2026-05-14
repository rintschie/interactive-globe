import * as THREE from 'three';
import { createScene } from './scene.js';
import { buildSphere, getActiveMesh, getDotMaterial, findNearestDotDir, syncPinUniforms, MAX_PINS } from './sphere.js';
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
  edgeHardness:      0,
  continentsEnabled: false,
  dotSizeBlack:      0.005,
  dotSizeWhite:      0.005,
  hoverStrength:     0.25,
  hoverRadius:       100,
  hoverElevation:    0,
  dotColor:          '#374151',
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
mat.uniforms.uEdgeHardness.value = params.edgeHardness;
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

const pins = [];
const pinSubFolders = [];
const shellMeshes = [];
const pinShellParams = { opacity: 0.3, radius: 0.05 };

function syncPins() {
  syncPinUniforms(pins);
}

function refreshPinFolders() {
  pinSubFolders.forEach(f => f.destroy());
  pinSubFolders.length = 0;
  pins.forEach((pin, i) => {
    const latStr = `${Math.abs(pin.lat).toFixed(2)}° ${pin.lat >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(pin.lon).toFixed(2)}° ${pin.lon >= 0 ? 'E' : 'W'}`;
    const coordTitle = `#${i + 1}  ${latStr}, ${lonStr}`;
    const folder = pinsFolder.addFolder(pin.label.trim() || coordTitle);
    folder.add(pin, 'label').name('Label').onChange(val => {
      folder.$title.textContent = val.trim() || coordTitle;
    });
    folder.add({ fn: () => removePin(i) }, 'fn').name('Remove');
    pinSubFolders.push(folder);
  });
}

function createShellMesh(pin) {
  const shellMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor:     { value: pin.color.clone() },
      uOpacity:   { value: pinShellParams.opacity },
      uCameraPos: mat.uniforms.uCameraPos,
    },
    vertexShader: /* glsl */`
      varying vec3 vCenterWorld;
      void main() {
        vCenterWorld = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        gl_Position  = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3  uColor;
      uniform float uOpacity;
      uniform vec3  uCameraPos;
      varying vec3  vCenterWorld;
      void main() {
        float facing = dot(normalize(vCenterWorld), normalize(uCameraPos));
        float fade   = smoothstep(-0.1, 0.0, facing);
        gl_FragColor = vec4(uColor, uOpacity * fade);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), shellMat);
  shell.position.copy(pin.dir).multiplyScalar(params.sphereRadius);
  shell.scale.setScalar(pinShellParams.radius);
  shell.renderOrder = 1;
  return shell;
}

function updateShellAppearance() {
  shellMeshes.forEach(shell => {
    shell.material.uniforms.uOpacity.value = pinShellParams.opacity;
    shell.scale.setScalar(pinShellParams.radius);
  });
}

function updateShellPositions() {
  shellMeshes.forEach((shell, i) => {
    shell.position.copy(pins[i].dir).multiplyScalar(params.sphereRadius);
  });
}

function addPin(lat, lon, colorHex) {
  if (pins.length >= MAX_PINS) return;
  const dir = findNearestDotDir(lat, lon);
  if (!dir) return;
  pins.push({ lat, lon, label: '', dir, color: new THREE.Color(colorHex) });
  const shell = createShellMesh(pins[pins.length - 1]);
  shellMeshes.push(shell);
  getActiveMesh().add(shell);
  syncPins();
  refreshPinFolders();
}

function removePin(i) {
  const mesh = getActiveMesh();
  if (mesh && shellMeshes[i]) mesh.remove(shellMeshes[i]);
  shellMeshes.splice(i, 1);
  pins.splice(i, 1);
  syncPins();
  refreshPinFolders();
}

function clearAllPins() {
  shellMeshes.length = 0;
  pins.length = 0;
  syncPinUniforms([]);
  pinSubFolders.forEach(f => f.destroy());
  pinSubFolders.length = 0;
}

const { pinsFolder } = createGUI(
  params, cameraState,
  ()  => { buildSphere(scene, params); clearAllPins(); },
  hex => { mat.uniforms.uDotColor.value.set(hex); },
  hex => { scene.background.set(hex); mat.uniforms.uBgColor.value.set(hex); },
  v   => { mat.uniforms.uBackOpacity.value = v; },
  v   => { mat.uniforms.uEdgeHardness.value = v; },
  v   => { mat.uniforms.uUseMap.value = v; },
  v   => { mat.uniforms.uSphereRadius.value = v; updateShellPositions(); },
  v   => { mat.uniforms.uDotSizeBlack.value = v; },
  v   => { mat.uniforms.uDotSizeWhite.value = v; },
  v   => { mat.uniforms.uHoverStrength.value = v; },
  v   => { mat.uniforms.uHoverRadius.value = v; },
  v   => { mat.uniforms.uHoverElevation.value = v; },
  addPin
);

pinsFolder.add(pinShellParams, 'opacity', 0, 1, 0.01).name('Shell Opacity').onChange(updateShellAppearance);
pinsFolder.add(pinShellParams, 'radius', 0, 0.5, 0.001).name('Shell Radius').onChange(updateShellAppearance);

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
