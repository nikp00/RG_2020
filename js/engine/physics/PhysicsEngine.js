import PhysicsMesh from "./PhysicsMesh.js";
import PhysicsBox from "./PhysicsBox.js";
import PhysicsVehicle from "./PhysicsVehicle.js";
import PhysicsGhostObject from "./PhysicsGhostObject.js";
const { quat, vec3, mat4 } = glMatrix;
export default class PhysicsEngine {
	constructor(mapManager) {
		this.mapManager = mapManager;
		this.mapManager.physicsEngine = this;
		this.objects = [];

		this.time = Date.now();
		this.startTime = this.time;

		this._initPhysics();

		for (const obj of this.mapManager.track.children) {
			this._addStaticMeshObject(obj, this.mapManager.trackFriction);
		}
		for (const obj of this.mapManager.static_box.children) {
			this._addStaticMeshObject(obj, this.mapManager.grassFriction);
		}
		for (const obj of this.mapManager.spotLights) {
			this._addStaticMeshObject(obj.node, this.mapManager.grassFriction);
		}

		for (const propKey in this.mapManager.movableProps) {
			for (const prop of this.mapManager.movableProps[propKey]) {
				this._addDynamicBoxObject(prop, this.mapManager.movablePropsOptions[propKey]);
			}
		}

		this.start = new PhysicsGhostObject(this.mapManager.start.node, this.physicsWorld);
		this.startControl = new PhysicsGhostObject(
			this.mapManager.startControl.node,
			this.physicsWorld
		);
		this.borderControl = new PhysicsGhostObject(this.mapManager.border, this.physicsWorld);

		this.timerIsActive = false;
	}

	_addStaticBoxObject(object, friction) {
		this.objects.push(new PhysicsBox(object, 0, friction, this.physicsWorld));
	}

	_addDynamicBoxObject(object, options) {
		this.objects.push(new PhysicsBox(object, options.mass, options.friction, this.physicsWorld));
	}

	_addStaticMeshObject(object, friction) {
		this.objects.push(new PhysicsMesh(object, 0, friction, this.physicsWorld));
	}

	addVehicle(vehicle) {
		const physicsVehicle = new PhysicsVehicle(vehicle, this.physicsWorld);
		this.objects.push(physicsVehicle);
		this.vehicle = physicsVehicle;
		this.vehicleModel = vehicle;
	}

	_initPhysics() {
		this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
		this.broadphase = new Ammo.btDbvtBroadphase();
		this.solver = new Ammo.btSequentialImpulseConstraintSolver();
		this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
			this.dispatcher,
			this.broadphase,
			this.solver,
			this.collisionConfiguration
		);
		this.physicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));
	}

	_checkFinish() {
		let onStart = false;
		for (let i = 0; i < this.start.body.getNumOverlappingObjects(); i++) {
			if (this.start.body.getOverlappingObject(i).a == this.vehicle.body.a) {
				onStart = true;
			}
		}
		if (onStart && this.mapManager.start.isVisited && this.mapManager.startControl.isVisited) {
			this.timerIsActive = false;
			this.mapManager.stopTimer();
			this.mapManager.startControl.isVisited = false;
			this.mapManager.start.isVisited = false;
		}
		if (!this.mapManager.start.isVisited && onStart) {
			this.mapManager.start.isVisited = true;
			this.timerIsActive = true;
			this.mapManager.startTimer();
		} else {
			if (!this.mapManager.startControl.isVisited) {
				for (let i = 0; i < this.startControl.body.getNumOverlappingObjects(); i++) {
					if (this.startControl.body.getOverlappingObject(i).a == this.vehicle.body.a) {
						this.mapManager.startControl.isVisited = true;
					}
				}
			}
		}
	}

	checkBorder() {
		let isInBorder = false;
		for (let i = 0; i < this.borderControl.body.getNumOverlappingObjects(); i++) {
			if (this.borderControl.body.getOverlappingObject(i).a == this.vehicle.body.a) {
				isInBorder = true;
			}
		}
		return !isInBorder;
	}

	update(keys) {
		this.time = Date.now();
		const dt = (this.time - this.startTime) * 0.001;
		this.startTime = this.time;

		this._checkFinish();

		if (this.timerIsActive) this.mapManager.updateTimer(dt);

		for (const physicsObject of this.objects) {
			physicsObject.update(dt, keys);
		}

		let maxSubSteps = 1;
		if (dt > 1 / 60) {
			maxSubSteps = dt / (1 / 60);
			if (maxSubSteps === 1) maxSubSteps++;
		}
		const c = 10;
		const fixedSubStep = 1 / (60 * c);
		maxSubSteps *= c;

		this.physicsWorld.stepSimulation(dt, maxSubSteps, fixedSubStep);
	}
}
