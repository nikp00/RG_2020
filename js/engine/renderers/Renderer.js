import * as WebGL from "../WebGL.js";
import shaders from "../shaders/shaders.js";

const { mat4 } = glMatrix;

// This class prepares all assets for use with WebGL
// and takes care of rendering.

export default class Renderer {
	constructor(gl) {
		this.gl = gl;
		this.glObjects = new Map();
		this.programs = WebGL.buildPrograms(gl, shaders);

		gl.clearColor(1, 1, 1, 1);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
	}

	prepareBufferView(bufferView) {
		if (this.glObjects.has(bufferView)) {
			return this.glObjects.get(bufferView);
		}

		const buffer = new DataView(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

		const glBuffer = WebGL.createBuffer(this.gl, {
			target: bufferView.target,
			data: buffer,
		});
		this.glObjects.set(bufferView, glBuffer);
		return glBuffer;
	}

	prepareSampler(sampler) {
		if (this.glObjects.has(sampler)) {
			return this.glObjects.get(sampler);
		}

		const glSampler = WebGL.createSampler(this.gl, sampler);
		this.glObjects.set(sampler, glSampler);
		return glSampler;
	}

	prepareImage(image) {
		if (this.glObjects.has(image)) {
			return this.glObjects.get(image);
		}

		const glTexture = WebGL.createTexture(this.gl, { image });
		this.glObjects.set(image, glTexture);
		return glTexture;
	}

	prepareTexture(texture) {
		const gl = this.gl;

		this.prepareSampler(texture.sampler);
		const glTexture = this.prepareImage(texture.image);

		const mipmapModes = [
			gl.NEAREST_MIPMAP_NEAREST,
			gl.NEAREST_MIPMAP_LINEAR,
			gl.LINEAR_MIPMAP_NEAREST,
			gl.LINEAR_MIPMAP_LINEAR,
		];

		if (!texture.hasMipmaps && mipmapModes.includes(texture.sampler.min)) {
			gl.bindTexture(gl.TEXTURE_2D, glTexture);
			gl.generateMipmap(gl.TEXTURE_2D);
			texture.hasMipmaps = true;
		}
	}

	prepareMaterial(material) {
		if (material.baseColorTexture) {
			this.prepareTexture(material.baseColorTexture);
		}
		if (material.metallicRoughnessTexture) {
			this.prepareTexture(material.metallicRoughnessTexture);
		}
		if (material.normalTexture) {
			this.prepareTexture(material.normalTexture);
		}
		if (material.occlusionTexture) {
			this.prepareTexture(material.occlusionTexture);
		}
		if (material.emissiveTexture) {
			this.prepareTexture(material.emissiveTexture);
		}
	}

	preparePrimitive(primitive) {
		if (this.glObjects.has(primitive)) {
			return this.glObjects.get(primitive);
		}

		this.prepareMaterial(primitive.material);

		const gl = this.gl;
		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);
		if (primitive.indices) {
			const bufferView = primitive.indices.bufferView;
			bufferView.target = gl.ELEMENT_ARRAY_BUFFER;
			const buffer = this.prepareBufferView(bufferView);
			gl.bindBuffer(bufferView.target, buffer);
		}

		// this is an application-scoped convention, matching the shader
		const attributeNameToIndexMap = {
			POSITION: 0,
			TEXCOORD_0: 1,
			NORMAL: 2,
		};

		for (const name in primitive.attributes) {
			const accessor = primitive.attributes[name];
			const bufferView = accessor.bufferView;
			const attributeIndex = attributeNameToIndexMap[name];

			if (attributeIndex !== undefined) {
				bufferView.target = gl.ARRAY_BUFFER;
				const buffer = this.prepareBufferView(bufferView);
				gl.bindBuffer(bufferView.target, buffer);
				gl.enableVertexAttribArray(attributeIndex);
				gl.vertexAttribPointer(
					attributeIndex,
					accessor.numComponents,
					accessor.componentType,
					accessor.normalized,
					bufferView.byteStride,
					accessor.byteOffset
				);
			}
		}

		this.glObjects.set(primitive, vao);
		return vao;
	}

	prepareMesh(mesh) {
		for (const primitive of mesh.primitives) {
			this.preparePrimitive(primitive);
		}
	}

	prepareNode(node) {
		if (node.mesh) {
			this.prepareMesh(node.mesh);
		}
		for (const child of node.children) {
			this.prepareNode(child);
		}
	}

	prepareScene(scene) {
		for (const node of scene.nodes) {
			this.prepareNode(node);
		}
	}

	getViewProjectionMatrix(camera) {
		const mvpMatrix = mat4.clone(camera.matrix);
		let parent = camera.parent;
		while (parent) {
			mat4.mul(mvpMatrix, parent.matrix, mvpMatrix);
			parent = parent.parent;
		}
		mat4.invert(mvpMatrix, mvpMatrix);
		mat4.mul(mvpMatrix, camera.camera.matrix, mvpMatrix);
		return mvpMatrix;
	}

	getViewMatrix(camera) {
		const viewMatrix = mat4.invert(mat4.create(), camera.getGlobalTransform());
		return viewMatrix;
	}

	render(scene, camera) {
		const gl = this.gl;

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		this.renderSkyBox(scene.skyBox, camera);

		const program = this.programs.simple;
		gl.useProgram(program.program);
		gl.uniform1i(program.uniforms.uTexture, 0);

		const mvpMatrix = this.getViewProjectionMatrix(camera);
		const viewMatrix = this.getViewMatrix(camera);
		const viewPosition = camera.getGlobalTranslation();

		const spotLightPosition = scene.spotLights.map((x) => x.node.getGlobalTranslation());

		const spotLightDirection = scene.spotLights.map((x) => x.getGlobalDirection());

		const pointLightPosition = scene.pointLights.map((x) => x.node.getGlobalTranslation());

		for (const node of scene.nodes) {
			this.renderNode(
				node,
				mvpMatrix,
				viewMatrix,
				viewPosition,
				spotLightDirection,
				spotLightPosition,
				pointLightPosition,
				scene
			);
		}
	}

