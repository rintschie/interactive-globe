import * as THREE from 'three';

const DOT_GEO = new THREE.SphereGeometry(1, 7, 5);

// ShaderMaterial: blends back-facing dots toward the background color
// so backOpacity=0 makes them invisible, backOpacity=1 shows all dots equally
const DOT_MAT = new THREE.ShaderMaterial({
  uniforms: {
    uDotColor:    { value: new THREE.Color('#374151') },
    uBgColor:     { value: new THREE.Color('#F8F9FA') },
    uCameraPos:   { value: new THREE.Vector3()        },
    uBackOpacity: { value: 1.0                        },
  },
  vertexShader: /* glsl */`
    varying vec3 vWorldPos;
    void main() {
      // World position of this dot's center (ignore vertex offset, just the instance translation)
      vWorldPos = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform vec3  uDotColor;
    uniform vec3  uBgColor;
    uniform vec3  uCameraPos;
    uniform float uBackOpacity;
    varying vec3  vWorldPos;
    void main() {
      // Positive = facing camera, negative = facing away
      float facing = dot(normalize(vWorldPos), normalize(uCameraPos));
      // Smooth transition band around the terminator, then scale by (1 - backOpacity)
      float t = smoothstep(0.1, -0.1, facing) * (1.0 - uBackOpacity);
      gl_FragColor = vec4(mix(uDotColor, uBgColor, t), 1.0);
    }
  `,
});

export function getDotMaterial() { return DOT_MAT; }

let activeMesh = null;

export function buildSphere(scene, params) {
  if (activeMesh) {
    scene.remove(activeMesh);
    activeMesh = null;
  }

  const { ringCount, dotsPerRing, dotSize, sphereRadius } = params;

  let total = 0;
  for (let i = 0; i < ringCount; i++) {
    const phi = (i + 0.5) * Math.PI / ringCount;
    total += Math.max(1, Math.round(dotsPerRing * Math.sin(phi)));
  }

  const mesh = new THREE.InstancedMesh(DOT_GEO, DOT_MAT, total);
  const matrix = new THREE.Matrix4();
  const pos    = new THREE.Vector3();
  const scale  = new THREE.Vector3(dotSize, dotSize, dotSize);
  const quat   = new THREE.Quaternion();

  let idx = 0;
  for (let i = 0; i < ringCount; i++) {
    const phi      = (i + 0.5) * Math.PI / ringCount;
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
