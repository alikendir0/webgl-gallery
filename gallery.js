//
// Title: CMPE360 Project 8
// Author: Ali Kendir
// ID: 48028060750
// Section: 1
// Project: 8
// Description: Three.js Art Gallery
//

import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js"; // Used to load OBJ models
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js"; // Used to control the camera

let scene, camera, renderer; // Scene, camera and renderer objects
let sculptures = []; // Sculptures array
let paintings = []; // Paintings array
let lights = []; // Lights array
let cameraLight; // Camera light object
let lastAngle = 0; // Last angle for compass

// Initializes the scene
function init() {
  scene = new THREE.Scene(); // Create a new scene object
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  ); // Create a new camera object

  renderer = new THREE.WebGLRenderer({ antialias: true }); // Create a new renderer object
  renderer.setSize(window.innerWidth, window.innerHeight); // Set the size of the renderer according to window size
  renderer.shadowMap.enabled = true; // Enable shadow mapping
  document.body.appendChild(renderer.domElement); // Append the renderer to the body

  camera.position.set(0, 2, 5); // Set the camera position

  const controls = new PointerLockControls(camera, renderer.domElement); // Create a new PointerLockControls object
  scene.add(controls.getObject()); // Add the controls object to the scene

  document.addEventListener("click", () => {
    controls.lock();
  }); //When the document is clicked, lock the controls

  // Skybox properties
  const skyboxLoader = new THREE.CubeTextureLoader(); // Create a new CubeTextureLoader object
  const skybox = skyboxLoader.load([
    "skybox/xpos.png",
    "skybox/xneg.png",
    "skybox/ypos.png",
    "skybox/yneg.png",
    "skybox/zpos.png",
    "skybox/zneg.png",
  ]);
  scene.background = skybox; // Set the scene background to the skybox

  // Floor texture
  const floorTexture = new THREE.TextureLoader().load(
    "textures/floor_textures/marble_texture.jpg"
  ); // Load the floor texture
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; // Set the texture wrapping
  floorTexture.repeat.set(8, 8); // Repeat the texture 8 times since the floor is 20x20
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ map: floorTexture })
  ); // Create a new floor object
  floor.rotation.x = -Math.PI / 2; // Rotate the floor
  floor.receiveShadow = true; // Enable shadow casting
  scene.add(floor); // Add the floor to the scene

  // Walls
  createWalls();

  // Lighting
  createLights();

  // Art pieces
  loadArtworks();

  // Add custom shader object
  addShaderObject();

  addCameraLight(); // Add camera light
}

// Handle mouse movement for camera rotation
let isPointerLocked = false;
document.addEventListener("pointerlockchange", () => {
  isPointerLocked = document.pointerLockElement === renderer.domElement;
}); // When the pointer lock changes, set the isPointerLocked variable

document.addEventListener("mousemove", (event) => {
  if (!isPointerLocked) return;

  const movementX =
    event.movementX || event.mozMovementX || event.webkitMovementX || 0; // Get the movement in X direction
  const movementY =
    event.movementY || event.mozMovementY || event.webkitMovementY || 0; // Get the movement in Y direction

  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  euler.setFromQuaternion(camera.quaternion);

  euler.y -= movementX * 0.002;
  euler.x -= movementY * 0.002;
  euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

  camera.quaternion.setFromEuler(euler); // Set the camera position according to the euler angles
});

function addCameraLight() {
  cameraLight = new THREE.PointLight(0xffffff, 1, 10); // Create a new point light object with white color and intensity 1 and distance 10
  camera.add(cameraLight); // Attach the light to the camera
  cameraLight.position.set(0, 0, 0); // Position the light at the camera's position
}

