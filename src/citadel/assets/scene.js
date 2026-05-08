import { bindtoggle, setup } from "../../assets/main.js";
import * as THREE from "three";

const container = document.getElementById("scene");
if (!container) throw new Error("Scene container not found");

const { scene, listener, play } = setup(container, {
	model: { file: "./assets/scene.glb", rotation: new THREE.Euler(0, -Math.PI / 2, 0) },
	camera: { x: 1, y: 1, z: 13.5, target: { x: 0, y: 9, z: 0 }, speed: 0.25 },
	ambience: { file: "./assets/ambience.ogg", height: 10 },
	sun: { x: -32, y: 30, z: 0, size: 25 },
	skybox: "./assets/skybox.webp",
});

/// RANDOM SOUNDS

const sounds = [
	// Overwatch Announcements
	{ file: "./assets/offworldrelocation_spkr.ogg", min: 30, max: 60 },
	{ file: "./assets/confirmcivilstatus_spkr.ogg", min: 30, max: 60 },
	{ file: "./assets/sociolevel_spkr.ogg", min: 30, max: 60 },

	// Alarm Sounds
	{ file: "./assets/scanner_alert_pass.ogg", min: 60, max: 120 },
	{ file: "./assets/manhack_alert_pass.ogg", min: 60, max: 120 },
	{ file: "./assets/apc_alarm_pass.ogg", min: 60, max: 120 },

	// Vehicle Sounds
	{ file: "./assets/train_horn_distant.ogg", min: 60, max: 150 },
	{ file: "./assets/apc_distant1.ogg", min: 10, max: 30 },
	{ file: "./assets/apc_distant2.ogg", min: 10, max: 30 },
	{ file: "./assets/apc_distant3.ogg", min: 10, max: 30 },
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
loader.load("./assets/citadel_alert.ogg", (buffer) => {
	alarm.setBuffer(buffer);
});

bindtoggle("alert-btn", false, "⚠️ Set Low Alert", "⚠️ Set High Alert", (value) => {
	if (value) alarm.play();
	play(value);
});
