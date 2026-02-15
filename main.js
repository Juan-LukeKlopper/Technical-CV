import './style.css';
import * as THREE from 'three';

const canvas = document.querySelector('#background');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x02040b, 30, 210);
const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2200);
camera.position.set(0, 0, 18);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
const keyLight = new THREE.PointLight(0xffffff, 0.5, 500);
keyLight.position.set(-10, 15, 30);
scene.add(ambientLight, keyLight);

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

const profilePhoto = new THREE.Mesh(
  new THREE.BoxGeometry(6, 6, 6),
  new THREE.MeshBasicMaterial({ map: textureLoader.load('/jl4.jpeg') })
);
profilePhoto.position.set(0, 1.5, -35);
scene.add(profilePhoto);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(6, 32, 32),
  new THREE.MeshStandardMaterial({ map: textureLoader.load('/earth.jpg') })
);
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshStandardMaterial({ map: textureLoader.load('/moon.jpg') })
);
const saturn = new THREE.Mesh(
  new THREE.SphereGeometry(6, 32, 32),
  new THREE.MeshStandardMaterial({ map: textureLoader.load('/saturn.jpeg') })
);

const earthSystem = new THREE.Group();
earthSystem.position.set(0, -1, -105);
earthSystem.add(earth);

const moonPivot = new THREE.Group();
moon.position.set(4, 0, -10);
moonPivot.add(moon);
earthSystem.add(moonPivot);
scene.add(earthSystem);

const saturnSystem = new THREE.Group();
saturnSystem.position.set(0, 3, -175);
saturn.rotation.x = -10;
saturnSystem.add(saturn);

const saturnsringInner = new THREE.Mesh(
  new THREE.TorusGeometry(9, 1, 2, 100),
  new THREE.MeshStandardMaterial({ color: 0x8a8a67, wireframe: true })
);
saturnsringInner.rotation.x = 10.5;

const saturnsringOuter = new THREE.Mesh(
  new THREE.TorusGeometry(11, 1, 2, 100),
  new THREE.MeshStandardMaterial({ color: 0xffac32, wireframe: true })
);
saturnsringOuter.rotation.x = 10.5;

saturnSystem.add(saturnsringInner, saturnsringOuter);
scene.add(saturnSystem);

function createRocket() {
  const rocket = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.18, 1.2, 6),
    new THREE.MeshStandardMaterial({ color: 0xdce6ff, flatShading: true })
  );
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.42, 6),
    new THREE.MeshStandardMaterial({ color: 0xff6588, flatShading: true })
  );
  const finGeo = new THREE.BoxGeometry(0.05, 0.25, 0.2);
  const finMat = new THREE.MeshStandardMaterial({ color: 0x4c69ff, flatShading: true });
  const finA = new THREE.Mesh(finGeo, finMat);
  const finB = finA.clone();

  finA.position.set(0.13, -0.45, 0);
  finB.position.set(-0.13, -0.45, 0);
  nose.position.y = 0.8;

  rocket.add(body, nose, finA, finB);
  return rocket;
}

const rocket = createRocket();
scene.add(rocket);

const smokeCount = 60;
const smokeGeometry = new THREE.BufferGeometry();
const smokePositions = new Float32Array(smokeCount * 3);
const smokeSeeds = new Float32Array(smokeCount);
for (let i = 0; i < smokeCount; i += 1) {
  smokeSeeds[i] = Math.random() * Math.PI * 2;
}
smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
const smoke = new THREE.Points(
  smokeGeometry,
  new THREE.PointsMaterial({ color: 0xbfc5d1, size: 0.25, transparent: true, opacity: 0.5 })
);
scene.add(smoke);

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
const mobileEggTrigger = document.querySelector('#mobile-egg-trigger');
const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;
window.addEventListener('keydown', (event) => {
  const keyValue = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  konamiIndex = keyValue === konami[konamiIndex] ? konamiIndex + 1 : 0;
  if (keyValue === '?') {
    eggLiveRegion.textContent = 'Hint: try an old-school game cheat code and click near the upper-left star cluster four times.';
  }
  if (konamiIndex === konami.length) {
    eggLiveRegion.textContent = 'Easter egg found: The universe says "Wubba Lubba Dub Dub" and trust nobody with a six-fingered journal.';
    konamiIndex = 0;
  }
});

let mobileTapCount = 0;
let mobileTapTimer;
mobileEggTrigger?.addEventListener('pointerup', () => {
  mobileTapCount += 1;
  clearTimeout(mobileTapTimer);
  mobileTapTimer = setTimeout(() => {
    mobileTapCount = 0;
  }, 4500);

  if (mobileTapCount === 5) {
    eggLiveRegion.textContent = 'Mobile hint unlocked: now tap the upper-left corner of space four times.';
    mobileTapCount = 0;
  }
});

