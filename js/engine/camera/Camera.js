const { mat4 } = glMatrix;
export default class Camera {
	constructor(options = {}) {
		this.node = options.node || null;
		this.matrix = options.matrix ? mat4.clone(options.matrix) : mat4.create();
	}
}
