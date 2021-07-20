import GLTFLoader from "../engine/model_loader/GLTFLoader.js";
import { availableVehicles } from "./VehicleOptions.js";
import SpotLight from "../lights/SpotLight.js";

const { vec3, quat } = glMatrix;

export default class Vehicle {
	constructor(options = { selectedVehicle: basic }, scene) {
		this.loader = new GLTFLoader();
		this.scene = scene;
		this.url = availableVehicles[options.selectedVehicle].url;
		this.stats = availableVehicles[options.selectedVehicle].stats;
		this.lightOptions = availableVehicles[options.selectedVehicle].lights;
		this.propList = availableVehicles[options.selectedVehicle].props;
		this.props = [];
		this.lights = [];

		this.dashboard = {
			speed: document.querySelector(".speed"),
			brake: document.querySelector(".brake"),
			force: document.querySelector(".force"),
			powerUp: document.querySelector(".power-up"),
		};
	}

	async load() {
		await this.loader.load(this.url);
		this.camera = {
			fpv_cam: await this.loader.loadNode("fpv_cam"),
			follow_cam: await this.loader.loadNode("follow_cam"),
		};
		this.main = await this.loader.loadNode("main");
		this.fl = await this.loader.loadNode("front_left");
		this.fr = await this.loader.loadNode("front_right");
		this.bl = await this.loader.loadNode("back_left");
		this.br = await this.loader.loadNode("back_right");
		this.steeringWheel = await this.loader.loadNode("steering_wheel");

		const lights = await this.loader.loadNode("lights");
		for (const lightNode of lights.children) {
			const light = new SpotLight(lightNode, this.lightOptions);
			this.lights.push(light);
			this.scene.spotLights.push(light);
		}

		this.toggleHeadlights();

		for (const propKey in this.propList) {
			const nodes = {};
			for (const node of this.propList[propKey].nodes) {
				nodes[node] = await this.loader.loadNode(node);
			}

			const prop = new Prop(nodes, this.propList[propKey], this.scene, this);
			this.props.push(prop);
		}

		this.scene.addNode(this.main);
		this.scene.addNode(this.fl);
		this.scene.addNode(this.fr);
		this.scene.addNode(this.bl);
		this.scene.addNode(this.br);
	}

	update(eventManager) {
		if (eventManager.checkStickyKey("KeyF")) {
			this.toggleHeadlights();
		}

		for (const prop of this.props) {
			prop.update(eventManager.keys);
		}
	}

	setStartPosition(startLocation, startRotation) {
		if (startRotation.x != 0) {
			quat.rotateX(this.main.rotation, this.main.rotation, (Math.PI / 180) * startRotation.x);
		}
		if (startRotation.y != 0) {
			quat.rotateY(this.main.rotation, this.main.rotation, (Math.PI / 180) * startRotation.y);
		}
		if (startRotation.z != 0) {
			quat.rotateZ(this.main.rotation, this.main.rotation, (Math.PI / 180) * startRotation.z);
		}
		this.main.translation = vec3.fromValues(startLocation[0], startLocation[1], startLocation[2]);
		this.main.updateMatrix();
	}

	toggleHeadlights() {
		for (const light of this.lights) {
			light.toggleLight();
		}
	}

	reset() {
		vec3.add(this.main.translation, this.main.translation, [0, 0.5, 0]);
		const rotation = quat.copy(quat.create(), this.main.rotation);
		rotation[0] = 0;
		rotation[1] = 0;
		rotation[2] = -rotation[2];
		quat.multiply(this.main.rotation, this.main.rotation, rotation);
		this.main.updateMatrix();
	}

	updateDashboard(speed, force, brake) {
		this.dashboard.speed.innerHTML = Math.abs(Math.round(speed));
		const brakePercentage = Math.max((brake / this.stats.maxBreakingForce) * 100, 1);
		const forcePercentage = Math.max((force / this.stats.maxEngineForce) * 100, 1);
		const powerUpName = this.props[0].prop.name;
		const powerUpColor =
			this.props[0].prop.coolOff > 0
				? "rgba(255,255,255,0.3)"
				: this.props[0].prop.duration > 0
				? "green"
				: "white";
		this.dashboard.powerUp.innerHTML = powerUpName;
		this.dashboard.powerUp.style.color = powerUpColor;
		this.dashboard.brake.style.background = `linear-gradient(to top, red ${brakePercentage}%, rgba(0, 0, 0, 0) ${brakePercentage}%)`;
		this.dashboard.force.style.background = `linear-gradient(to top, green ${forcePercentage}%, rgba(0, 0, 0, 0) ${forcePercentage}%)`;
	}
}

class Prop {
	constructor(nodes, options, scene, model) {
		this.prop = new options.propType(nodes, options, scene, model);
	}
	update(keys, dt) {
		this.prop.update(keys, dt);
	}
}
