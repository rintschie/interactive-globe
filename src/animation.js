export function startAnimation(renderer, scene, camera, orbitControls, getActiveMesh, params) {
  function tick() {
    requestAnimationFrame(tick);

    const mesh = getActiveMesh();
    if (mesh) {
      mesh.rotation.y += params.rotationSpeed * 0.005;
    }

    orbitControls.update();
    renderer.render(scene, camera);
  }

  tick();
}
