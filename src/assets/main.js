import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { TAARenderPass } from "three/examples/jsm/postprocessing/TAARenderPass.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

/**
 * @typedef {Object} Vec3
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * @typedef {Object} SceneOptions
 * @property {Vec3 & {target: Vec3, speed: number}} camera - Camera configuration.
 * @property {{file: string, height: number}} ambience - Sound confuguration for the scene
 * @property {Vec3 & {size: number, shadows?: boolean}} sun - The position of the sun in the scene.
 * @property {{file: string, rotation?: THREE.Euler, offset?: Vec3}} model - The path to the GLTF model to load and its tranformation.
 * @property {string} skybox - The path to the skybox texture.
 * @property {() => void} [animate] - A function that is called every frame, just before rendering.
 */

/**
 * Initialises a three.js scene on the given container element.
 * @param {HTMLElement} container
 * @param {SceneOptions} options
 */
export function setup(container, options) {
	// SETUP RENDERER
	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(container.clientWidth, container.clientHeight);
	container.appendChild(renderer.domElement);

	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.shadowMap.enabled = options.sun.shadows ?? true;

	// SETUP SCENE
	const scene = new THREE.Scene();

	/** @type {() => void} */
	let renderSkybox = () => {};

	new THREE.TextureLoader().load(options.skybox, (texture) => {
		texture.mapping = THREE.EquirectangularReflectionMapping;

		// --- Render target (method 2) ---
		const target = new THREE.WebGLRenderTarget(1024, 512);
		target.texture.mapping = THREE.EquirectangularReflectionMapping;

		// --- Offscreen scene + shader quad ---
		const skyboxScene = new THREE.Scene();
		const skyboxCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		skyboxScene.add(skyboxCamera);

		const material = new THREE.ShaderMaterial({
			uniforms: {
				uTexture: { value: texture },
				uSunset: { value: null },
			},
			vertexShader: `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4(position, 1.0);
}
  `,
			fragmentShader: `
uniform sampler2D uTexture;
uniform float uSunset;
varying vec2 vUv;

void main() {
	vec4 base = texture2D(uTexture, vUv);

	vec3 sunsetLow  = vec3(1.0,  0.38, 0.04);
	vec3 sunsetMid  = vec3(0.95, 0.38, 0.28);
	vec3 sunsetHigh = vec3(0.12, 0.04, 0.28);
	vec3 sunset = mix(mix(sunsetLow, sunsetMid, vUv.y * 1.5), sunsetHigh, vUv.y);

	float blueness = base.b / max(base.r, base.g) - 0.4;
	vec3 result = mix(base.rgb, sunset, uSunset * blueness);
	gl_FragColor = vec4(result, 1.0);
}
  `,
			depthWrite: false,
		});

		skyboxScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
		const pmrem = new THREE.PMREMGenerator(renderer);

		renderSkybox = () => {
			const uSunset = 1 - Math.min(dayratio * 2, 1);
			if (uSunset != material.uniforms.uSunset.value) {
				material.uniforms.uSunset.value = uSunset;
				renderer.setRenderTarget(target);
				renderer.render(skyboxScene, skyboxCamera);
				renderer.setRenderTarget(null);

				target.texture.needsUpdate = true;
				const pmremTex = pmrem.fromEquirectangular(target.texture).texture;
				scene.background = pmremTex;
				scene.environment = pmremTex;
			}
		};
	});

	// SETUP SUN
	const sun = new THREE.DirectionalLight(0xfff1c4, 3);
	sun.position.set(options.sun.x, options.sun.y, options.sun.z);

	sun.shadow.camera.top = options.sun.size;
	sun.shadow.camera.bottom = -options.sun.size;
	sun.shadow.camera.left = options.sun.size;
	sun.shadow.camera.right = -options.sun.size;

	sun.shadow.mapSize.width = (128 * options.sun.size) / 5;
	sun.shadow.mapSize.height = (128 * options.sun.size) / 5;

	sun.shadow.bias = -0.001;
	sun.castShadow = options.sun.shadows ?? true;
	scene.add(sun);

	const shadowhelper = new THREE.CameraHelper(sun.shadow.camera);
	shadowhelper.visible = false;
	scene.add(shadowhelper);

	// SETUP CAMERA
	const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
	camera.position.x = options.camera.x;
	camera.position.y = options.camera.y;
	camera.position.z = options.camera.z;

	// SETUP CONTROLS
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(options.camera.target.x, options.camera.target.y, options.camera.target.z);
	controls.autoRotateSpeed = options.camera.speed;
	controls.enableDamping = true;
	controls.autoRotate = true;
	controls.zoomSpeed = 1.75;

	// LOAD SCENE FROM GLTF
	const mixer = new THREE.AnimationMixer(scene);

	/** @type {THREE.AnimationClip[]} */
	let clips = [];

	new GLTFLoader().load(options.model.file, (gltf) => {
		clips = gltf.animations;
		gltf.scene.traverse(function (child) {
			if (child instanceof THREE.Mesh) {
				child.receiveShadow = true;
				child.castShadow = true;
			}
		});

		scene.add(gltf.scene);
		if (options.model.rotation) gltf.scene.setRotationFromEuler(options.model.rotation);
		if (options.model.offset)
			gltf.scene.position.set(options.model.offset.x, options.model.offset.y, options.model.offset.z);
	});

	// SETUP POST-PROCESSING
	const composer = new EffectComposer(renderer);

	const taa = new TAARenderPass(scene, camera);
	taa.sampleLevel = 3;
	taa.unbiased = false;
	composer.addPass(taa);

	const glitchp = new GlitchPass();
	glitchp.enabled = false;
	glitchp.goWild = true;
	composer.addPass(glitchp);

	const chromatic = new ShaderPass(RGBShiftShader);
	chromatic.uniforms["amount"].value = 0;
	composer.addPass(chromatic);

	composer.addPass(new OutputPass());

	// SETUP AUDIO
	const listener = new THREE.AudioListener();
	camera.add(listener);

	const ambience = new THREE.Audio(listener);
	new THREE.AudioLoader().load(options.ambience.file, (buffer) => {
		ambience.setBuffer(buffer);
		ambience.setVolume(0.1);
		ambience.setLoop(true);
		ambience.play();
	});

	const glitcha = new THREE.Audio(listener);
	new THREE.AudioLoader().load("/assets/glitch.mp3", (buffer) => {
		glitcha.setBuffer(buffer);
		glitcha.setLoop(true);
	});

	// CREATE PLAY BUTTON
	if (ambience.context.state === "suspended") {
		renderer.domElement.style.pointerEvents = "none";
		const controls = document.getElementById("controls");
		if (controls) controls.style.display = "none";

		const button = document.createElement("button");
		button.textContent = "🔇";
		button.style.border = "none";
		button.style.position = "absolute";
		button.style.fontSize = "25vh";
		button.style.width = "100%";
		button.style.backgroundColor = "#adadadad";
		container.appendChild(button);

		button.addEventListener("click", () => {
			renderer.domElement.style.pointerEvents = "";
			if (controls) controls.style.display = "";
			listener.context.resume();
			button.remove();
		});
	}

	// SETTINGS
	bindtoggle("shadow-btn", true, "👤 Disable Shadows", "👤 Enable Shadows", (value) => {
		renderer.shadowMap.enabled = value;
		sun.castShadow = value;
	});

	bindtoggle("mute-btn", true, "🔇 Mute", "🔇 Unmute", (value) => {
		listener.setMasterVolume(value ? 1 : 0);
	});

	bindtoggle("helper-btn", false, "🎥 Hide Shadow Camera", "🎥 Show Shadow Camera", (value) => {
		shadowhelper.visible = value;
	});

	bindtoggle("glitch-btn", false, "👾 Disable Glitch", "👾 Enable Glitch", (value) => {
		glitchp.enabled = value;
		if (value) glitcha.play();
		else glitcha.stop();
	});

	bindtoggle("wireframe-btn", false, "▩ Disable Wireframe", "▩ Enable Wireframe", (value) => {
		scene.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.material.wireframe = value;
			}
		});
	});

	bindtoggle("orbit-btn", true, "🔄️ Disable Orbit", "🔄️ Enable Orbit", (value) => {
		controls.autoRotate = value;
	});

	bindrange("chromatic-range", 0, 0, 0.05, 0.001, (value) => {
		chromatic.uniforms["amount"].value = value;
	});

	const sunDistance = Math.sqrt(options.sun.x ** 2 + options.sun.y ** 2 + options.sun.z ** 2);
	const initialAngle = Math.asin(options.sun.y / sunDistance);
	const sunAzimuth = Math.atan2(options.sun.z, options.sun.x);
	let dayratio = Math.max(0, Math.sin(initialAngle));

	bindrange("sun-range", initialAngle, 0, Math.PI, 0.01, (angle) => {
		const h = sunDistance * Math.cos(angle);
		sun.position.set(h * Math.cos(sunAzimuth), sunDistance * Math.sin(angle), h * Math.sin(sunAzimuth));
		shadowhelper.update();

		dayratio = Math.max(0, Math.sin(angle));
		sun.intensity = 4 * dayratio;
	});

	// FUNCTIONALITY
	window.addEventListener("resize", () => {
		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(container.clientWidth, container.clientHeight);
		composer.setSize(container.clientWidth, container.clientHeight);
	});

	const timer = new THREE.Timer();

	function animate() {
		timer.update();
		camera.position.y = Math.max(0.25, camera.position.y);
		controls.update();

		renderSkybox();
		ambience.setVolume(0.2 + 0.25 * (1 - THREE.MathUtils.clamp(camera.position.y / options.ambience.height, 0, 1)));
		mixer.update(timer.getDelta());

		if (options.animate) options.animate();
		composer.render();
	}

	renderer.setAnimationLoop(animate);

	return {
		scene,
		timer,
		camera,
		renderer,
		listener,
		/**
		 * Plays the scene's animation clips in the given direction.
		 * @param {boolean} forward
		 */
		play(forward) {
			clips.forEach(function (clip) {
				const action = mixer.clipAction(clip);
				if (!action.isRunning()) {
					action.reset();
					action.time = forward ? 0 : clip.duration;
				}

				action.setLoop(THREE.LoopOnce, 1);
				action.clampWhenFinished = true;
				action.timeScale = forward ? 1 : -1;
				action.play();
			});
		},
	};
}

