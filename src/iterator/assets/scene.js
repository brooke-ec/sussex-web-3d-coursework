import { setup } from "../../assets/main.js";
import { createClouds } from "./clouds.js";
import * as THREE from "three";

const container = document.getElementById("scene");
if (!container) throw new Error("Scene container not found");

const { scene, timer, listener } = setup(container, {
	model: { file: "./assets/scene.glb", offset: { x: 0, y: -10, z: 0 } },
	camera: { x: -10, y: 5, z: 40, target: { x: 0, y: 9, z: 0 }, speed: 0.25 },
	ambience: { file: "./assets/ambience.wav", height: 50 },
	sun: { x: -32, y: 30, z: 10, resolution: 25 },
	skybox: "./assets/skybox.png",
	animate() {
		animateClouds(timer.getDelta());
	},
});

const { animate: animateClouds } = createClouds(scene);
