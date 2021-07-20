import Sampler from "./Sampler.js";

export default class Texture {
	constructor(options = {}) {
		this.image = options.image || null;
		this.sampler = options.sampler || new Sampler();
		this.hasMipmaps = false;
	}
}
