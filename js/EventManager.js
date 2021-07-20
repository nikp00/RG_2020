export default class EventManager {
	constructor() {
		this.keys = {};
		this.keysSticky = {};
		this.scroll = 0;
		document.addEventListener("keydown", this._keyDown.bind(this));
		document.addEventListener("keyup", this._keyUp.bind(this));
		document.addEventListener("wheel", this._scroll.bind(this));
	}

	_keyDown(e) {
		this.keys[e.code] = true;
	}
	_keyUp(e) {
		this.keys[e.code] = false;
		this.keysSticky[e.code] = true;
	}

	_scroll(e) {
		this.scroll = e.wheelDeltaY;
	}

	checkStickyKey(key) {
		const sticky = this.keysSticky[key];
		this.keysSticky[key] = false;
		return sticky;
	}
}
