import { setup } from "../script.js";
import * as THREE from "three";

const container = document.getElementById("scene");
if (!container) throw new Error("Scene container not found");

const scene = setup(container, {
	camera: { x: 1, y: 1, z: -15, target: { x: 0, y: 9, z: 0 }, speed: 0.5 },
	ambience: { file: "/assets/citadel/ambience.wav", height: 10 },
	sun: { x: -7.5, y: 6, z: 0, resolution: 10 },
	skybox: [
		"/assets/citadel/px.png", // right
		"/assets/citadel/nx.png", // left
		"/assets/citadel/py.png", // top
		"/assets/citadel/ny.png", // bottom
		"/assets/citadel/pz.png", // front
		"/assets/citadel/nz.png", // back
	],
});
