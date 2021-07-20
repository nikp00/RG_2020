import { physicsObjectTypes, PhysicsObject } from "./PhysicsObject.js";
const { quat, vec3, mat4 } = glMatrix;
export default class PhysicsVehicle extends PhysicsObject {
	constructor(vehicle, physicsWorld) {
		const { main, fr, fl, br, bl, steeringWheel, stats } = vehicle;
		super(main, stats.mass, stats.friction, physicsObjectTypes.vehicle);

		this.steeringWheel = steeringWheel;
		this.vehicleModel = vehicle;
		vehicle.physics = this;

		this.wheelAxisPositionBack = br.translation[2];
		this.wheelRadiusBack = br.whl[1];
		this.wheelHalfTrackBack = Math.abs(br.translation[0]);
		this.wheelAxisHeightBack = br.translation[1] / 2;

		this.wheelAxisFrontPosition = fr.translation[2];
		this.wheelHalfTrackFront = Math.abs(fr.translation[0]);
		this.wheelAxisHeightFront = fr.translation[1] / 2;
		this.wheelRadiusFront = fr.whl[1];

		this.maxSuspensionTravelCm = stats.maxSuspensionTravelCm;
		this.suspensionStiffness = stats.suspensionStiffness;
		this.wheelsDampingCompression = stats.wheelsDampingCompression;
		this.wheelsDampingRelaxation = stats.wheelsDampingRelaxation;
		this.frictionSlip = stats.frictionSlip;
		this.rollInfluence = stats.rollInfluence;
		this.suspensionRestLength = stats.suspensionRestLength;

		this.steeringIncrement = stats.steering.steeringIncrement;
		this.steeringClamp = stats.steering.clamp;
		this.steeringC = stats.steering.c;
		this.steeringK = stats.steering.k;

		this.maxEngineForce = stats.maxEngineForce;
		this.maxBreakingForce = stats.maxBreakingForce;
		this.maxSpeed = stats.maxSpeed;

		this.body.setActivationState(4);
		physicsWorld.addRigidBody(this.body);

		this.engineForce = 0;
		this.vehicleSteering = 0;
		this.breakingForce = 0;
		this.speed = 0;
		this.airTimeCoolOffFront = 0;
		this.airTimeCoolOffBack = 0;

		this.tuning = new Ammo.btVehicleTuning();
		this.rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
		this.vehicle = new Ammo.btRaycastVehicle(this.tuning, this.body, this.rayCaster);

		this.vehicle.setCoordinateSystem(0, 1, 2);
		physicsWorld.addAction(this.vehicle);

		vehicle.physicsVehicle = this.vehicle;
		vehicle.physicsBody = this.body;

		this.wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
		this.wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

		this.FRONT_LEFT = 0;
		this.FRONT_RIGHT = 1;
		this.BACK_LEFT = 2;
		this.BACK_RIGHT = 3;

		this.wheels = [fl, fr, bl, br];

		this._addWheel(
			true,
			new Ammo.btVector3(
				this.wheelHalfTrackFront,
				this.wheelAxisHeightFront,
				this.wheelAxisFrontPosition
			),
			this.wheelRadiusFront
		);
		this._addWheel(
			true,
			new Ammo.btVector3(
				-this.wheelHalfTrackFront,
				this.wheelAxisHeightFront,
				this.wheelAxisFrontPosition
			),
			this.wheelRadiusFront
		);
		this._addWheel(
			false,
			new Ammo.btVector3(
				-this.wheelHalfTrackBack,
				this.wheelAxisHeightBack,
				this.wheelAxisPositionBack
			),
			this.wheelRadiusBack
		);
		this._addWheel(
			false,
			new Ammo.btVector3(
				this.wheelHalfTrackBack,
				this.wheelAxisHeightBack,
				this.wheelAxisPositionBack
			),
			this.wheelRadiusBack
		);
	}

	_addWheel(isFront, pos, radius) {
		const wheelInfo = this.vehicle.addWheel(
			pos,
			this.wheelDirectionCS0,
			this.wheelAxleCS,
			this.suspensionRestLength,
			radius,
			this.tuning,
			isFront
		);

		wheelInfo.set_m_maxSuspensionTravelCm(this.maxSuspensionTravelCm);
		wheelInfo.set_m_suspensionStiffness(this.suspensionStiffness);
		wheelInfo.set_m_wheelsDampingCompression(this.wheelsDampingCompression);
		wheelInfo.set_m_wheelsDampingRelaxation(this.wheelsDampingRelaxation);
		wheelInfo.set_m_frictionSlip(this.frictionSlip);
		wheelInfo.set_m_rollInfluence(this.rollInfluence);
		wheelInfo.set_m_maxSuspensionForce(100000);
	}

