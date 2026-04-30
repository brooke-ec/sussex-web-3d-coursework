import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { TAARenderPass } from "three/examples/jsm/postprocessing/TAARenderPass.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

/**
 * Initialises a three.js scene on the given container element.
 * @param {HTMLElement} container
 */
export async function setup(container) {
	const scene = new THREE.Scene();
	const texture = new THREE.CubeTextureLoader().load([
		"/assets/citadel/px.png", // right
		"/assets/citadel/nx.png", // left
		"/assets/citadel/py.png", // top
		"/assets/citadel/ny.png", // bottom
		"/assets/citadel/pz.png", // front
		"/assets/citadel/nz.png", // back
	]);

	scene.environment = texture;
	scene.background = texture;

	const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
	camera.position.y = 1;
	camera.position.z = -15;
	camera.position.x = 1;

	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(container.clientWidth, container.clientHeight);
	container.appendChild(renderer.domElement);

	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.shadowMap.enabled = true;

	const composer = new EffectComposer(renderer);

	const taa = new TAARenderPass(scene, camera);
	taa.sampleLevel = 3;
	taa.unbiased = false;
	composer.addPass(taa);

	composer.addPass(new OutputPass());

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.autoRotateSpeed = 0.5;
	controls.enableDamping = true;
	controls.target.set(0, 9, 0);
	controls.autoRotate = true;
	controls.zoomSpeed = 1.75;

	const sun = new THREE.DirectionalLight(0xffffff, 2);
	sun.position.set(-7.5, 6, 0);

	const d = 10;
	sun.shadow.camera.top = d;
	sun.shadow.camera.bottom = -d;
	sun.shadow.camera.left = d;
	sun.shadow.camera.right = -d;

	sun.shadow.mapSize.width = 1024 * 2;
	sun.shadow.mapSize.height = 1024 * 2;

	sun.shadow.bias = -0.001;
	sun.castShadow = true;
	scene.add(sun);

	const gltf = await new GLTFLoader().loadAsync("/assets/citadel/scene.glb");
	gltf.scene.traverse(function (child) {
		if (child.isObject3D) {
			child.castShadow = true;
			child.receiveShadow = true;
		}
	});

	scene.add(gltf.scene);

	window.addEventListener("resize", () => {
		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(container.clientWidth, container.clientHeight);
		composer.setSize(container.clientWidth, container.clientHeight);
	});

	function animate() {
		controls.update();
		composer.render();
	}

	renderer.setAnimationLoop(animate);
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