	renderNode(
		node,
		mvpMatrix,
		viewMatrix,
		viewPosition,
		spotLightDirection,
		spotLightPosition,
		pointLightPosition,
		scene
	) {
		const gl = this.gl;

		const worldMatrix = node.getGlobalTransform();
		mvpMatrix = mat4.clone(mvpMatrix);
		mat4.mul(mvpMatrix, mvpMatrix, node.matrix);

		if (node.mesh) {
			const program = this.programs.simple;
			gl.uniformMatrix4fv(program.uniforms.uMvpMatrix, false, mvpMatrix);
			gl.uniformMatrix4fv(program.uniforms.uWorldMatrix, false, worldMatrix);
			gl.uniform3fv(program.uniforms["viewPosition"], viewPosition);

			// Ambient light
			if (scene.ambientLight) {
				gl.uniform3fv(program.uniforms["uAmbientLight.intensity"], scene.ambientLight.intensity);
			}

			// Directional Light aka. sunlight
			if (scene.directionalLight) {
				gl.uniform3fv(
					program.uniforms["uDirectionalLight.diffuse"],
					scene.directionalLight.diffuse
				);
				gl.uniform3fv(
					program.uniforms["uDirectionalLight.direction"],
					scene.directionalLight.direction
				);
				gl.uniform3fv(
					program.uniforms["uDirectionalLight.specular"],
					scene.directionalLight.specular
				);
			}

			// Spot light aka. car headlights;
			if (scene.spotLights) {
				const activeSpotLights = scene.spotLights.filter((x) => x.isActive);
				for (let i = 0; i < activeSpotLights.length; i++) {
					gl.uniform3fv(program.uniforms[`uSpotLight[${i}].position`], spotLightPosition[i]);
					gl.uniform3fv(program.uniforms[`uSpotLight[${i}].direction`], spotLightDirection[i]);
					gl.uniform3fv(program.uniforms[`uSpotLight[${i}].diffuse`], activeSpotLights[i].diffuse);
					gl.uniform3fv(
						program.uniforms[`uSpotLight[${i}].specular`],
						activeSpotLights[i].specular
					);
					gl.uniform3fv(
						program.uniforms[`uSpotLight[${i}].attenuation`],
						activeSpotLights[i].attenuation
					);
					gl.uniform1f(
						program.uniforms[`uSpotLight[${i}].innerCutOff`],
						activeSpotLights[i].innerCutOff
					);
					gl.uniform1f(
						program.uniforms[`uSpotLight[${i}].outerCutOff`],
						activeSpotLights[i].outerCutOff
					);
					gl.uniform1f(program.uniforms[`uSpotLight[${i}].cutOff`], activeSpotLights[i].cutOff);
				}
				gl.uniform1i(program.uniforms["uNumberOfSpotlights"], activeSpotLights.length);
			}

			// Point light
			if (scene.pointLights.length > 0) {
				const activePointLights = scene.pointLights.filter((x) => x.isActive);
				for (let i = 0; i < activePointLights.length; i++) {
					if (!activePointLights[i].isActive) {
						continue;
					}
					gl.uniform3fv(program.uniforms[`uPointLight[${i}].position`], pointLightPosition[i]);
					gl.uniform3fv(
						program.uniforms[`uPointLight[${i}].diffuse`],
						activePointLights[i].diffuse
					);
					gl.uniform3fv(
						program.uniforms[`uPointLight[${i}].specular`],
						activePointLights[i].specular
					);
					gl.uniform3fv(
						program.uniforms[`uPointLight[${i}].attenuation`],
						activePointLights[i].attenuation
					);
				}

				gl.uniform1i(program.uniforms["uNumberOfPointLights"], activePointLights.length);
			}

			for (const primitive of node.mesh.primitives) {
				this.renderPrimitive(primitive);
			}
		}

		for (const child of node.children) {
			this.renderNode(
				child,
				mvpMatrix,
				viewMatrix,
				viewPosition,
				spotLightDirection,
				spotLightPosition,
				pointLightPosition,
				scene
			);
		}
	}

	renderSkyBox(skyBox, camera) {
		const gl = this.gl;

		const program = this.programs.skyBox;
		gl.useProgram(program.program);
		gl.uniform1i(program.uniforms.uTexture, 0);

		const mvpMatrix = this.getViewProjectionMatrix(camera);
		mat4.mul(mvpMatrix, mvpMatrix, skyBox.matrix);
		gl.uniformMatrix4fv(program.uniforms.uMvpMatrix, false, mvpMatrix);

		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		for (const primitive of skyBox.mesh.primitives) {
			this.renderPrimitive(primitive);
		}
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	}

	renderPrimitive(primitive) {
		const gl = this.gl;

		const vao = this.glObjects.get(primitive);
		const material = primitive.material;
		const texture = material.baseColorTexture;
		const glTexture = this.glObjects.get(texture.image);
		const glSampler = this.glObjects.get(texture.sampler);

		gl.bindVertexArray(vao);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, glTexture);
		gl.bindSampler(0, glSampler);

		if (primitive.indices) {
			const mode = primitive.mode;
			const count = primitive.indices.count;
			const type = primitive.indices.componentType;
			gl.drawElements(mode, count, type, 0);
		} else {
			const mode = primitive.mode;
			const count = primitive.attributes.POSITION.count;
			gl.drawArrays(mode, 0, count);
		}
	}
}