	_updateInputs(keys) {
		this.speed = this.vehicle.getCurrentSpeedKmHour();
		const relativeSteeringClamp =
			this.speed > 0
				? Math.min(
						(this.steeringClamp / Math.sqrt(Math.pow(this.speed, 3))) * this.steeringC +
							this.steeringK,
						this.steeringClamp
				  )
				: this.steeringClamp;

		this.breakingForce = 0;
		this.engineForce = 0;
		this.breakingForceBack = 0;
		this.breakingForceFront = 0;
		this.engineForceBack = 0;
		this.engineForceFront = 0;

		if (keys["KeyR"]) {
			this.vehicleModel.reset();
			this._reset(this.vehicleModel.main.rotation, this.vehicleModel.main.translation);
		}

		if (keys["KeyW"]) {
			this.breakingForce = 0;

			if (this.speed < -1) {
				this.breakingForce += Math.min(this.maxBreakingForce);
			} else if (this.speed < this.maxSpeed) {
				this.engineForce = this.maxEngineForce;
			}

			this.engineForceBack = this.engineForce / 2;
			this.engineForceFront = this.engineForce / 2;
			this.breakingForceFront = this.breakingForce / 2;
			this.breakingForceFront = this.breakingForce / 2;
		}
		if (keys["KeyS"]) {
			if (this.speed > 1 && this.breakingForce < this.maxBreakingForce) {
				this.breakingForce += Math.min(
					this.maxBreakingForce * Math.abs(Math.log(this.speed + 1) / 7),
					this.maxBreakingForce
				);
			} else {
				this.engineForce = -this.maxEngineForce / 2;
			}

			this.engineForceBack = this.engineForce / 2;
			this.engineForceFront = this.engineForce / 2;
			this.breakingForceFront = this.breakingForce / 2;
			this.breakingForceFront = this.breakingForce / 2;
		}

		if (keys["KeyA"]) {
			if (this.vehicleSteering < relativeSteeringClamp) {
				this.vehicleSteering += this.steeringIncrement;
			}
		}
		if (keys["KeyD"]) {
			if (this.vehicleSteering > -relativeSteeringClamp) {
				this.vehicleSteering -= this.steeringIncrement;
			}
		}
		if (!keys["KeyA"] && !keys["KeyD"]) {
			if (this.vehicleSteering < -this.steeringIncrement) {
				this.vehicleSteering += this.steeringIncrement;
			} else {
				if (this.vehicleSteering > this.steeringIncrement) {
					this.vehicleSteering -= this.steeringIncrement;
				} else {
					this.vehicleSteering = 0;
				}
			}
		}

		if (keys["Space"] && Math.abs(this.speed) > 1) {
			this.breakingForceBack = Math.min(
				this.maxBreakingForce * (Math.abs(this.speed) / 100),
				this.maxBreakingForce / 2
			);
		}
	}

	_updateForceBrakeSteering(dt) {
		this.airTimeCoolOffBack -= dt;
		this.airTimeCoolOffFront -= dt;

		if (
			!this.vehicle.getWheelInfo(this.FRONT_LEFT).m_raycastInfo.m_isInContact ||
			!this.vehicle.getWheelInfo(this.FRONT_RIGHT).m_raycastInfo.m_isInContact
		) {
			this.airTimeCoolOffFront = 0.5;
		}
		if (
			!this.vehicle.getWheelInfo(this.BACK_LEFT).m_raycastInfo.m_isInContact ||
			!this.vehicle.getWheelInfo(this.BACK_RIGHT).m_raycastInfo.m_isInContact
		) {
			this.airTimeCoolOffBack = 0.5;
		}

		if (this.airTimeCoolOffFront <= 0) {
			this.vehicle.applyEngineForce(this.engineForceFront / 2, this.FRONT_LEFT);
			this.vehicle.applyEngineForce(this.engineForceFront / 2, this.FRONT_RIGHT);
			this.vehicle.setBrake(this.breakingForceFront / 6, this.FRONT_LEFT);
			this.vehicle.setBrake(this.breakingForceFront / 6, this.FRONT_RIGHT);
		}

		if (this.airTimeCoolOffBack <= 0) {
			this.vehicle.applyEngineForce(this.engineForceBack / 2, this.BACK_LEFT);
			this.vehicle.applyEngineForce(this.engineForceBack / 2, this.BACK_RIGHT);

			this.vehicle.setBrake((2 * this.breakingForceBack) / 6, this.BACK_LEFT);
			this.vehicle.setBrake((2 * this.breakingForceBack) / 6, this.BACK_RIGHT);
		}

		this.vehicle.setSteeringValue(this.vehicleSteering, this.FRONT_LEFT);
		this.vehicle.setSteeringValue(this.vehicleSteering, this.FRONT_RIGHT);

		quat.setAxisAngle(this.steeringWheel.rotation, [0, 1, 0], this.vehicleSteering * 2 * Math.PI);

		this.steeringWheel.updateMatrix();
	}

	_updateWheels(dt) {
		let tm, p, q, i;
		const n = this.vehicle.getNumWheels();
		for (i = 0; i < n; i++) {
			this.vehicle.updateWheelTransform(i, true);
			tm = this.vehicle.getWheelTransformWS(i);
			p = tm.getOrigin();
			q = tm.getRotation();

			const globalRotationQuat = quat.set(quat.create(), q.x(), q.y(), q.z(), q.w());
			const globalTranslationVec = vec3.set(vec3.create(), p.x(), p.y(), p.z());
			this.wheels[i].translation = globalTranslationVec;
			this.wheels[i].rotation = globalRotationQuat;

			this.wheels[i].updateMatrix();
		}
	}

	_updateBody(dt) {
		const tm = this.vehicle.getChassisWorldTransform();
		const p = tm.getOrigin();
		const q = tm.getRotation();
		quat.set(this.model.rotation, q.x(), q.y(), q.z(), q.w());
		vec3.set(this.model.translation, p.x(), p.y(), p.z());
		this.model.updateMatrix();
	}

	update(dt, keys) {
		this._updateInputs(keys);
		this.vehicleModel.updateDashboard(this.speed, this.engineForce, this.breakingForce);
		this._updateForceBrakeSteering(dt);
		this._updateWheels(dt);
		this._updateBody(dt);
	}

	_reset(rotation, translation) {
		this.transform = new Ammo.btTransform();
		this.transform.setIdentity();

		this.transform.setOrigin(new Ammo.btVector3(translation[0], translation[1], translation[2]));
		this.transform.setRotation(
			new Ammo.btQuaternion(rotation[0], rotation[1], rotation[2], rotation[3])
		);

		this.body.clearForces();
		this.body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
		this.body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));

		this.body.setWorldTransform(this.transform);
	}
}
