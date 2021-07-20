const { quat } = glMatrix;
export default class KERS {
	constructor(node, options, scene, model) {
		this.name = "KERS";
		this.node = node["prop_kers"];

		this.durationDefault = options.options.duration;
		this.coolOffDefault = options.options.coolOff;
		this.angle = options.options.angle;
		this.speedBoost = options.options.speedBoost;
		this.powerBoost = options.options.powerBoost;

		this.model = model;

		this.duration = 0;
		this.coolOff = 0;

		this.time = Date.now();
		this.startTime = this.time;
		this.isActive = false;
	}

	update(keys) {
		this.time = Date.now();
		const dt = (this.time - this.startTime) * 0.001;
		this.startTime = this.time;

		if (keys["KeyE"] && this.model.physics) {
			this._toggle();
		}

		if (this.isActive) {
			this.duration -= dt;
		} else {
			this.coolOff -= dt;
		}

		if (this.isActive && this.duration <= 0 && this.model.physics) {
			this._toggle();
		}
	}

	_toggle() {
		if (!this.isActive && this.coolOff <= 0) {
			if (this.angle.x != 0) {
				quat.rotateX(this.node.rotation, this.node.rotation, (Math.PI / 180) * this.angle.x);
			}
			if (this.angle.y != 0) {
				quat.rotatY(this.node.rotation, this.node.rotation, (Math.PI / 180) * this.angle.y);
			}
			if (this.angle.z != 0) {
				quat.rotatZ(this.node.rotation, this.node.rotation, (Math.PI / 180) * this.angle.z);
			}
			this.duration = this.durationDefault;
			this.isActive = true;
			this.model.physics.maxSpeed *= this.speedBoost;
			this.model.physics.maxPower *= this.powerBoost;
		} else if (this.isActive && this.duration <= 0) {
			if (this.angle.x != 0) {
				quat.rotateX(this.node.rotation, this.node.rotation, -(Math.PI / 180) * this.angle.x);
			}
			if (this.angle.y != 0) {
				quat.rotatY(this.node.rotation, this.node.rotation, -(Math.PI / 180) * this.angle.y);
			}
			if (this.angle.z != 0) {
				quat.rotatZ(this.node.rotation, this.node.rotation, -(Math.PI / 180) * this.angle.z);
			}
			this.coolOff = this.coolOffDefault;
			this.duration = 0;
			this.isActive = false;
			this.model.physics.maxSpeed *= 1 / this.speedBoost;
			this.model.physics.maxPower *= 1 / this.powerBoost;
		}

		this.node.updateMatrix();
	}
}
