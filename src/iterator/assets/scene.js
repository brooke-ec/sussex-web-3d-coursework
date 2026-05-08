import { setup, bindtoggle } from "../../assets/main.js";
import ParticleSystem, * as nebula from "three-nebula";
import { createClouds } from "./clouds.js";
import * as THREE from "three";

const container = document.getElementById("scene");
if (!container) throw new Error("Scene container not found");

const { scene, timer, listener } = setup(container, {
	model: { file: "./assets/scene.glb", offset: { x: 0, y: -10, z: 0 } },
	camera: { x: -10, y: 5, z: 40, target: { x: 0, y: 9, z: 0 }, speed: 0.25 },
	ambience: { file: "./assets/ambience.wav", height: 50 },
	sun: { x: -32, y: 30, z: 10, size: 25 },
	skybox: "./assets/skybox.png",
	animate() {
		animateClouds(timer.getDelta());
		particles.update(timer.getDelta());
	},
});

const createSprite = () => {
	let map = new THREE.TextureLoader().load(`./assets/smoke1.png`);
	let material = new THREE.SpriteMaterial({
		map: map,
		color: 0xff0000,
		blending: THREE.AdditiveBlending,
		fog: true,
	});

	return new THREE.Sprite(material);
};

scene.fog = new THREE.FogExp2(0xefd1b5, 0.005);
const { animate: animateClouds } = createClouds(scene);

const loader = new THREE.AudioLoader();

(async () => {
	const thunderLight = new THREE.PointLight(0x00ff00, 0, 100);
	scene.add(thunderLight);

	const sounds = await Promise.all([
		loader.loadAsync("./assets/thunder1.mp3"),
		loader.loadAsync("./assets/thunder2.mp3"),
		loader.loadAsync("./assets/thunder3.mp3"),
		loader.loadAsync("./assets/thunder4.mp3"),
	]);

	const thunderSound = new THREE.PositionalAudio(listener);
	thunderSound.setRefDistance(8);
	thunderLight.add(thunderSound);
	thunderSound.setVolume(3);

	const play = () =>
		setTimeout(
			() => {
				thunderLight.position.set(Math.random() * 10 - 10, 0, Math.random() * 8 - 3);
				thunderLight.intensity = 300;

				thunderSound.stop();
				thunderSound.setBuffer(sounds[Math.floor(Math.random() * sounds.length)]);
				thunderSound.play();

				play();

				setTimeout(() => {
					thunderLight.intensity = 0;
				}, 80);

				setTimeout(() => {
					thunderLight.intensity = 500;
				}, 100);

				setTimeout(() => {
					thunderLight.intensity = 0;
				}, 200);
			},
			Math.random() * 7000 + 5000,
		);
	play();
})();

const particles = new ParticleSystem();

const emitters = [
	{ x: 3.75, y: 8, z: 12.25, vx: 0, vz: 1 },
	{ x: -8.25, y: 9.25, z: 12.25, vx: 0, vz: 1 },
	{ x: 7.5, y: 4.75, z: -9, vx: 0, vz: -1 },
	{ x: -16.5, y: 9.75, z: 8, vx: -1, vz: 0 },
	{ x: -16.5, y: 12.25, z: -5.5, vx: -1, vz: 0 },
].map((shape) =>
	new nebula.Emitter()
		.setRate(new nebula.Rate(0))
		.addInitializers([
			// @ts-ignore
			new nebula.RadialVelocity(new nebula.Span(1, 5), new nebula.Vector3D(shape.vx, 1, shape.vz), 10),
			new nebula.Position(new nebula.BoxZone(3 * shape.vz, 0.5, 3 * shape.vx)),
			new nebula.Body(createSprite()),
			new nebula.Life(3, 10),
		])
		.addBehaviours([
			new nebula.Alpha(1, 0),
			new nebula.Scale(0.3, 0.4),
			new nebula.Color(new THREE.Color(0xffffff), new THREE.Color(0xffffff)),
		])
		.setPosition(shape)
		.emit(),
);

for (const emitter of emitters) {
	particles.addEmitter(emitter);
}

particles.addRenderer(new nebula.SpriteRenderer(scene, THREE));

bindtoggle("vent-btn", false, "☁️ Stop Venting", "☁️ Vent Coolant", (value) => {
	for (const emitter of emitters) {
		if (value) emitter.setRate(new nebula.Rate(1, 0.1));
		else emitter.setRate(new nebula.Rate(0));
	}
});
