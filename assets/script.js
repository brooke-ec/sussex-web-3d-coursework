let scene,
	camera,
	renderer,
	container,
	clock,
	mixer,
	actions = [],
	mode,
	isWireframe = false;
let loadedModel;
let secondModelMixer,
	secondsModelActions = [];

window.addEventListener("load", init);

function init() {
	const assetPath = "/assets/";

	container = document.getElementById("renderer");
	const rects = container.getBoundingClientRect();

	clock = new THREE.Clock();

	// Set up the scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xaaaaaa);

	// Set up the camera
	camera = new THREE.PerspectiveCamera(75, rects.width / rects.height, 0.1, 1000);
	camera.position.z = 3;

	// Add lighting
	const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820, 2);
	scene.add(ambient);

	const light = new THREE.DirectionalLight(0xffffff, 2);
	light.position.set(0, 10, 2);
	scene.add(light);

	// Set up the renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(rects.width, rects.height);
	document.querySelector("#renderer").appendChild(renderer.domElement);

	// Add orbit controls
	const controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.target.set(0, -5, 0);
	controls.update();

	// Button to control animations
	mode = "open";
	document.getElementById("open-button").addEventListener("click", () => {
		if (actions.length === 2) {
			if (mode === "open") {
				actions.forEach((action) => {
					action.timeScale = 1;
					action.reset();
					action.play();
				});
			}
		}
	});

	document.getElementById("wireframe-button").addEventListener("click", () => {
		isWireframe = !isWireframe;
		scene.traverse((child) => {
			if (child.isMesh) {
				child.material.wireframe = isWireframe;
			}
		});
	});

	document.getElementById("rotate-button").addEventListener("click", () => {
		if (loadedModel) {
			const axis = new THREE.Vector3(0, 1, 0); // Y-axis
			const angle = Math.PI / 8; // Rotate by 22.5 degrees
			loadedModel.rotateOnAxis(axis, angle);
		} else {
			console.warn("Model not loaded yet!");
		}
	});

	document.getElementById("crush-button").addEventListener("click", () => {
		if (secondsModelActions.length > 0) {
			secondsModelActions.forEach((action) => {
				action.reset();
				action.setLoop(THREE.LoopOnce); // Play the animation once
				action.clampWhenFinished = true; // Stop at the last frame
				action.play();
			});
		} else {
			console.warn("No animation available for the second model");
		}
	});

	// Load the glTF model
	const loader = new THREE.GLTFLoader();
	function loadModel(modelPath) {
		if (loadedModel) {
			scene.remove(loadedModel);
		}

		loader.load(assetPath + modelPath, (gltf) => {
			const model = gltf.scene;
			model.position.set(0, 0, 0);
			scene.add(model);

			loadedModel = model;

			// Set up animations
			mixer = new THREE.AnimationMixer(model);
			const animations = gltf.animations;
			actions = [];

			animations.forEach((clip) => {
				const action = mixer.clipAction(clip);
				action.clampWhenFinished = true;
				action.setLoop(THREE.LoopOnce);
				actions.push(action);
			});

			if (modelPath === "crush.glb") {
				secondModelMixer = mixer;
				secondsModelActions = actions;
			}
		});
	}

	loadModel("can.glb");

	document.getElementById("switch-button").addEventListener("click", () => {
		loadModel("crush.glb");
	});

	window.addEventListener("resize", resize, false);
	resize();

	update();
}

function update() {
	requestAnimationFrame(update);

	if (mixer) mixer.update(clock.getDelta());
	if (secondModelMixer) secondModelMixer.update(clock.getDelta());

	renderer.render(scene, camera);
}

function resize() {
	const rects = container.getBoundingClientRect();
	camera.aspect = rects.width / rects.height;
	camera.updateProjectionMatrix();
	renderer.setSize(rects.width, rects.height);
}
