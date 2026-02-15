import './style.css';
import * as THREE from 'three';

const canvas = document.querySelector('#background');
const scene = new THREE.Scene();
const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 42);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);

scene.add(new THREE.AmbientLight(0xa8b6ff, 0.8));
const keyLight = new THREE.PointLight(0xffffff, 1.2, 900);
keyLight.position.set(15, 20, 25);
scene.add(keyLight);

const starGeometry = new THREE.BufferGeometry();
const stars = 1800;
const positions = new Float32Array(stars * 3);
for (let i = 0; i < stars * 3; i += 3) {
  positions[i] = THREE.MathUtils.randFloatSpread(1500);
  positions[i + 1] = THREE.MathUtils.randFloatSpread(1500);
  positions[i + 2] = THREE.MathUtils.randFloatSpread(1500);
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starField = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0.9 })
);
scene.add(starField);

const textureLoader = new THREE.TextureLoader();
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(7, 64, 64),
  new THREE.MeshStandardMaterial({ map: textureLoader.load('/earth.jpg'), roughness: 0.95, metalness: 0.02 })
);
earth.position.set(24, 7, -42);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(1.8, 48, 48),
  new THREE.MeshStandardMaterial({ map: textureLoader.load('/moon.jpg'), roughness: 1, metalness: 0.01 })
);
moon.position.set(30, 11, -38);

const saturn = new THREE.Mesh(
  new THREE.SphereGeometry(8.2, 64, 64),
  new THREE.MeshStandardMaterial({ map: textureLoader.load('/saturn.jpeg'), roughness: 0.9, metalness: 0.01 })
);
saturn.position.set(-36, 16, -95);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(10.5, 15.5, 72),
  new THREE.MeshStandardMaterial({ color: 0xcfb893, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
);
ring.rotation.x = Math.PI / 2.5;
saturn.add(ring);

scene.add(earth, moon, saturn);

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
  rocket.position.set(-10, -8, -12);
  rocket.rotation.z = -0.35;
  return rocket;
}

const rocket = createRocket();
scene.add(rocket);

const shaderScene = new THREE.Scene();
const shaderCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const shaderUniforms = { uTime: { value: 0 }, uScroll: { value: 0 } };

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
    uniform float uScroll;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    void main() {
      vec2 uv = vUv;
      float drift = uTime * 0.03 + uScroll * 0.18;
      float clouds = noise(uv * 4.2 + vec2(drift, drift * 0.5));
      float clouds2 = noise(uv * 8.0 - vec2(drift * 0.8, drift * 0.2));
      float nebula = smoothstep(0.45, 0.98, clouds * 0.7 + clouds2 * 0.45);

      vec3 deepSpace = vec3(0.01, 0.015, 0.035);
      vec3 violet = vec3(0.09, 0.06, 0.17);
      vec3 cyan = vec3(0.03, 0.08, 0.12);
      vec3 bg = mix(deepSpace, violet, nebula * 0.45);
      bg = mix(bg, cyan, nebula * 0.25 * smoothstep(0.15, 0.95, uv.x));

      float starSeed = hash(floor(uv * vec2(420.0, 260.0)) + uTime * 0.02);
      float star = step(0.997, starSeed) * (0.65 + 0.35 * sin(uTime * 2.2 + starSeed * 100.0));
      bg += star;

      gl_FragColor = vec4(bg, 1.0);
    }
  `
});
shaderScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));

const scrollState = { current: 0, target: 0 };
const maxScroll = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
const updateScrollTarget = () => {
  scrollState.target = THREE.MathUtils.clamp(window.scrollY / maxScroll(), 0, 1);
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

  scrollState.current += (scrollState.target - scrollState.current) * 0.06;
  shaderUniforms.uTime.value = elapsed;
  shaderUniforms.uScroll.value = scrollState.current;

  earth.rotation.y += 0.0018;
  moon.rotation.y += 0.004;
  saturn.rotation.y += 0.0012;
  ring.rotation.z += 0.0007;
  starField.rotation.y += 0.00011;

  const progress = scrollState.current;
  rocket.position.y = -8 + Math.sin(elapsed * 1.4) * 0.7 + progress * 12;
  rocket.position.x = -12 + progress * 20;
  rocket.rotation.z = -0.32 + Math.sin(elapsed * 0.8) * 0.05;

  camera.position.z = 42 + progress * 80;
  camera.position.x = progress * 16;
  camera.position.y = -progress * 9;

  renderer.clear();
  renderer.render(shaderScene, shaderCamera);
  renderer.clearDepth();
  renderer.render(scene, camera);
}

animate();
