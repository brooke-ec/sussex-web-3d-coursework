import { bindtoggle, setup } from "../script.js";
import * as THREE from "three";

const container = document.getElementById("scene");
if (!container) throw new Error("Scene container not found");

const { scene, listener, play } = setup(container, {
	model: { file: "/assets/citadel/scene.gltf", rotation: new THREE.Euler(0, -Math.PI / 2, 0) },
	camera: { x: 1, y: 1, z: 13.5, target: { x: 0, y: 9, z: 0 }, speed: 0.25 },
	ambience: { file: "/assets/citadel/ambience.wav", height: 10 },
	sun: { x: -32, y: 30, z: 0, resolution: 25 },
	skybox: [
		"/assets/citadel/px.png", // right
		"/assets/citadel/nx.png", // left
		"/assets/citadel/py.png", // top
		"/assets/citadel/ny.png", // bottom
		"/assets/citadel/pz.png", // front
		"/assets/citadel/nz.png", // back
	],
});

/// RANDOM SOUNDS

const sounds = [
	// Overwatch Announcements
	{ file: "/assets/citadel/offworldrelocation_spkr.wav", min: 30, max: 60 },
	{ file: "/assets/citadel/confirmcivilstatus_spkr.wav", min: 30, max: 60 },
	{ file: "/assets/citadel/sociolevel_spkr.wav", min: 30, max: 60 },

	// Alarm Sounds
	{ file: "/assets/citadel/scanner_alert_pass.wav", min: 60, max: 120 },
	{ file: "/assets/citadel/manhack_alert_pass.wav", min: 60, max: 120 },
	{ file: "/assets/citadel/apc_alarm_pass.wav", min: 60, max: 120 },

	// Vehicle Sounds
	{ file: "/assets/citadel/train_horn_distant.wav", min: 60, max: 150 },
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
			if (!audio.isPlaying) {
				audio.position.set(Math.random() * 30 - 15, 0, Math.random() * 30 - 15);
				audio.play();
			}
		}

		setTimeout(play, sound.min / 4 + Math.random() * sound.max * 1000);
	});
}

// ALERT BUTTON

const alarm = new THREE.Audio(listener);
loader.load("/assets/citadel/citadel_alert.wav", (buffer) => {
	alarm.setBuffer(buffer);
});

bindtoggle("alert-btn", true, "⚠️ Set Low Alert", "⚠️ Set High Alert", (value) => {
	if (value) alarm.play();
	play(value);
});
