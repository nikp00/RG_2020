const { quat, vec3 } = glMatrix;
export default class PointLight {
	constructor(node, options) {
		this.node = node;
		this.position = node.getGlobalTranslation();
		this.diffuse = vec3.fromValues(...options.diffuse);
		this.specular = vec3.fromValues(...options.specular);
		this.attenuation = options.attenuation;
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
