import { physicsObjectTypes, PhysicsObject } from "./PhysicsObject.js";
export default class PhysicsMesh extends PhysicsObject {
	constructor(model, mass, friction, physicsWorld) {
		super(model, mass, friction, physicsObjectTypes.static_mesh);
		physicsWorld.addRigidBody(this.body);
	}
}
