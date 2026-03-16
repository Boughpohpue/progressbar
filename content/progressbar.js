class DisplayMode extends Enum {
	static NONE = new DisplayMode();
  static VALUE = new DisplayMode();
  static PERCENT = new DisplayMode();
  static COMBINED = new DisplayMode();
  static { this.seal(); }
}

class ProgressBar {
	#id;
	#value = 0;
	#minVal = 0;
	#maxVal = 100;
	#tickSize = 1;
	#looped = false;
	#reverse = false;
	#showBoxed = false;
	#showRange = false;
	#minColor = "#ffff00";
	#maxColor = "#00ff00";

	#displayMode = DisplayMode.NONE;

	#onCompleteListeners = new Set();
	#onIterationListeners = new Set();

	#containerElement = null;
	#progressBarElement = null;
	#progressInfoElement = null;
	#progressInputElement = null;
	#rangeValuesElement = null;
	#minValueElement = null;
	#maxValueElement = null;

	#inputValueObserver = null;

	constructor(id, minVal = 0, maxVal = 100) {
		if (minVal === maxVal) throw new Error("Min and Max must not be equals!");
		this.#id = id;
		this.#reverse = minVal > maxVal;
		this.#minVal = Math.min(minVal, maxVal);
		this.#maxVal = Math.max(minVal, maxVal);
		this.#value = this.#minVal;
		this.#tickSize = (this.#maxVal - this.#minVal) * 0.01;
	}

	addOnCompletedListener(listener) {
		if (typeof(listener) !== 'function')
			throw new Error("Listener must be a function!");
		this.#onCompleteListeners.add(listener);
	}
	addOnNewIterationListener(listener) {
		if (typeof(listener) !== 'function')
			throw new Error("Listener must be a function!");
		this.#onIterationListeners.add(listener);
	}


