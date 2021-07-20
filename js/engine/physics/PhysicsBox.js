import { physicsObjectTypes, PhysicsObject } from "./PhysicsObject.js";
const { vec3, quat } = glMatrix;
export default class PhysicsBox extends PhysicsObject {
	constructor(model, mass, friction, physicsWorld) {
		super(model, mass, friction, physicsObjectTypes.static_box);
		this.body.setFriction(this.friction);
		if (this.mass > 0) {
			this.body.setActivationState(4);
		}
		physicsWorld.addRigidBody(this.body);
	}

	update() {
		if (this.mass > 0) {
			const motionState = this.body.getMotionState();
			if (motionState) {
				const transformMatrix = new Ammo.btTransform();
				motionState.getWorldTransform(transformMatrix);
				const p = transformMatrix.getOrigin();
				const q = transformMatrix.getRotation();

				quat.set(this.model.rotation, q.x(), q.y(), q.z(), q.w());
				vec3.set(this.model.translation, p.x(), p.y(), p.z());
				this.model.updateMatrix();
			}
		}
	}
}
