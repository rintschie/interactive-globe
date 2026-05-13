export function startAnimation(renderer, scene, camera, orbitControls, getActiveMesh, params, cameraState, dotMaterial) {
  function tick() {
    requestAnimationFrame(tick);

    const mesh = getActiveMesh();
    if (mesh) {
      mesh.rotation.y += params.rotationSpeed * 0.005;
    }

    // Keep shader in sync with camera world position
    dotMaterial.uniforms.uCameraPos.value.copy(camera.position);

    if (cameraState.target) {
      orbitControls.enabled = false;
      camera.position.lerp(cameraState.target, 0.07);
      orbitControls.target.lerp(cameraState.lookAt, 0.07);
      camera.lookAt(orbitControls.target);
      if (camera.position.distanceTo(cameraState.target) < 0.02) {
        camera.position.copy(cameraState.target);
        orbitControls.target.copy(cameraState.lookAt);
        cameraState.target = null;
        orbitControls.enabled = true;
        orbitControls.update();
      }
    } else {
      orbitControls.update();
    }

    renderer.render(scene, camera);
  }

  tick();
}
