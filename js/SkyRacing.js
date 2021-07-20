import Vehicle from "./vehicle/Vehicle.js";
import Scene from "./engine/Scene.js";
import MapManager from "./map/MapManager.js";
import Renderer from "./engine/renderers/Renderer.js";
import EventManager from "./EventManager.js";
import PhysicsEngine from "./engine/physics/PhysicsEngine.js";
import { availableMaps } from "./map/MapOptions.js";
import { availableVehicles } from "./vehicle/VehicleOptions.js";

const { vec3, quat, mat4 } = glMatrix;

class SkyRacing {
	constructor(canvas) {
		this.canvas = canvas;
		this.guiElements = {};
		this._iniGL();
		this._initGUI();
	}

	_initGUI() {
		// init map selector
		this.guiElements["mapSelector"] = document.querySelector(".map-selector");
		for (const map in availableMaps) {
			const mapElement = document.createElement("div");
			mapElement.setAttribute("id", map);
			const text = document.createElement("p");
			text.innerHTML = availableMaps[map].name;
			mapElement.appendChild(text);
			mapElement.style.backgroundImage = `url('${availableMaps[map].thumbnail}')`;
			mapElement.addEventListener("click", this._selectMap.bind(this));
			this.guiElements.mapSelector.appendChild(mapElement);
		}

		// init vehicle selector
		this.guiElements["vehicleSelector"] = document.querySelector(".vehicle-selector");
		for (const vehicle in availableVehicles) {
			const vehicleElement = document.createElement("div");
			vehicleElement.setAttribute("id", vehicle);
			vehicleElement.style.backgroundImage = `url('${availableVehicles[vehicle].thumbnail}')`;
			const text = document.createElement("p");
			text.innerHTML = availableVehicles[vehicle].name;
			vehicleElement.appendChild(text);
			vehicleElement.addEventListener("click", this._selectVehicle.bind(this));
			this.guiElements.vehicleSelector.appendChild(vehicleElement);
		}

		// init start button
		this.guiElements["startButton"] = document.querySelector(".play-button");
		this.guiElements.startButton.addEventListener("click", this._start.bind(this));

		this.guiElements["menu"] = document.querySelector(".menu");
		this.guiElements["loading"] = document.querySelector(".loading");
		this.guiElements["endScreen"] = document.querySelector(".end-screen");
		this.guiElements["dashboard"] = document.querySelector(".dashboard");
		this.guiElements["restart"] = document.querySelector(".restart");
		this.guiElements["return"] = document.querySelector(".return");

		this.guiElements.restart.addEventListener("click", this._restart.bind(this));
		this.guiElements.return.addEventListener("click", this._returnToMenu.bind(this));

		this.guiElements.loading.style.display = "none";
		this.guiElements.dashboard.style.display = "none";
		this.guiElements.endScreen.style.display = "none";
	}

	_selectMap(e) {
		this.selectedMap = e.target.id;
		for (const option of this.guiElements.mapSelector.children) {
			option.classList = "";
			if (option.id == this.selectedMap) {
				option.classList = "selected";
			}
		}
	}

	_selectVehicle(e) {
		this.selectedVehicle = e.target.id;
		for (const option of this.guiElements.vehicleSelector.children) {
			option.classList = "";
			if (option.id == this.selectedVehicle) {
				option.classList = "selected";
			}
		}
	}

	_start() {
		if (this.selectedMap && this.selectedVehicle) {
			this.guiElements.menu.style.display = "none";
			this.guiElements.loading.style.display = "flex";
			this.eventManager = new EventManager();
			this.cameras = {};
			this._init();
		}
	}

	_restart() {
		this.guiElements.endScreen.style.display = "none";
		this._start();
	}

	_returnToMenu() {
		this.guiElements.endScreen.style.display = "none";
		// this.selectedVehicle = null;
		// this.selectedMap = null;
		this.guiElements.menu.style.display = "flex";
	}

	_gameOver() {
		cancelAnimationFrame(this.animationID);
		this.guiElements.dashboard.style.display = "none";
		this.guiElements.endScreen.style.display = "flex";
		this.vehicle = null;
		this.mapManager = null;
		this.physicsEngine = null;
	}

	async _init() {
		this._resize();
		this.scene = new Scene();

		this.mapManager = new MapManager({ selectedMap: this.selectedMap }, this.scene);
		await this.mapManager.load();

		this.vehicle = new Vehicle({ selectedVehicle: this.selectedVehicle }, this.scene);
		await this.vehicle.load();
		this.vehicle.setStartPosition(this.mapManager.startLocation, this.mapManager.startRotation);

		this.physicsEngine = new PhysicsEngine(this.mapManager);
		this.physicsEngine.addVehicle(this.vehicle);

		this.cameras = this.vehicle.camera;
		this.camera = this.cameras.follow_cam;
		this.renderer = new Renderer(this.gl);
		this.renderer.prepareScene(this.scene);
		this.renderer.prepareNode(this.scene.skyBox);
		this.guiElements.loading.style.display = "none";
		this.animationID = requestAnimationFrame(this._update.bind(this));
	}

	_render() {
		if (this.renderer) {
			this.renderer.render(this.scene, this.camera);
		}
	}

	_iniGL() {
		this.gl = null;
		try {
			this.gl = this.canvas.getContext("webgl2", {
				preserveDrawingBuffer: true,
			});
		} catch (error) {}

		if (!this.gl) {
			console.log("Cannot create WebGL 2.0 context");
		}
	}

	_update() {
		if (this.physicsEngine.checkBorder() && !this.eventManager.keys["Escape"]) {
			this._resize();
			if (!this.mapManager.isReady) {
				this.mapManager.animateStartCamera(this.camera, this.eventManager.keys);
			} else {
				this.guiElements.dashboard.style.display = "flex";
				this._updateCamera();
				this.vehicle.update(this.eventManager);
			}
			this.physicsEngine.update(this.mapManager.isReady ? this.eventManager.keys : {});
			this._render();
			requestAnimationFrame(this._update.bind(this));
		} else {
			this._gameOver();
		}
	}

	_updateCamera() {
		if (this.eventManager.checkStickyKey("KeyC")) {
			if (this.camera === this.cameras.follow_cam) {
				this.camera = this.cameras.fpv_cam;
			} else {
				this.camera = this.cameras.follow_cam;
			}
		}

		if (this.eventManager.scroll != 0 && this.camera == this.cameras.follow_cam) {
			if (this.eventManager.scroll > 0 && this.camera.translation[1] <= 100) {
				vec3.add(this.camera.translation, this.camera.translation, [0, 1, 0]);
			} else if (this.camera.translation[1] >= 0) {
				vec3.add(this.camera.translation, this.camera.translation, [0, -1, 0]);
			}
			this.camera.updateMatrix();
			this.eventManager.scroll = 0;
		}
	}

	_resizeCamera() {
		const w = this.canvas.clientWidth;
		const h = this.canvas.clientHeight;
		const aspectRatio = w / h;
		if (this.camera) {
			this.camera.camera.aspect = aspectRatio;
			this.camera.camera.updateMatrix();
		}
	}

	_resize() {
		const canvas = this.canvas;
		const gl = this.gl;
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		this._resizeCamera();
	}
}

document.addEventListener("DOMContentLoaded", () => {
	Ammo().then(function (AmmoLib) {
		Ammo = AmmoLib;
		const canvas = document.querySelector("canvas");
		const app = new SkyRacing(canvas);
	});
});
