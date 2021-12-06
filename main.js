import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({canvas: document.querySelector('#background')});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const canvas = document.querySelector('#background');

const controller = new OrbitControls(camera, canvas);

// Light for scene

const ambientlight = new THREE.AmbientLight(0xffffff);
ambientlight.position.set(0, 0, 30);
scene.add(ambientlight);

//background picture

const spaceTexture = new THREE.TextureLoader().load('space.jpg');
scene.background = spaceTexture;

//Star objects

function addstar() {
  const geometry = new THREE.SphereGeometry(1, 24, 24);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff});
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(1000));
  star.position.set(x, y, z);
  scene.add(star);
}
Array(2000).fill().forEach(addstar);

//Profile Picture cube

const pictureTexture = new THREE.TextureLoader().load('jl4.jpeg');
const profilephoto = new THREE.Mesh(
  new THREE.BoxGeometry(6,6,6),
  new THREE.MeshBasicMaterial({ map: pictureTexture})
)

profilephoto.position.set(20, 8, 50);
profilephoto.rotateX(10);
scene.add(profilephoto);

//Planet objects

const earthTexture = new THREE.TextureLoader().load('earth.jpg');
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(6, 32, 32),
  new THREE.MeshStandardMaterial({ map: earthTexture})
)

const moonTexture = new THREE.TextureLoader().load('moon.jpg');
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshStandardMaterial({ map: moonTexture})
)

const saturnTexture = new THREE.TextureLoader().load('saturn.jpeg');
const saturn = new THREE.Mesh(
  new THREE.SphereGeometry(6, 32, 32),
  new THREE.MeshStandardMaterial({ map: saturnTexture})
)

earth.position.set(31, 20, 100);
moon.position.set(35, 24, 110);
saturn.position.set(55, 38, 180);
saturn.rotateX(-10);
scene.add(earth, moon, saturn);

// Saturns ring objects

const geometry = new THREE.TorusGeometry(9, 1, 2, 100);
const material = new THREE.MeshStandardMaterial({ color: 0x8a8a67 , wireframe: true});
const saturnsringInner = new THREE.Mesh(geometry, material);
saturnsringInner.position.set(55, 38, 180);
saturnsringInner.rotateX(10.5);
const geometry2 = new THREE.TorusGeometry(11, 1, 2, 100);
const material2 = new THREE.MeshStandardMaterial({ color: 0xffac32 , wireframe: true});
const saturnsringOuter = new THREE.Mesh(geometry2, material2);
saturnsringOuter.position.set(55, 38, 180)
saturnsringOuter.rotateX(10.5);
scene.add(saturnsringInner, saturnsringOuter);


//move animation on scroll

function MoveCamera() {

  const t = document.body.getBoundingClientRect().top;
  moon.rotation.z -= 0.01;
  earth.rotation.z += 0.01;

  profilephoto.rotation.y += 0.02;
  profilephoto.rotation.x += 0.02;

  

  camera.position.y = t * -0.01;
  camera.position.x = t * -0.01;
  camera.position.z = t * -0.05;

  
  renderer.render(scene, camera);
}
document.body.onscroll = MoveCamera;

// animation function 

function animate(){
  requestAnimationFrame(animate);

  saturnsringInner.rotation.x += 0.01;
  saturnsringOuter.rotation.x += 0.01;
  saturn.rotation.x += 0.01;
  earth.rotation.y += 0.01;
  moon.rotation.y += 0.01;

  controller.update();

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

animate(); 