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
			if (node instanceof HTMLElement && node.hasAttribute("data-depth")) {
				const depth = parseFloat(node.getAttribute("data-depth")) * 0.25;
				node.style.transform = `translate(${(window.scrollX * 4 - pointer.x) * depth}px, ${(window.scrollY * 4 - pointer.y) * depth - offset}px)`;
				node.style.scale = `${1 + depth}`;
				offset += node.clientHeight;
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