/**
 * Helper to create a toggle button.
 * @param {string} id The HTML id field of the button
 * @param {boolean} value The initial value of the toggle
 * @param {string} textOn The text to display when the button is true
 * @param {string} textOff The text to display when the button is off
 * @param {(value: boolean) => void} callback
 * @returns
 */
export function bindtoggle(id, value, textOn, textOff, callback) {
	const button = document.getElementById(id);
	if (!button) return;

	button.textContent = value ? textOn : textOff;
	button.addEventListener("click", () => {
		value = !value;
		button.textContent = value ? textOn : textOff;
		callback(value);
	});
}

/**
 * Helper to create a range input.
 * @param {string} id The HTML id field of the range
 * @param {number} value The initial value of the range
 * @param {number} min The minimum value of the range
 * @param {number} max The maximum value of the range
 * @param {number} step The step value of the range
 * @param {(value: number) => void} callback A callback that is called when the range value changes
 * @returns
 */
export function bindrange(id, value, min, max, step, callback) {
	const input = document.getElementById(id);
	if (!(input instanceof HTMLInputElement)) return;

	input.value = value.toString();
	input.min = min.toString();
	input.max = max.toString();
	input.step = step.toString();
	input.addEventListener("input", () => {
		value = parseFloat(input.value);
		callback(value);
	});
}

/**
 * Creates a parallax effect on the given element.
 * @param {HTMLElement} scene
 */
export function parallax(scene) {
	let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
	let target = pointer;

	function update() {
		requestAnimationFrame(update);

		pointer = {
			x: pointer.x + (target.x - pointer.x) * 0.1,
			y: pointer.y + (target.y - pointer.y) * 0.1,
		};

		let offset = 0;
		for (const node of scene.childNodes) {
			if (node instanceof HTMLElement) {
				const attr = node.getAttribute("data-depth");
				if (attr) {
					const depth = parseFloat(attr) * 0.25;
					node.style.transform = `translate(${(window.scrollX * 4 - pointer.x) * depth}px, ${(window.scrollY * 4 - pointer.y) * depth - offset}px)`;
					node.style.scale = `${1 + depth}`;
					offset += node.clientHeight;
				}
			}
		}
	}

	requestAnimationFrame(update);
	window.addEventListener("pointermove", (e) => {
		target = {
			x: (e.clientX / window.innerWidth) * window.innerWidth - window.innerWidth / 2,
			y: (e.clientY / window.innerHeight) * window.innerHeight,
		};
	});

	update();
}
