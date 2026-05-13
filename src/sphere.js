import * as THREE from 'three';

// Shared geometry and material — reused across rebuilds
const DOT_GEO = new THREE.SphereGeometry(1, 7, 5);
const DOT_MAT = new THREE.MeshLambertMaterial({ color: '#374151' });

let activeMesh = null;

export function buildSphere(scene, params) {
  if (activeMesh) {
    scene.remove(activeMesh);
    activeMesh = null;
  }

  const { ringCount, dotsPerRing, dotSize, sphereRadius } = params;

  // Count total instances — rings near poles have fewer dots because sin(phi) → 0
  let total = 0;
  for (let i = 0; i < ringCount; i++) {
    const phi = (i + 0.5) * Math.PI / ringCount;
    total += Math.max(1, Math.round(dotsPerRing * Math.sin(phi)));
  }

  const mesh = new THREE.InstancedMesh(DOT_GEO, DOT_MAT, total);
  const matrix = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3(dotSize, dotSize, dotSize);
  const quat = new THREE.Quaternion(); // identity — dots don't need orientation

  let idx = 0;
  for (let i = 0; i < ringCount; i++) {
    const phi = (i + 0.5) * Math.PI / ringCount;
    const ringDots = Math.max(1, Math.round(dotsPerRing * Math.sin(phi)));

    for (let j = 0; j < ringDots; j++) {
      const theta = (j / ringDots) * 2 * Math.PI;
      pos.set(
        sphereRadius * Math.sin(phi) * Math.cos(theta),
        sphereRadius * Math.cos(phi),
        sphereRadius * Math.sin(phi) * Math.sin(theta)
      );
      matrix.compose(pos, quat, scale);
      mesh.setMatrixAt(idx++, matrix);
    }
  }

  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
  activeMesh = mesh;
  return mesh;
}

export function getActiveMesh() {
  return activeMesh;
}