	get reverse() { return this.#reverse; }
	set reverse(val) { this.#reverse = val == true; }

	get looped() { return this.#looped; }
	set looped(val) { this.#looped = val == true; }

	get showBoxed() { return this.#showBoxed; }
	set showBoxed(val) {
		if (this.#showBoxed == val) return;
		this.#showBoxed = val == true;
		this.#updateBoxedDisplay();
	}

	get showRange() { return this.#showRange; }
	set showRange(val) {
		if (this.#showRange == val) return;
		this.#showRange = val == true;
		this.#updateMinMaxDisplay();
	}

	get value() { return this.#value; }
	set value(val) { this.setValue(val); }

	get displayMode() { return this.#displayMode; }
	set displayMode(val) { this.#displayMode = val; }

	get minColor() { return this.#minColor; }
	set minColor(val) { this.#minColor = val instanceof NamedColor ? val.value.hexRgb : new Color(val).hexRgb; }

	get maxColor() { return this.#maxColor; }
	set maxColor(val) { this.#maxColor = val instanceof NamedColor ? val.value.hexRgb : new Color(val).hexRgb; }

	get min() { return this.#minVal; }
	set min(val) {
		if (val == this.min) return;
		if (val >= this.max) return;
		if (this.value < val) this.setValue(val);
		this.#minVal = val;
		this.#updateMinMax();
	}

	get max() { return this.#maxVal; }
	set max(val) {
		if (val == this.max) return;
		if (val <= this.min) return;
		if (this.value > val) this.setValue(val);
		this.#maxVal = val;
		this.#updateMinMax();
	}

	get isMin() { return this.value == this.min; }
	get isMax() { return this.value == this.max; }
	get range() { return this.max - this.min; }
	get progress() { return (this.value - this.min) / this.range; }
	get percent() { return Math.round(this.progress * 100); }

	get tickSize() { return this.#tickSize; }
	set tickSize(val) {
		if (val == 0) return;
		if (val > this.range) return;
		this.#tickSize = val;
	}

	setValue(val) {
		if (val == this.value) return;
		else if (val < this.min) {
			val = this.looped ? this.max : this.min;
		}
		else if (val > this.max) {
			val = this.looped ? this.min : this.max;
		}

		this.#value = val;
		this.#updateValue();
		this.#invokeListeners();
	}

	increase() { this.setValue(this.value + this.tickSize); }
	decrease() { this.setValue(this.value - this.tickSize); }
	tick() { return this.reverse ? this.decrease() : this.increase(); }

	discard() {
		clearInterval(this.#inputValueObserver);
	}

	appendElement(targetElement = undefined) {
		if (this.#containerElement) return;

		const containerEl = document.createElement('div');
		containerEl.id = `${this.#id}_wrapper`;
		containerEl.className = "progress-bar";
		if (this.#showBoxed) containerEl.classList.add("boxed");

		const progressTrackEl = document.createElement('div');
		progressTrackEl.className = "track";

		const progressInputEl = document.createElement('input');
		progressInputEl.id = `${this.#id}`;
		progressInputEl.type = "hidden";
		progressInputEl.value = `${this.#value}`;
		this.#progressInputElement = progressTrackEl.appendChild(progressInputEl);

		const progressBarEl = document.createElement('div');
		progressBarEl.className = "progress";
		progressBarEl.style.cssText = this.#getProgressStyle();
		this.#progressBarElement = progressTrackEl.appendChild(progressBarEl);

		const progressValueEl = document.createElement('div');
		progressValueEl.className = "info";
		progressValueEl.innerText = this.#getDisplayText();
		this.#progressInfoElement = progressTrackEl.appendChild(progressValueEl);

		const rangeValuesEl = document.createElement('div');
		rangeValuesEl.className = "range";
		rangeValuesEl.style.cssText = this.#showRange ? "display: flex" : "display: none";

		const minValEl = document.createElement('span');
		minValEl.innerText = `${this.min}`;
		this.#minValueElement = rangeValuesEl.appendChild(minValEl);

		const maxValEl = document.createElement('span');
		maxValEl.innerText = `${this.max}`;
		this.#maxValueElement = rangeValuesEl.appendChild(maxValEl);

		containerEl.appendChild(progressTrackEl);
		this.#rangeValuesElement = containerEl.appendChild(rangeValuesEl);

		const targetEl = (targetElement ?? document.body);
		this.#containerElement = targetEl.appendChild(containerEl);

		this.#inputValueObserver = setInterval(() => { this.#checkInputValue(); }, 69);

		return this.#containerElement;
	}

	#checkInputValue() {
		const inputValue = parseFloat(this.#progressInputElement.value);
		if (inputValue != this.value) {
			this.setValue(inputValue);
		}
	}

	#updateValue() {
		if (!this.#containerElement) return;
		this.#progressInputElement.value = `${this.#value}`;
		this.#progressBarElement.style.cssText = this.#getProgressStyle();
		this.#progressInfoElement.innerText = this.#getDisplayText();
	}

	#updateMinMax() {
		if (!this.#containerElement) return;
		this.#minValueElement.innerText = `${this.min}`;
		this.#maxValueElement.innerText = `${this.max}`;
	}

	#updateMinMaxDisplay() {
		if (!this.#containerElement) return;
		this.#rangeValuesElement.style.display = this.#showRange ? "flex" : "none";
	}

	#updateBoxedDisplay() {
		if (!this.#containerElement) return;
		this.#containerElement.classList.toggle("boxed");
	}

	#getValueText() {
		return this.#tickSize % 1 == 0 ? `${this.value}` : `${this.value.toFixed(2)}`;
	}

	#getDisplayText() {
		switch (this.#displayMode) {
			case DisplayMode.VALUE:
				return this.#getValueText();
			case DisplayMode.PERCENT:
				return `${this.percent}%`;
			case DisplayMode.COMBINED:
				return `${this.#getValueText()} (${this.percent}%)`;
			case DisplayMode.NONE:
			default:
				return '';
		}
	}

	#getProgressStyle() {
		const minRGB = ColorHelper.hex2rgb(this.#minColor);
		const curRGB = ColorHelper.calculateColorTransitRgb(this.#minColor, this.#maxColor, this.progress);
		var width = `width: ${this.percent}%;`;
		var bg_color = `background: ${this.#minColor};`;
		var bg_gradient = `background: linear-gradient(90deg,rgba(${minRGB[0]}, ${minRGB[1]}, ${minRGB[2]}, 1) 0%, rgba(${curRGB[0]}, ${curRGB[1]}, ${curRGB[2]}, 1) 100%);`;

		return `${width} ${bg_color} ${bg_gradient}`;
	}

	#invokeListeners() {
		if ((this.reverse == true && this.isMin) || (this.reverse == false && this.isMax)) {
			for (const fn of this.#onCompleteListeners) fn();
		}
		if ((this.reverse == true && this.isMax) || (this.reverse == false && this.isMin)) {
			for (const fn of this.#onIterationListeners) fn();
		}
	}
}
