export const physicsObjectTypes = {
	static_mesh: 0,
	static_box: 1,
	vehicle: 2,
};
export class PhysicsObject {
	constructor(model, mass, friction, type) {
		this.model = model;
		this.w = model.whl[0];
		this.h = model.whl[1];
		this.l = model.whl[2];

		switch (type) {
			case 0:
				this.geometry = this._makeShapeFromVertexData();
				break;
			case 1:
				this.geometry = new Ammo.btBoxShape(
					new Ammo.btVector3(this.w * 0.5, this.h * 0.5, this.l * 0.5)
				);
				break;
			case 2:
				this.geometry = new Ammo.btBoxShape(
					new Ammo.btVector3(this.w * 0.5, this.h * 0.5, this.l * 0.5)
				);
				break;
		}

		this.friction = friction || 0;
		this.mass = mass || 0;

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

		this.motionState = new Ammo.btDefaultMotionState(this.transform);
		this.localInertia = new Ammo.btVector3(0, 0, 0);
		this.geometry.calculateLocalInertia(this.mass, this.localInertia);
		this.rbInfo = new Ammo.btRigidBodyConstructionInfo(
			this.mass,
			this.motionState,
			this.geometry,
			this.localInertia
		);
		this.body = new Ammo.btRigidBody(this.rbInfo);
	}

	_makeShapeFromVertexData() {
		const indexOffset = this.model.mesh.primitives[0].indices.bufferView.byteOffset / 2;
		const indexLength = this.model.mesh.primitives[0].indices.bufferView.byteLength / 2;
		const index = new Uint16Array(this.model.mesh.primitives[0].indices.bufferView.buffer);

		const position = new Float32Array(
			this.model.mesh.primitives[0].attributes.POSITION.bufferView.buffer
		);
		const positionOffset =
			this.model.mesh.primitives[0].attributes.POSITION.bufferView.byteOffset / 4;
		const positionLength =
			this.model.mesh.primitives[0].attributes.POSITION.bufferView.byteLength / 4;

		const trimesh = new Ammo.btTriangleMesh(true, true);
		for (let i = 0; i < indexLength; i += 3) {
			let j = 0;
			const vertexes = [];
			while (j < 3) {
				let ind = index[indexOffset + i + j] * 3;
				vertexes.push(
					new Ammo.btVector3(
						position[positionOffset + ind],
						position[positionOffset + ind + 1],
						position[positionOffset + ind + 2]
					)
				);
				j++;
			}
			trimesh.addTriangle(vertexes[0], vertexes[1], vertexes[2]);
		}
		return new Ammo.btBvhTriangleMeshShape(trimesh, true, true);
	}

	update() {}
}
