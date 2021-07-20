const { vec3 } = glMatrix;
export default class DirectionalLight {
	constructor(options) {
		const { direction, diffuse, specular } = options;
		this.direction = vec3.fromValues(...direction);
		this.diffuse = vec3.fromValues(...diffuse);
		this.specular = vec3.fromValues(...specular);
	}
}
