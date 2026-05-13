import GUI from 'three/addons/libs/lil-gui.module.min.js';

export function createGUI(params, onRebuild) {
  const gui = new GUI({ title: 'Globe Controls' });

  gui.add(params, 'ringCount', 5, 80, 1).name('Latitude Rings').onChange(onRebuild);
  gui.add(params, 'dotsPerRing', 5, 120, 1).name('Dots per Ring').onChange(onRebuild);
  gui.add(params, 'dotSize', 0.005, 0.15, 0.001).name('Dot Size').onChange(onRebuild);
  gui.add(params, 'sphereRadius', 1, 5, 0.1).name('Sphere Radius').onChange(onRebuild);
  gui.add(params, 'rotationSpeed', 0, 2, 0.01).name('Rotation Speed');

  return gui;
}
