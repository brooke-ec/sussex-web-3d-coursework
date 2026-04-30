import { setup } from "../script.js";
import * as THREE from "three";

const container = document.getElementById("scene");
if (!container) throw new Error("Scene container not found");

const { scene, listener } = setup(container, {
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

const sounds = [
	// Overwatch Announcements
	{ file: "/assets/citadel/offworldrelocation_spkr.wav", min: 30, max: 40 },
	{ file: "/assets/citadel/confirmcivilstatus_spkr.wav", min: 30, max: 40 },
	{ file: "/assets/citadel/sociolevel_spkr.wav", min: 30, max: 40 },

	// Alarm Sounds
	{ file: "/assets/citadel/scanner_alert_pass.wav", min: 30, max: 40 },
	{ file: "/assets/citadel/manhack_alert_pass.wav", min: 30, max: 40 },
	{ file: "/assets/citadel/apc_alarm_pass.wav", min: 30, max: 40 },

	// Vehicle Sounds
	{ file: "/assets/citadel/train_horn_distant.wav", min: 30, max: 60 },
	{ file: "/assets/citadel/apc_distant1.wav", min: 5, max: 30 },
	{ file: "/assets/citadel/apc_distant2.wav", min: 5, max: 30 },
	{ file: "/assets/citadel/apc_distant3.wav", min: 5, max: 30 },
];

const loader = new THREE.AudioLoader();

for (const sound of sounds) {
	const audio = new THREE.PositionalAudio(listener);
	loader.load(sound.file, (buffer) => {
		audio.setRolloffFactor(1.5);
		audio.setRefDistance(3);
		audio.setBuffer(buffer);
		scene.add(audio);

		function play() {
			setTimeout(play, (Math.random() * (sound.max - sound.min) + sound.min) * 1000);
			audio.position.set(Math.random() * 30 - 15, 0, Math.random() * 30 - 15);
			audio.play();
		}

		setTimeout(play, sound.min / 2 + Math.random() * (sound.max + 40) * 1000);
	});
}
