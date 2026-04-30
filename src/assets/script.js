import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { TAARenderPass } from "three/examples/jsm/postprocessing/TAARenderPass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * @typedef {Object} SceneOptions
 * @property {Position & {target: Position, speed: number}} camera - Camera configuration.
 * @property {{file: string, height: number}} ambience - Sound confuguration for the scene
 * @property {Position & {resolution: number}} sun - The position of the sun in the scene.
 * @property {string[]} skybox - The paths to the skybox textures.
 */

/**
 * Initialises a three.js scene on the given container element.
 * @param {HTMLElement} container
 * @param {SceneOptions} options
 */
export function setup(container, options) {
	// SETUP SCENE
	const scene = new THREE.Scene();

	const texture = new THREE.CubeTextureLoader().load(options.skybox);
	scene.environment = texture;
	scene.background = texture;

	// SETUP SUN
	const sun = new THREE.DirectionalLight(0xfff1c4, 3);
	sun.position.set(options.sun.x, options.sun.y, options.sun.z);

	sun.shadow.camera.top = options.sun.resolution;
	sun.shadow.camera.bottom = -options.sun.resolution;
	sun.shadow.camera.left = options.sun.resolution;
	sun.shadow.camera.right = -options.sun.resolution;

	sun.shadow.mapSize.width = (1024 * options.sun.resolution) / 5;
	sun.shadow.mapSize.height = (1024 * options.sun.resolution) / 5;

	sun.shadow.bias = -0.001;
	sun.castShadow = true;
	scene.add(sun);

	// SETUP CAMERA
	const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
	camera.position.x = options.camera.x;
	camera.position.y = options.camera.y;
	camera.position.z = options.camera.z;

	// SETUP RENDERER
	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(container.clientWidth, container.clientHeight);
	container.appendChild(renderer.domElement);

	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.shadowMap.enabled = true;

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
	let playForward = true;

	new GLTFLoader().load("/assets/citadel/scene.glb", (gltf) => {
		clips = gltf.animations;
		gltf.scene.traverse(function (child) {
			if ("isMesh" in child && child.isMesh) {
				child.receiveShadow = true;
				child.castShadow = true;
			}
		});

		scene.add(gltf.scene);
	});

	// SETUP POST-PROCESSING
	const composer = new EffectComposer(renderer);

	const taa = new TAARenderPass(scene, camera);
	taa.sampleLevel = 3;
	taa.unbiased = false;
	composer.addPass(taa);

	composer.addPass(new OutputPass());

	// SETUP AUDIO
	const listener = new THREE.AudioListener();
	camera.add(listener);

	const ambience = new THREE.Audio(listener);
	new THREE.AudioLoader().load(options.ambience.file, (buffer) => {
		ambience.setBuffer(buffer);
		ambience.setLoop(true);
		ambience.play();
	});

	// CREATE PLAY BUTTON
	if (ambience.context.state === "suspended") {
		renderer.domElement.style.pointerEvents = "none";

		const button = document.createElement("button");
		button.textContent = "🔇";
		button.style.border = "none";
		button.style.position = "absolute";
		button.style.fontSize = "25vh";
		button.style.width = "100%";
		button.style.backgroundColor = "#adadadad";
		container.appendChild(button);

		button.addEventListener("click", () => {
			renderer.domElement.style.pointerEvents = "auto";
			listener.context.resume();
			button.remove();
		});
	}

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

		ambience.setVolume(0.2 + 0.25 * (1 - THREE.MathUtils.clamp(camera.position.y / options.ambience.height, 0, 1)));
		mixer.update(timer.getDelta());
		composer.render();
	}

	renderer.setAnimationLoop(animate);

	return {
		scene,
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