// Create gallery walls
function createWalls() {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Create a new wall material

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(20, 8, 0.3),
    wallMaterial
  ); // Create a new back wall object
  backWall.position.z = -10;
  backWall.position.y = 4;
  scene.add(backWall); // Add the back wall to the scene

  // Front wall
  const frontWall = backWall.clone(); // Clone the back wall
  frontWall.position.z = 10; // Set the position of the front wall
  scene.add(frontWall); // Add the front wall to the scene

  // Side walls
  const leftWall = backWall.clone(); // Clone the back wall
  leftWall.rotation.y = Math.PI / 2; // Rotate the left wall
  leftWall.position.x = -10;
  leftWall.position.z = 0;
  scene.add(leftWall); // Add the left wall to the scene

  const rightWall = leftWall.clone(); // Clone the left wall
  rightWall.position.x = 10; // Set the position of the right wall
  scene.add(rightWall); // Add the right wall to the scene
}
const mainLight = new THREE.SpotLight(0xffffff, 2); // Create a new spotlight with white color and intensity 2

// Used for createing lighting in the gallery
function createLights() {
  // Ambient light
  const ambient = new THREE.AmbientLight(0x404040, 2); // Create a new ambient light with color 0x404040 and intensity 2
  scene.add(ambient); // Add the ambient light to the scene

  // Main spotlight
  mainLight.position.set(0, 6, 0);
  mainLight.distance = 20; // Distance of the light
  mainLight.castShadow = true; // Enable shadow casting
  scene.add(mainLight); // Add the main light to the scene

  // Create a ball at the main spotlight position
  const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32); // Create a new sphere
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1,
  }); // Create a new material for the sphere with white color and emissive white color and intensity 1
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.copy(mainLight.position); // Set the position of the ball to the main light position
  ball.castShadow = true; // Enable shadow casting
  scene.add(ball); // Add the ball to the scene

  // Create pedestal lights
  for (let i = -6; i <= 2; i += 4) {
    const pedestalLight = new THREE.SpotLight(0xffffff, 1.5); // Create a new spotlight with white color and intensity 1.5
    pedestalLight.position.set(6, 8, i); // Set the position of the pedestal light
    pedestalLight.target.position.set(6, 0, i); // Set the target position of the pedestal light
    pedestalLight.distance = 15; // Increase distance
    pedestalLight.castShadow = true; // Enable shadow casting
    scene.add(pedestalLight); // Add the pedestal light to the scene
    scene.add(pedestalLight.target); // Add the target of the pedestal light to the scene
    lights.push(pedestalLight); // Add the pedestal light to the lights array

    const pedestalLight2 = pedestalLight.clone(); // Clone the pedestal light
    pedestalLight2.position.set(-6, 8, i); // Set the position of the cloned pedestal light
    pedestalLight.target.position.set(-6, 0, i); // Set the target position of the cloned pedestal light
    scene.add(pedestalLight2); // Add the cloned pedestal light to the scene
    scene.add(pedestalLight2.target); // Add the target of the cloned pedestal light to the scene
    lights.push(pedestalLight2); // Add the cloned pedestal light to the lights array
  }
}

