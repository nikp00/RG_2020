const { quat, vec3 } = glMatrix;
export default class SpotLight {
	constructor(node, options) {
		this.node = node;
		this.innerCutOff = Math.cos((Math.PI / 180) * options.innerCutOff);
		this.outerCutOff = Math.cos((Math.PI / 180) * options.outerCutOff);
		this.cutOff = Math.cos((Math.PI / 180) * options.cutOff);
		this.direction = vec3.fromValues(...options.direction);
		this.diffuse = vec3.fromValues(...options.diffuse);
		this.specular = vec3.fromValues(...options.specular);
		this.attenuation = options.attenuation;
		this.rotateOrigin = options.rotateOrigin;
		this.isActive = true;
	}

	getGlobalDirection() {
		const globalRotation = this.node.getGlobalRotation();
		switch (this.rotateOrigin.axes) {
			case "X":
				quat.rotateX(globalRotation, globalRotation, (Math.PI / 180) * this.rotateOrigin.angle);
				break;
			case "Y":
				quat.rotateY(globalRotation, globalRotation, (Math.PI / 180) * this.rotateOrigin.angle);
				break;
			case "Z":
				quat.rotateZ(globalRotation, globalRotation, (Math.PI / 180) * this.rotateOrigin.angle);
				break;
		}
		const direction = vec3.transformQuat(vec3.create(), this.direction, globalRotation);
		return direction;
	}

	toggleLight() {
		this.isActive = !this.isActive;
	}
}
