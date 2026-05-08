import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import * as THREE from "three";

const size = 1024;
const scale = 0.05;
const count = 6;
const distance = 640;

/**
 * Creates a layered cloud effect using a
 * @param {THREE.Scene} scene The scene to apply the clouds to
 */
export function createClouds(scene) {
	const perlin = new ImprovedNoise();

	const layers = new Array(count).fill(0).map((_, index) => {
		let i = 0;
		const ratio = index / count;
		const min = ratio * 128;
		const diff = 255 - min;

		const data = new Uint8ClampedArray(size * size * 4);
		for (let x = 0; x < size; x++) {
			for (let y = 0; y < size; y++) {
				const sample = min + diff * perlin.noise((x * scale) / 1.5, index * 100, (y * scale) / 1.5);
				data[i] = sample; // R
				data[i + 1] = sample; // G
				data[i + 2] = sample; // B
				data[i + 3] = sample; // A
				i += 4;
			}
		}

		const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.needsUpdate = true;

		const material = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			opacity: 1,
			depthWrite: false,
		});

		const geometry = new THREE.PlaneGeometry(distance, distance);
		const plane = new THREE.Mesh(geometry, material);
		plane.rotation.x = -Math.PI / 2;

		plane.position.y = -ratio * 8;
		scene.add(plane);

		return { plane, material };
	});

	return {
		/**
		 * @param {number} delta Time delta for animation
		 */
		animate(delta) {
			layers.forEach(({ material }) => {
				if (!material.map) return;
				material.map.offset.x += delta * 0.005;
				material.map.offset.y += delta * 0.005;
			});
		},
	};
}