// Load OBJ models and create other artworks
function loadArtworks() {
  const objLoader = new OBJLoader();

  // Create pedestals along the walls (3 on each side)
  // Left wall pedestals
  createPedestal(-6, -6); // Back left
  createPedestal(-6, -2); // Mid-back left
  createPedestal(-6, 2); // Mid-front left

  // Right wall pedestals
  createPedestal(6, -6); // Back right
  createPedestal(6, -2); // Mid-back right
  createPedestal(6, 2); // Mid-front right

  // Object 1 - V1 (Left back pedestal)
  objLoader.load("objects/V1.obj", (V1) => {
    const textureLoader = new THREE.TextureLoader();
    const texture1 = textureLoader.load("textures/V1_textures/V1_Albedo.png");
    const texture2 = textureLoader.load("textures/V1_textures/V1_Emission.png"); // Load the textures

    V1.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: texture1,
          normalMap: texture2,
          emissive: 0xffff00,
          emissiveMap: texture2,
          emissiveIntensity: 2,
        });
      }
    }); // Traverse the object and set the materials

    V1.name = "V1"; // Set the name of the object
    V1.scale.set(0.01, 0.01, 0.01); // Scale down the object
    V1.position.set(-6, 2, -6); // Position on back left pedestal
    V1.castShadow = true; // Enable shadow casting
    scene.add(V1); // Add the object to the scene
    sculptures.push(V1); // Add the object to the sculptures array
  });

  // Object 2 - Vase (Right back pedestal)
  objLoader.load("objects/vase.obj", (vase) => {
    const textureLoader = new THREE.TextureLoader();
    const vaseTexture = textureLoader.load(
      "textures/vase_textures/vaseTexture.jpg"
    ); // Load the texture
    const vaseMaterial = new THREE.MeshStandardMaterial({ map: vaseTexture }); // Create a new material with the texture

    vase.traverse((child) => {
      if (child.isMesh) {
        child.material = vaseMaterial;
      }
    }); // Traverse the object and set the material
    vase.name = "vase"; // Set the name of the vase
    vase.scale.set(0.1, 0.1, 0.1); // Scale down the vase
    vase.position.set(6, 3, -6); // Position on back right pedestal
    vase.rotation.x = -Math.PI / 2; // Rotate the vase
    vase.castShadow = true; // Enable shadow casting
    scene.add(vase);
    sculptures.push(vase); // Add the vase to the sculptures array
  });

  // Object 3 - Clock (right front pedestal)
  objLoader.load("objects/clock-007.obj", (clock) => {
    const textureLoader = new THREE.TextureLoader();
    const clockTexture = textureLoader.load(
      "textures/clock_textures/clock-007-col-metalness-4k.png"
    ); // Load the texture
    const clockMaterial = new THREE.MeshStandardMaterial({
      map: clockTexture,
      metalness: 1,
    }); // Create a new material with the texture

    clock.traverse((child) => {
      if (child.isMesh) {
        child.material = clockMaterial;
      }
    }); // Traverse the object and set the material
    clock.name = "clock"; // Set the name of the clock
    clock.scale.set(4, 4, 4); // Scale down the clock
    clock.position.set(6, 2, 2); // Position on mid-front right pedestal
    clock.castShadow = true; // Enable shadow casting
    scene.add(clock); // Add the clock to the scene
    sculptures.push(clock); // Add the clock to the sculptures array
  });

  // Object 4 - Glowing Green Cube (left front)
  const geometry = new THREE.BoxGeometry(1, 1, 1); // Create a new box geometry
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 1,
  }); // Create a new material with green color and emissive green color and intensity 1
  const cube = new THREE.Mesh(geometry, material); // Create a new cube object with the geometry and material
  cube.position.set(-6, 3, 2); // Position on left front pedestal
  cube.castShadow = true; // Enable shadow casting
  scene.add(cube); // Add the cube to the scene
  sculptures.push(cube); // Add the cube to the sculptures array

  // Create paintings (Objects 5, 6, 7)
  const paintingGeometry = new THREE.PlaneGeometry(2, 3); // Create a new plane geometry
  const paintingTextures = [
    "paintings/painting1.png",
    "paintings/painting2.png",
    "paintings/painting3.png",
  ]; // Create an array of painting textures

  paintingTextures.forEach((texture, index) => {
    const paintingMaterial = new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load(texture),
    }); // Create a new material with the texture
    const painting = new THREE.Mesh(paintingGeometry, paintingMaterial);
    painting.position.set(-8 + index * 8, 4, -9.8); // Position the painting
    scene.add(painting);
    paintings.push(painting); // Add the painting to the paintings array
  });

  // Object 8 - Hanging Chandelier (on top)
  const chandelierGeometry = new THREE.Group();
  const baseGeometry = new THREE.CylinderGeometry(0.5, 0.3, 0.2, 8); // Create a new cylinder geometry
  const baseMesh = new THREE.Mesh(
    baseGeometry,
    new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      emissive: 0xb8860b,
      emissiveIntensity: 0.5,
    })
  ); // Create a new material with the color and emissive color and intensity 0.5
  chandelierGeometry.add(baseMesh); // Add the base mesh to the chandelier geometry

  // Add hanging crystals with lights
  for (let i = 0; i < 8; i++) {
    // Create 8 crystals
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.3, 4),
      new THREE.MeshStandardMaterial({
        color: 0xffffffff,
        metalness: 1,
        roughness: 0.2,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
      }) // Create a new material with the color, metalness, roughness, emissive color and intensity 0.3
    ); // Create a new cone geometry

    // Add point light for each crystal
    const crystalLight = new THREE.PointLight(0xffffff, 0.5, 5); // Create a new point light with white color, intensity 0.5 and distance 5
    crystalLight.position.x = Math.cos((i * Math.PI) / 4) * 0.3; // Set the position of the crystal light
    crystalLight.position.z = Math.sin((i * Math.PI) / 4) * 0.3; // Set the position of the crystal light
    crystalLight.position.y = -0.3; // Set the position of the crystal light

    crystal.position.x = crystalLight.position.x;
    crystal.position.z = crystalLight.position.z;
    crystal.position.y = crystalLight.position.y; // Set the position of the crystal

    chandelierGeometry.add(crystal); // Add the crystal to the chandelier geometry
    chandelierGeometry.add(crystalLight); // Add the crystal light to the chandelier geometry
    lights.push(crystalLight); // Add the crystal light to the lights array
  }

  chandelierGeometry.position.set(0, 7.9, 0); // Position on the ceiling
  scene.add(chandelierGeometry); // Add the chandelier geometry to the scene

  // Object 9 Flying Donuts of Wisdom (Left middle pedestal)
  const installation = new THREE.Group(); // Create a new group object
  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00]; // Create an array of colors
  for (let i = 0; i < 4; i++) {
    const element = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.1, 16, 16),
      new THREE.MeshStandardMaterial({ color: colors[i] })
    ); // Create a new torus geometry
    element.rotation.x = Math.random() * Math.PI; // Rotate the element by a random angle
    element.rotation.y = Math.random() * Math.PI; // Rotate the element by a random angle
    element.position.x = Math.random() * 0.5 - 0.25; // Set the position of the element randomly
    element.position.y = i * 0.4; // Set the position of the element randomly
    installation.add(element); // Add the element to the installation
  }
  installation.position.set(-6, 2.5, -2); // Position on mid left pedestal
  scene.add(installation); // Add the installation to the scene

  // Object 10 Glass Display Case (Right middle pedestal)
  const glassCase = new THREE.Group(); // Create a new group object
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    metalness: 0.9,
    roughness: 0.05,
  }); // Create a new material with the color, transparency, opacity, metalness and roughness
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1), glassMaterial); // Create a new box geometry
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.1, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  ); // Create a new box geometry
  base.position.y = -0.8; // Set the position of the base
  glassCase.add(glass); // Add the glass to the glass case
  glassCase.add(base); // Add the base to the glass case
  glassCase.position.set(6, 2.8, -2); // Position on mid right pedestal
  scene.add(glassCase); // Add the glass case to the scene
}

