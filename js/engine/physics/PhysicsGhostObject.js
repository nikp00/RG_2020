export default class PhysicsGhostObject {
	constructor(model, physicsWorld) {
		this.model = model;
		this.w = model.whl[0];
		this.h = model.whl[1];
		this.l = model.whl[2];

		this.geometry = new Ammo.btBoxShape(
			new Ammo.btVector3(this.w * 0.5, this.h * 0.5, this.l * 0.5)
		);

		this.transform = new Ammo.btTransform();
		this.transform.setIdentity();

		this.transform.setOrigin(
			new Ammo.btVector3(
				this.model.translation[0],
				this.model.translation[1],
				this.model.translation[2]
			)
		);
		this.transform.setRotation(
			new Ammo.btQuaternion(
				this.model.rotation[0],
				this.model.rotation[1],
				this.model.rotation[2],
				this.model.rotation[3]
			)
		);

		this.body = new Ammo.btGhostObject();
		this.body.setCollisionShape(this.geometry);
		this.body.setWorldTransform(this.transform);
		this.body.setCollisionFlags(4);

		physicsWorld.addCollisionObject(this.body);
		physicsWorld
			.getBroadphase()
			.getOverlappingPairCache()
			.setInternalGhostPairCallback(new Ammo.btGhostPairCallback());
	}

	update() {}
}
