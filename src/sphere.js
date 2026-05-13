import * as THREE from 'three';

const DOT_GEO = new THREE.SphereGeometry(1, 7, 5);

const defaultMap = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
defaultMap.needsUpdate = true;

const DOT_MAT = new THREE.ShaderMaterial({
  uniforms: {
    uDotColor:    { value: new THREE.Color('#374151') },
    uBgColor:     { value: new THREE.Color('#F8F9FA') },
    uCameraPos:   { value: new THREE.Vector3()        },
    uBackOpacity: { value: 1.0                        },
    uMap:         { value: defaultMap                 },
    uUseMap:      { value: false                      },
    uSphereRadius:  { value: 3.0                       },
    uDotSizeBlack:  { value: 0.005                     },
    uDotSizeWhite:  { value: 0.005                     },
    uMouseScreen:   { value: new THREE.Vector2(-9999, -9999) },
    uResolution:    { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uHoverRadius:     { value: 100.0                   },
    uHoverStrength:   { value: 0.25                    },
    uHoverElevation:  { value: 0.0                     },
  },
  vertexShader: /* glsl */`
    #define PI 3.14159265358979

    uniform float     uSphereRadius;
    uniform float     uDotSizeBlack;
    uniform float     uDotSizeWhite;
    uniform sampler2D uMap;
    uniform bool      uUseMap;
    uniform vec2      uMouseScreen;
    uniform vec2      uResolution;
    uniform float     uHoverRadius;
    uniform float     uHoverStrength;
    uniform float     uHoverElevation;

    varying vec3 vDotCenter;
    varying vec3 vLocalPos;

    void main() {
      vec3  dir      = vec3(instanceMatrix[3]);
      float dotScale = instanceMatrix[0][0];

      vLocalPos  = dir * uSphereRadius;

      if (uUseMap) {
        float u   = 0.5 - atan(dir.z, dir.x) / (2.0 * PI);
        float v   = 0.5 + asin(clamp(dir.y, -1.0, 1.0)) / PI;
        vec4  s   = texture2D(uMap, vec2(u, v));
        float lum = 0.299 * s.r + 0.587 * s.g + 0.114 * s.b;
        dotScale  = mix(uDotSizeBlack, uDotSizeWhite, lum);
      }

      // Screen-space hover: project dot centre, measure pixel distance to mouse
      vec4  clip      = projectionMatrix * viewMatrix * modelMatrix * vec4(vLocalPos, 1.0);
      vec2  ndc       = clip.xy / clip.w;
      vec2  screen    = (ndc * 0.5 + 0.5) * uResolution;
      float dist      = length(screen - uMouseScreen);
      float hoverT    = 1.0 - smoothstep(0.0, uHoverRadius, dist);

      // Elevate dot outward along sphere normal
      vLocalPos += dir * uHoverElevation * hoverT;

      vDotCenter = (modelMatrix * vec4(vLocalPos, 1.0)).xyz;

      float hoverScale = 1.0 + uHoverStrength * hoverT;
      dotScale *= hoverScale;

      vec3 vertexPos = vLocalPos + position * dotScale;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPos, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    #define PI 3.14159265358979

    uniform vec3      uDotColor;
    uniform vec3      uBgColor;
    uniform vec3      uCameraPos;
    uniform float     uBackOpacity;
    uniform sampler2D uMap;
    uniform bool      uUseMap;
    varying vec3      vDotCenter;
    varying vec3      vLocalPos;

    void main() {
      // Use dot centre so the entire dot fades as one unit
      float facing   = dot(normalize(vDotCenter), normalize(uCameraPos));
      // uBackOpacity=0 → cutoff at horizon, uBackOpacity=1 → past back pole (all visible)
      // 1.0 - smoothstep keeps edges in ascending order (GLSL-safe)
      float cutoff   = -uBackOpacity;
      float backFade = 1.0 - smoothstep(cutoff - 0.1, cutoff, facing);

      float t = backFade;
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

  const { ringCount, dotsPerRing, dotSize } = params;

  let total = 0;
  for (let i = 0; i < ringCount; i++) {
    const phi = (i + 0.5) * Math.PI / ringCount;
    total += Math.max(1, Math.round(dotsPerRing * Math.sin(phi)));
  }

  const mesh   = new THREE.InstancedMesh(DOT_GEO, DOT_MAT, total);
  const matrix = new THREE.Matrix4();
  const dir    = new THREE.Vector3();
  const scale  = new THREE.Vector3(dotSize, dotSize, dotSize);
  const quat   = new THREE.Quaternion();

  let idx = 0;
  for (let i = 0; i < ringCount; i++) {
    const phi      = (i + 0.5) * Math.PI / ringCount;
    const ringDots = Math.max(1, Math.round(dotsPerRing * Math.sin(phi)));

    for (let j = 0; j < ringDots; j++) {
      const theta = (j / ringDots) * 2 * Math.PI;
      // Store unit direction — radius applied per-frame in vertex shader
      dir.set(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      );
      matrix.compose(dir, quat, scale);
      mesh.setMatrixAt(idx++, matrix);
    }
  }

  mesh.instanceMatrix.needsUpdate = true;
  // Carry rotation across rebuilds; default to 180° flip on first build
  mesh.rotation.y = activeMesh ? activeMesh.rotation.y : Math.PI;
  scene.add(mesh);
  activeMesh = mesh;
  return mesh;
}

export function getActiveMesh() {
  return activeMesh;
}
