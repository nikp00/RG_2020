import PointLight from "../lights/PointLight.js";
export default class EmergencyLights {
	constructor(nodes, options, scene, model) {
		this.lights = { red: [], blue: [] };
		this.name = "Emergency lights";
		for (const color in options.options) {
			for (const light in options.options[color]) {
				const pointLight = new PointLight(nodes[light], options.options[color][light]);
				this.lights[color].push(pointLight);
				scene.pointLights.push(pointLight);
			}
		}

		this.model = model;
		this.time = Date.now();
		this.startTime = this.time;
		this.isActive = false;

		this.durationDefault = options.options.duration;
		this.coolOffDefault = options.options.coolOff;
		this.interval = options.options.interval;
		this.speedBoost = options.options.speedBoost;
		this.powerBoost = options.options.powerBoost;

		this.count = 0;
		this.duration = 0;
		this.coolOff = 0;

		for (const color in this.lights) {
			for (const light of this.lights[color]) {
				light.toggleLight();
			}
		}
	}

	update(keys) {
		this.time = Date.now();
		const dt = (this.time - this.startTime) * 0.001;
		this.startTime = this.time;
		this.duration -= dt;

		if (keys["KeyE"] && this.model.physics && this.coolOff <= 0 && !this.isActive) {
			this._toggle();
			this.duration = this.durationDefault;
		}

		if (this.isActive) {
			this.count += dt;
			if (this.count >= this.interval) {
				for (const color in this.lights) {
					for (const light of this.lights[color]) {
						light.toggleLight();
					}
				}
				this.count = 0;
			}
			if (this.duration <= 0) {
				this._toggle();
				this.coolOff = this.coolOffDefault;
				this.count = 0;
				this.duration = 0;
			}
		} else {
			this.coolOff -= dt;
		}
	}

	_toggle() {
		if (this.isActive) {
			for (const color in this.lights) {
				for (const light of this.lights[color]) {
					light.isActive = false;
				}
			}
			this.model.physics.maxSpeed *= 1 / this.speedBoost;
			this.model.physics.maxPower *= 1 / this.powerBoost;
		} else {
			for (const light of this.lights.red) {
				light.toggleLight();
			}
			this.model.physics.maxSpeed *= this.speedBoost;
			this.model.physics.maxPower *= this.powerBoost;
		}
		this.isActive = !this.isActive;
	}
}
