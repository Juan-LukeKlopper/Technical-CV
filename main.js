import './style.css';
import * as THREE from 'three';

const canvas = document.querySelector('#background');
const scene = new THREE.Scene();
const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
ambientLight.position.set(0, 0, 30);
scene.add(ambientLight);

const starGeometry = new THREE.BufferGeometry();
const stars = 2000;
const positions = new Float32Array(stars * 3);
for (let i = 0; i < stars * 3; i += 3) {
  positions[i] = THREE.MathUtils.randFloatSpread(1000);
  positions[i + 1] = THREE.MathUtils.randFloatSpread(1000);
  positions[i + 2] = THREE.MathUtils.randFloatSpread(1000);
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starField = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.95, sizeAttenuation: true, transparent: true, opacity: 0.9 })
);
scene.add(starField);

const textureLoader = new THREE.TextureLoader();

// Planet objects: intentionally restored to original pre-PR geometry/material/placement.
const earthTexture = textureLoader.load('/earth.jpg');
const earth = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), new THREE.MeshStandardMaterial({ map: earthTexture }));

const moonTexture = textureLoader.load('/moon.jpg');
const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshStandardMaterial({ map: moonTexture }));

const saturnTexture = textureLoader.load('/saturn.jpeg');
const saturn = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), new THREE.MeshStandardMaterial({ map: saturnTexture }));

earth.position.set(31, 20, 100);
moon.position.set(35, 24, 110);
saturn.position.set(55, 38, 180);
saturn.rotateX(-10);
scene.add(earth, moon, saturn);

const saturnsringInner = new THREE.Mesh(
  new THREE.TorusGeometry(9, 1, 2, 100),
  new THREE.MeshStandardMaterial({ color: 0x8a8a67, wireframe: true })
);
saturnsringInner.position.set(55, 38, 180);
saturnsringInner.rotateX(10.5);

const saturnsringOuter = new THREE.Mesh(
  new THREE.TorusGeometry(11, 1, 2, 100),
  new THREE.MeshStandardMaterial({ color: 0xffac32, wireframe: true })
);
saturnsringOuter.position.set(55, 38, 180);
saturnsringOuter.rotateX(10.5);
scene.add(saturnsringInner, saturnsringOuter);

function createRocket() {
  const rocket = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.2, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0xdce6ff, flatShading: true })
  );
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 2.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xff6588, flatShading: true })
  );
  const finGeo = new THREE.BoxGeometry(0.25, 1.1, 1.4);
  const finMat = new THREE.MeshStandardMaterial({ color: 0x4c69ff, flatShading: true });
  const finA = new THREE.Mesh(finGeo, finMat);
  const finB = finA.clone();

  finA.position.set(0.8, -2.5, 0);
  finB.position.set(-0.8, -2.5, 0);
  nose.position.y = 4.3;

  rocket.add(body, nose, finA, finB);
  rocket.position.set(-12, -6, -10);
  rocket.rotation.z = -0.35;
  return rocket;
}

const rocket = createRocket();
scene.add(rocket);

const shaderScene = new THREE.Scene();
const shaderCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const shaderUniforms = { uTime: { value: 0 } };

const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: shaderUniforms,
  depthWrite: false,
  depthTest: false,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;

      vec3 deep = vec3(0.006, 0.01, 0.03);
      vec3 haze = vec3(0.02, 0.025, 0.055);
      vec3 bg = mix(deep, haze, smoothstep(0.1, 0.95, uv.y));

      vec2 starCell = floor(uv * vec2(520.0, 300.0));
      float seed = hash(starCell);
      float star = step(0.9974, seed);
      float twinkle = 0.985 + 0.015 * sin(uTime * 0.15 + seed * 80.0);
      bg += star * twinkle * vec3(0.9, 0.92, 1.0);

      gl_FragColor = vec4(bg, 1.0);
    }
  `
});
shaderScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));

const scrollState = { current: 0, target: 0 };
const updateScrollTarget = () => {
  scrollState.target = document.body.getBoundingClientRect().top;
};
window.addEventListener('scroll', updateScrollTarget, { passive: true });
updateScrollTarget();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateScrollTarget();
});

const eggLiveRegion = document.querySelector('#easter-egg');
const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;
window.addEventListener('keydown', (event) => {
  const keyValue = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  konamiIndex = keyValue === konami[konamiIndex] ? konamiIndex + 1 : 0;
  if (konamiIndex === konami.length) {
    eggLiveRegion.textContent = 'Easter egg found: The universe says "Wubba Lubba Dub Dub" and trust nobody with a six-fingered journal.';
    konamiIndex = 0;
  }
});

let hiddenClicks = 0;
canvas.addEventListener('click', (event) => {
  if (event.clientX < 80 && event.clientY < 80) hiddenClicks += 1;
  if (hiddenClicks === 4) {
    eggLiveRegion.textContent = 'Second easter egg found: "Adventure is out there"... also check every triangle for cryptic clues.';
  }
});

renderer.autoClear = false;
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  scrollState.current += (scrollState.target - scrollState.current) * 0.05;
  const t = scrollState.current;

  shaderUniforms.uTime.value = elapsed;

  moon.rotation.z -= 0.01;
  earth.rotation.z += 0.01;
  earth.rotation.y += 0.01;
  moon.rotation.y += 0.01;
  saturn.rotation.x += 0.01;
  saturnsringInner.rotation.x += 0.01;
  saturnsringOuter.rotation.x += 0.01;
  starField.rotation.y += 0.00008;

  camera.position.y = t * -0.01;
  camera.position.x = t * -0.01;
  camera.position.z = t * -0.05;

  const progress = THREE.MathUtils.clamp(Math.abs(t) / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1), 0, 1);
  rocket.position.y = -6 + progress * 20 + Math.sin(elapsed * 0.9) * 0.35;
  rocket.position.x = -12 + progress * 30;
  rocket.position.z = -10 + progress * 140;
  rocket.rotation.z = -0.35 + Math.sin(elapsed * 0.7) * 0.05;

  renderer.clear();
  renderer.render(shaderScene, shaderCamera);
  renderer.clearDepth();
  renderer.render(scene, camera);
}

animate();
