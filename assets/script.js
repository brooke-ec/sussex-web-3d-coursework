let scene,
	camera,
	renderer,
	container,
	clock,
	mixer,
	actions = [],
	mode;

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
	const btn = document.getElementById("btn");
	btn.addEventListener("click", () => {
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

	// Load the glTF model
	const loader = new THREE.GLTFLoader();
	loader.load(assetPath + "can.glb", (gltf) => {
		const model = gltf.scene;
		scene.add(model);

		// Set up animations
		mixer = new THREE.AnimationMixer(model);
		const animations = gltf.animations;

		animations.forEach((clip) => {
			const action = mixer.clipAction(clip);
			action.clampWhenFinished = true;
			action.setLoop(THREE.LoopOnce);
			actions.push(action);
		});
	});

	window.addEventListener("resize", resize, false);
	resize();

	update();
}

function update() {
	requestAnimationFrame(update);

	if (mixer) mixer.update(clock.getDelta());

	renderer.render(scene, camera);
}

function resize() {
	const rects = container.getBoundingClientRect();
	camera.aspect = rects.width / rects.height;
	camera.updateProjectionMatrix();
	renderer.setSize(rects.width, rects.height);
}