// The pedestals are used to display the sculptures
function createPedestal(x, z) {
  // Create a pedestal at the given position of x and z
  const pedestalGeometry = new THREE.BoxGeometry(1, 2, 1); // Create a new box geometry
  const pedestalMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc }); // Create a new material with the color
  const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial); // Create a new mesh with the geometry and material
  pedestal.position.set(x, 1, z); // Set the position of the pedestal
  pedestal.castShadow = true; // Enable shadow casting
  pedestal.receiveShadow = true; // Enable shadow receiving
  scene.add(pedestal); // Add the pedestal to the scene
}

// The custom shader for the sphere in the middle of the room
function addShaderObject() {
  const envMap = new THREE.CubeTextureLoader().load([
    "skybox/xpos.png",
    "skybox/xneg.png",
    "skybox/ypos.png",
    "skybox/yneg.png",
    "skybox/zpos.png",
    "skybox/zneg.png",
  ]); // Load the skybox textures

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      envMap: { value: envMap },
    },
    vertexShader: `
    varying vec3 vReflect; /* Reflective vector */
    varying vec3 vWorldPosition; /* World position */
    void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0); 
        vWorldPosition = worldPosition.xyz;

        vec3 worldNormal = normalize(mat3(modelMatrix) * normal); 
        vec3 incident = normalize(worldPosition.xyz - cameraPosition); 
        vReflect = reflect(incident, worldNormal); 

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform samplerCube envMap; 
    varying vec3 vReflect;
    void main() {
        vec4 envColor = textureCube(envMap, vReflect);
        gl_FragColor = envColor;
    }
  `,
  });

  const shaderSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    shaderMaterial
  ); // Create a new sphere geometry
  shaderSphere.position.set(0, 3, -5); // Position the sphere
  scene.add(shaderSphere); // Add the sphere to the scene
}