let hiddenClicks = 0;
const registerCornerTap = (x, y) => {
  if (x < 85 && y < 85) hiddenClicks += 1;
  if (hiddenClicks === 4) {
    eggLiveRegion.textContent = 'Second easter egg found: "Adventure is out there"... also check every triangle for cryptic clues.';
  }
};

canvas.addEventListener('click', (event) => {
  registerCornerTap(event.clientX, event.clientY);
});
canvas.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  if (touch) registerCornerTap(touch.clientX, touch.clientY);
}, { passive: true });

const focusStages = [
  { at: 0, cam: new THREE.Vector3(0, 1.5, 16), look: new THREE.Vector3(0, 1.5, -35) },
  { at: 0.34, cam: new THREE.Vector3(0, 1.5, -70), look: new THREE.Vector3(0, -1, -105) },
  { at: 0.72, cam: new THREE.Vector3(0, 3, -142), look: new THREE.Vector3(0, 3, -175) },
  { at: 1, cam: new THREE.Vector3(0, 2, -230), look: new THREE.Vector3(0, 2, -265) }
];
const currentLook = new THREE.Vector3(0, 0, -35);

function sampleStages(progress) {
  let start = focusStages[0];
  let end = focusStages[focusStages.length - 1];

  for (let i = 0; i < focusStages.length - 1; i += 1) {
    const a = focusStages[i];
    const b = focusStages[i + 1];
    if (progress >= a.at && progress <= b.at) {
      start = a;
      end = b;
      break;
    }
  }

  const t = THREE.MathUtils.clamp((progress - start.at) / Math.max(end.at - start.at, 0.0001), 0, 1);
  const eased = t * t * (3 - 2 * t);

  return {
    cam: start.cam.clone().lerp(end.cam, eased),
    look: start.look.clone().lerp(end.look, eased)
  };
}

renderer.autoClear = false;
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  scrollState.current += (scrollState.target - scrollState.current) * 0.05;
  const progress = scrollState.current;

  shaderUniforms.uTime.value = elapsed;

  earth.rotation.y += 0.003;
  moonPivot.rotation.y += 0.012;
  moon.rotation.y += 0.01;
  saturnSystem.rotation.y += 0.0025;
  saturn.rotation.y += 0.0025;
  saturnsringInner.rotation.z += 0.003;
  saturnsringOuter.rotation.z += 0.003;
  profilePhoto.rotation.y += 0.006;
  profilePhoto.rotation.x += 0.004;
  starField.rotation.y += 0.00008;

  const sampled = sampleStages(progress);
  camera.position.lerp(sampled.cam, 0.08);
  currentLook.lerp(sampled.look, 0.08);
  camera.lookAt(currentLook);

  const launchStart = 0.29;
  const launchEnd = 0.56;
  const launchPhase = THREE.MathUtils.clamp((progress - launchStart) / (launchEnd - launchStart), 0, 1);
  rocket.visible = progress >= launchStart - 0.03 && progress <= 0.72;
  smoke.visible = rocket.visible;

  const earthWorld = earthSystem.position;
  rocket.position.x = earthWorld.x + 1.8 + launchPhase * 1.8;
  rocket.position.y = earthWorld.y - 4.5 + launchPhase * 21 + Math.sin(elapsed * 3.3) * 0.1;
  rocket.position.z = earthWorld.z - 1.2 - launchPhase * 6;
  rocket.rotation.z = -0.22;
  rocket.rotation.x = 0.15;

  const smokeAttr = smoke.geometry.attributes.position;
  for (let i = 0; i < smokeCount; i += 1) {
    const idx = i * 3;
    const lift = (i / smokeCount) * (0.9 + launchPhase * 6.8);
    const swirl = 0.22 + i * 0.006;
    smokePositions[idx] = rocket.position.x + Math.cos(smokeSeeds[i] + elapsed * 1.2) * swirl;
    smokePositions[idx + 1] = rocket.position.y - 0.9 - lift;
    smokePositions[idx + 2] = rocket.position.z + Math.sin(smokeSeeds[i] + elapsed * 1.1) * swirl;
  }
  smoke.material.opacity = launchPhase > 0 ? 0.5 : 0;
  smokeAttr.needsUpdate = true;

  renderer.clear();
  renderer.render(shaderScene, shaderCamera);
  renderer.clearDepth();
  renderer.render(scene, camera);
}

animate();
