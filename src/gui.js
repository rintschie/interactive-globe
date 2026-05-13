import GUI from 'three/addons/libs/lil-gui.module.min.js';
import * as THREE from 'three';

const PRESETS = {
  'Front': {
    pos:    new THREE.Vector3(0, 0, 9),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
  'Cinematic': {
    pos:    new THREE.Vector3(0, 3.5, 4.5),
    lookAt: new THREE.Vector3(0, 1.5, 0),
  },
};

export function createGUI(
  params, cameraState,
  onRebuild, onBgChange, onBackOpacity, onContinents,
  onSphereRadius, onDotSizeBlack, onDotSizeWhite,
  onHoverStrength, onHoverRadius, onHoverElevation
) {
  const gui = new GUI({ title: 'Globe Controls' });

  const presetObj = { view: 'Cinematic' };
  gui.add(presetObj, 'view', Object.keys(PRESETS)).name('Camera Preset').onChange(v => {
    cameraState.target = PRESETS[v].pos.clone();
    cameraState.lookAt = PRESETS[v].lookAt.clone();
  });

  gui.add(params, 'ringCount', 5, 500, 1).name('Latitude Rings').onChange(onRebuild);
  gui.add(params, 'dotsPerRing', 5, 1000, 1).name('Dots per Ring').onChange(onRebuild);
  gui.add(params, 'dotSize', 0.005, 0.15, 0.001).name('Dot Size').onChange(onRebuild);
  gui.add(params, 'sphereRadius', 0.1, 10, 0.1).name('Sphere Radius').onChange(onSphereRadius);
  gui.add(params, 'rotationSpeed', 0, 2, 0.01).name('Rotation Speed');
  gui.add(params, 'backOpacity', -1, 1, 0.01).name('Back Visibility').onChange(onBackOpacity);
  gui.add(params, 'continentsEnabled').name('Continents Enabled').onChange(onContinents);
  gui.add(params, 'dotSizeBlack', 0, 0.05, 0.001).name('Continent Dots').onChange(onDotSizeBlack);
  gui.add(params, 'dotSizeWhite', 0, 0.05, 0.001).name('Ocean Dots').onChange(onDotSizeWhite);
  gui.add(params, 'hoverStrength', 0, 3, 0.01).name('Hover Enlargement').onChange(onHoverStrength);
  gui.add(params, 'hoverRadius', 0, 300, 1).name('Hover Radius (px)').onChange(onHoverRadius);
  gui.add(params, 'hoverElevation', 0, 2, 0.01).name('Hover Elevation').onChange(onHoverElevation);
  gui.addColor(params, 'backgroundColor').name('Background Color').onChange(onBgChange);

  return gui;
}