const velocity = {
  x: 0,
  y: 0,
  z: 0,
}; // Velocity object for camera movement
const acceleration = 0.01; // Acceleration for camera movement
const friction = 0.95; // Friction for camera movement

function handleKeyboard() {
  document.addEventListener("keydown", (event) => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    switch (event.key) {
      case "w": // Move forward
        velocity.x += direction.x * acceleration;
        velocity.z += direction.z * acceleration;
        break;
      case "s": // Move backward
        velocity.x -= direction.x * acceleration;
        velocity.z -= direction.z * acceleration;
        break;
      case "a": // Move left
        velocity.x += direction.z * acceleration;
        velocity.z -= direction.x * acceleration;
        break;
      case "d": // Move right
        velocity.x -= direction.z * acceleration;
        velocity.z += direction.x * acceleration;
        break;
      case "q": // Move up
        velocity.y += acceleration;
        break;
      case "e": // Move down
        velocity.y -= acceleration;
        break;
    }
  });
}

//Compass function
function updateCompass() {
  const compassRose = document.querySelector(".compass-rose"); // Get the compass rose element
  if (!compassRose) return; // If the compass rose does not exist, return

  const direction = new THREE.Vector3(); //create the direction
  camera.getWorldDirection(direction); // Get the camera's world direction

  let angle = Math.atan2(-direction.x, -direction.z) * (180 / Math.PI); // Calculate the angle

  angle = ((angle % 360) + 360) % 360; // Normalize angle to [0..360)

  let diff = angle - lastAngle;
  if (diff > 180) angle -= 360;
  else if (diff < -180) angle += 360; // Smooth the transition if the difference is too large

  compassRose.style.transform = `rotate(${angle}deg)`; // Rotate the compass rose
  lastAngle = angle; // Update the last angle
}

function animate() {
  requestAnimationFrame(animate); // Request the next frame

  mainLight.intensity = Math.sin(Date.now() * 0.001) * 2; // Animate the main light intensity

  // Apply velocity with friction
  camera.position.x += velocity.x;
  camera.position.y += velocity.y;
  camera.position.z += velocity.z; // Update the camera position

  // Apply friction
  velocity.x *= friction;
  velocity.y *= friction;
  velocity.z *= friction; // Update the velocity

  updateCompass(); // Update the compass
  // Rotate sculptures
  sculptures.forEach((sculpture) => {
    if (sculpture.name === "vase") {
      sculpture.rotation.z += 0.005; // Rotate the vase around the z-axis
    } else {
      sculpture.rotation.y += 0.005; // Rotate the rest around the y-axis
    }
  });

  lights.forEach((light, index) => {
    light.position.y = 7 + Math.sin(Date.now() * 0.001 + index) * 0.5;
  }); // Animate the lights

  const installation = scene.children.find(
    (child) => child.isGroup && child.children.length === 4
  ); // Find the installation object
  if (installation) {
    installation.rotation.y += 0.005;
  } // Rotate the installation

  renderer.render(scene, camera);
}

// Handle window resizing
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);

// Initialize and start animation
init();
handleKeyboard();
animate();
