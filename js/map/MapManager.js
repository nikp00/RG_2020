import GLTFLoader from "../engine/model_loader/GLTFLoader.js";
import { availableMaps } from "./MapOptions.js";
import DirectionalLight from "../lights/DirectionalLight.js";
import AmbientLight from "../lights/AmbientLight.js";
import SpotLight from "../lights/SpotLight.js";
import PointLight from "../lights/PointLight.js";

const { vec3, quat, mat4 } = glMatrix;

export default class MapManager {
	constructor(options = {}, scene) {
		this.loader = new GLTFLoader();
		this.scene = scene;
		this.url = availableMaps[options.selectedMap].url;
		this.startLocation = availableMaps[options.selectedMap].startLocation;
		this.startRotation = availableMaps[options.selectedMap].startRotation;
		this.trackFriction = availableMaps[options.selectedMap].trackFriction;
		this.grassFriction = availableMaps[options.selectedMap].grassFriction;

		scene.directionalLight = new DirectionalLight(
			availableMaps[options.selectedMap].directionalLight
		);
		scene.ambientLight = new AmbientLight(availableMaps[options.selectedMap].ambientLight);
		this.spotLightOptions = availableMaps[options.selectedMap].spotLight;
		this.pointLightOptions = availableMaps[options.selectedMap].pointLight;

		this.skyBoxUrl = availableMaps[options.selectedMap].skyBoxUrl;

		this.movablePropsOptions = availableMaps[options.selectedMap].props.movable_props;
		this.movableProps = {};
		this.movableProps = {};

		this.spotLights = [];
		this.pointLights = [];

		this.time = 0;
		this.times = [];
		this.laps = document.querySelector(".laps");
		this.lapTime = document.querySelector(".time");
		const defaultLaps = document.createElement("div");
		defaultLaps.innerHTML = "1. --:--:--";
		this.laps.innerHTML = "";
		this.laps.appendChild(defaultLaps);
		const defaultTimer = document.createElement("div");
		defaultTimer.classList = "time";
		defaultTimer.innerHTML = "00:00:00";
		this.lapTime.innerHTML = "";
		this.lapTime.appendChild(defaultTimer);

		this.cameraStart = {
			rotation: {
				x: availableMaps[options.selectedMap].cameraStart.rotation.x,
				y: availableMaps[options.selectedMap].cameraStart.rotation.y,
				z: availableMaps[options.selectedMap].cameraStart.rotation.z,
			},
			translation: [...availableMaps[options.selectedMap].cameraStart.translation],
		};

		this.cameraOriginal = null;
		this.t = 0;

		this.isReady = false;
	}

	async load() {
		await this.loader.load(this.url);
		this.main = await this.loader.loadNode("main");
		this.track = await this.loader.loadNode("track");
		this.static_box = await this.loader.loadNode("static_box");

		this.start = {
			node: await this.loader.loadNode("start"),
			isVisited: false,
		};

		this.startControl = {
			node: await this.loader.loadNode("start_control"),
			isVisited: false,
		};

		this.border = await this.loader.loadNode("border");

		// Map point lights
		for (const lightKey in this.pointLightOptions) {
			const lights = await this.loader.loadNode(lightKey);
			for (const light of lights.children) {
				const pointLight = new PointLight(light, this.pointLightOptions[lightKey]);
				this.scene.pointLights.push(pointLight);
				this.pointLights.push(pointLight);
			}
		}

		// Map spot lights
		for (const lightKey in this.spotLightOptions) {
			const lights = await this.loader.loadNode(lightKey);
			for (const light of lights.children) {
				const spotLight = new SpotLight(light, this.spotLightOptions[lightKey]);
				this.scene.spotLights.push(spotLight);
				this.spotLights.push(spotLight);
			}
		}

		for (const propKey in this.movablePropsOptions) {
			const movableProps = await this.loader.loadNode(propKey);
			this.movableProps[propKey] = [];
			for (const prop of movableProps.children) {
				this.movableProps[propKey].push(prop);
			}
		}

		this.scene.addNode(this.main);

		await this.loader.load(this.skyBoxUrl);
		this.skyBox = await this.loader.loadNode("sky_box");
		this.scene.skyBox = this.skyBox;
	}

	animateStartCamera(camera, keys) {
		if (keys["Space"]) {
			this.t = 1;
		}

		if (this.t == 0) {
			this.cameraOriginal = {
				rotation: quat.clone(camera.rotation),
				translation: vec3.clone(camera.translation),
			};
			const rotations = this.cameraStart.rotation;
			this.cameraStart.rotation = quat.create();
			quat.rotateX(
				this.cameraStart.rotation,
				this.cameraStart.rotation,
				(Math.PI / 180) * rotations.x
			);
			quat.rotateY(
				this.cameraStart.rotation,
				this.cameraStart.rotation,
				(Math.PI / 180) * rotations.y
			);
			quat.rotateZ(
				this.cameraStart.rotation,
				this.cameraStart.rotation,
				(Math.PI / 180) * rotations.z
			);
		}
		this.t += 0.001;
		quat.lerp(camera.rotation, this.cameraStart.rotation, this.cameraOriginal.rotation, this.t);
		vec3.lerp(
			camera.translation,
			this.cameraStart.translation,
			this.cameraOriginal.translation,
			this.t
		);

		if (this.t >= 1) {
			this.isReady = true;
			camera.translation = this.cameraOriginal.translation;
			camera.rotation = this.cameraOriginal.rotation;
		}
		camera.updateMatrix();
	}

	startTimer() {
		this.time = 0;
	}

	updateTimer(dt) {
		this.time += dt;
		const millisec = this.time * 1000;
		const min = Math.floor(millisec / 60000);
		const sec = ((millisec % 60000) / 1000).toFixed(0);
		const ms = (millisec % 1000).toFixed(0);
		this.lapTime.innerHTML = `${min}:${sec}:${ms}`;
	}

	stopTimer() {
		this.times.push(this.time);
		this.times.sort();

		this.times = this.times.slice(0, 3);

		this._updateTimeBoard();
	}

	_updateTimeBoard() {
		this.laps.innerHTML = "";
		for (let i = 0; i < this.times.length; i++) {
			const timeDiv = document.createElement("div");
			const millisec = this.times[i] * 1000;
			const min = Math.floor(millisec / 60000);
			const sec = ((millisec % 60000) / 1000).toFixed(0);
			const ms = (millisec % 1000).toFixed(0);
			timeDiv.innerHTML = `${i + 1}: ${min}:${sec}:${ms}`;

			this.laps.appendChild(timeDiv);
		}
	}
}
