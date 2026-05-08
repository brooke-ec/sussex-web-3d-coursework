import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { bindtoggle, setup } from "../../assets/main.js";
import * as THREE from "three";

const container = document.getElementById("scene");
if (!container) throw new Error("Scene container not found");

const { scene, listener, play } = setup(container, {
	model: { file: "./assets/tower.glb" },
	camera: { x: 1, y: 5, z: 23, target: { x: 0, y: 13, z: 0 }, speed: 0.25 },
	ambience: { file: "./assets/ambience.mp3", height: 10 },
	sun: { x: -32, y: 30, z: 0, size: 25, shadows: false },
	skybox: "./assets/skybox.png",
});

/** @type {THREE.AnimationClip[]} */
let clips = [];

new GLTFLoader().load("./assets/environment.glb", (gltf) => {
	clips = gltf.animations;
	gltf.scene.traverse(function (child) {
		if (child instanceof THREE.Mesh) {
			child.receiveShadow = true;
			child.castShadow = true;
		}
	});

	scene.add(gltf.scene);
});

const rumble = new THREE.PositionalAudio(listener);
rumble.setRefDistance(20);
rumble.setVolume(1);
scene.add(rumble);

new THREE.AudioLoader().load("./assets/rumble.mp3", (buffer) => {
	rumble.setBuffer(buffer);
});

bindtoggle("destroy-btn", false, "💥 Reverse Damage", "💥 Destroy Tower", (value) => {
	if (value) rumble.play();
	play(value);
});
