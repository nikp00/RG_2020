const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;
const quat = glMatrix.quat;

export default class Node {
	constructor(options = {}) {
		this.translation = options.translation
			? vec3.clone(options.translation)
			: vec3.fromValues(0, 0, 0);
		this.rotation = options.rotation ? quat.clone(options.rotation) : quat.fromValues(0, 0, 0, 1);
		this.scale = options.scale ? vec3.clone(options.scale) : vec3.fromValues(1, 1, 1);
		this.matrix = options.matrix ? mat4.clone(options.matrix) : mat4.create();
		this.extras = options.extras || null;

		if (options.matrix) {
			this.updateTransform();
		} else if (options.translation || options.rotation || options.scale) {
			this.updateMatrix();
		}

		if (options.mesh) {
			const max = options.mesh.primitives[0].attributes.POSITION.max;
			const min = options.mesh.primitives[0].attributes.POSITION.min;
			this.whl = vec3.set(
				vec3.create(),
				Math.abs(max[0]) + Math.abs(min[0]) || 0,
				Math.abs(max[1]) + Math.abs(min[1]) || 0,
				Math.abs(max[2]) + Math.abs(min[2]) || 0
			);
		} else {
			this.whl = vec3.create();
		}

		this.camera = options.camera || null;
		this.mesh = options.mesh || null;

		this.children = [...(options.children || [])];
		for (const child of this.children) {
			child.parent = this;
		}
		this.parent = null;
	}

	updateTransform() {
		mat4.getRotation(this.rotation, this.matrix);
		mat4.getTranslation(this.translation, this.matrix);
		mat4.getScaling(this.scale, this.matrix);
	}

	updateMatrix() {
		mat4.fromRotationTranslationScale(this.matrix, this.rotation, this.translation, this.scale);
	}

	addChild(node) {
		this.children.push(node);
		node.parent = this;
	}

	removeChild(node) {
		const index = this.children.indexOf(node);
		if (index >= 0) {
			this.children.splice(index, 1);
			node.parent = null;
		}
	}

	clone() {
		return new Node({
			...this,
			children: this.children.map((child) => child.clone()),
		});
	}

	getGlobalTransform() {
		if (!this.parent) {
			return mat4.clone(this.matrix);
		} else {
			let transform = this.parent.getGlobalTransform();
			return mat4.mul(transform, transform, this.matrix);
		}
	}

	getGlobalTranslation() {
		const matrix = this.getGlobalTransform();
		const globalTranslation = mat4.getTranslation(vec3.create(), matrix);
		return globalTranslation;
	}

	getGlobalRotation() {
		const matrix = this.getGlobalTransform();
		const globalRotation = mat4.getRotation(quat.create(), matrix);
		return globalRotation;
	}
}
