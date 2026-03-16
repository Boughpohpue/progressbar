class ColorHelper {
	static decToHex(dec) {
		return dec.toString(16).padStart(2, "0");
	}	
	static hexToDec(hex) {
		return parseInt(hex, 16);
	}	
	static toHexColor(r, g, b) {
		return `#${ColorHelper.decToHex(r)}${ColorHelper.decToHex(g)}${ColorHelper.decToHex(b)}`;
	}
	static toDecRGB(hex) {
		hex = hex.startsWith('#') ? hex.substring(1) : hex;
		let rgb = [];
		for (var x = 0; x <= hex.length - 1; x += 2)
			rgb.push(parseInt(hex.substring(x, x + 2), 16));
		return rgb;
	}
	static getChannelValue(percent, min = 0, max = 255) {
		min = Math.max(min, 0);
		max = Math.min(max, 255);
		return min < max 
			? min + Math.round(Math.floor((max - min) * percent))
			: min - Math.round(Math.floor((min - max) * percent));
	}
}

class ProgressBar {
	#id;
	#value = 0;
	#minVal = 0;
	#maxVal = 100;
	#smallStep = 1;
	#largeStep = 10;
	#displayMode = 0; // 0 - none, 1 - value, 2 - percent, 3 - value and percent
	#looped = false;
	#reverse = false;
	#showRange = false;
	#showBoxed = false;
	#minColor = "#ffff00";
	#maxColor = "#00ff00";
	#onCompleteListeners = new Set();
	#onIterationListeners = new Set();
	
	#containerElement = null;
	#progressBarElement = null;
	#progressInfoElement = null;
	#progressInputElement = null;
	#minMaxValuesElement = null;
	#minValueElement = null;
	#maxValueElement = null;
	
	constructor(id, minVal = 0, maxVal = 100) {
		if (minVal === maxVal) throw new Error("Min and Max must not be equals!");
		this.#id = id;
		this.#reverse = minVal > maxVal;
		this.#minVal = Math.min(minVal, maxVal);
		this.#maxVal = Math.max(minVal, maxVal);
		this.#value = this.#minVal;
		this.#largeStep = (this.#maxVal - this.#minVal) * 0.1;
		this.#smallStep = this.#largeStep * 0.1;
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

	get showRange() { return this.#showRange; }
	set showRange(val) { 
		if (this.#showRange == val) return;
		this.#showRange = val == true;
		this.#updateMinMaxDisplay();
	}

	get showBoxed() { return this.#showBoxed; }
	set showBoxed(val) { 
		if (this.#showBoxed == val) return;
		this.#showBoxed = val == true;
		this.#updateBoxedDisplay();
	}
	
	get displayMode() { return this.#displayMode; }
	set displayMode(val) { this.#displayMode = val; }
	
	get value() { return this.#value; }
	set value(val) { this.setValue(val); }

	get minColorHex() { return this.#minColor; }
	set minColorHex(val) { this.#minColor = val; }	
	get maxColorHex() { return this.#maxColor; }
	set maxColorHex(val) { this.#maxColor = val; }
	
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
	
	get largeStep() { return this.#largeStep; }
	set largeStep(val) { 
		if (val == 0) return;
		if (val > this.range) return;
		this.#largeStep = val;
	}
	
	get smallStep() { return this.#smallStep; }
	set smallStep(val) { 
		if (val == 0) return;
		if (val > this.range) return;
		this.#smallStep = val;
	}		
		
	setValue(val) {
		if (val == this.value) return;
		else if (val < this.min) {
			if (!this.looped) return;
			val = this.max;
		}
		else if (val > this.max) {
			if (!this.looped) return;
			val = this.min;
		}
		
		this.#value = val;
		this.#updateValue();
		this.#invokeListeners();
	}
	
	increase() { this.setValue(this.value + this.smallStep); }
	increaseLarge() { this.setValue(this.value + this.largeStep); }
	
	decrease() { this.setValue(this.value - this.smallStep); }
	decreaseLarge() { this.setValue(this.value - this.largeStep); }
	
	tick() { 
		if (this.reverse == true) this.decrease();
		else this.increase();
	}
	
	appendElement(targetElement = undefined) {
		if (this.#containerElement) return;
		
		const targetEl = (targetElement ?? document.body);
		
		const containerEl = document.createElement('div');
		containerEl.id = `${this.#id}_wrapper`;
		containerEl.className = "progress-bar";
		if (this.#showBoxed)
			containerEl.classList.add("boxed");
		
		
		const progressInputEl = document.createElement('input');
		progressInputEl.id = `${this.#id}`;
		progressInputEl.type = "hidden";
		progressInputEl.value = `${this.#value}`;
		
		const progressBarEl = document.createElement('div');
		progressBarEl.className = "progress";
		progressBarEl.style.cssText = this.#getProgressStyle();
		
		const progressValueEl = document.createElement('div');
		progressValueEl.className = "info";
		progressValueEl.innerText = this.#getDisplayText();	
		
		const progressTrackEl = document.createElement('div');
		progressTrackEl.className = "track";
		
		this.#progressInputElement = progressTrackEl.appendChild(progressInputEl);
		this.#progressBarElement = progressTrackEl.appendChild(progressBarEl);
		this.#progressInfoElement = progressTrackEl.appendChild(progressValueEl);
		
		
		const minValEl = document.createElement('span');
		minValEl.innerText = `${this.min}`;
		const maxValEl = document.createElement('span');
		maxValEl.innerText = `${this.max}`;

		const minMaxValuesEl = document.createElement('div');
		minMaxValuesEl.className = "values";
		minMaxValuesEl.style.cssText = this.#showRange ? "display: flex" : "display: none";
		
		this.#minValueElement = minMaxValuesEl.appendChild(minValEl);
		this.#maxValueElement = minMaxValuesEl.appendChild(maxValEl);
		
		
		containerEl.appendChild(progressTrackEl);
		this.#minMaxValuesElement = containerEl.appendChild(minMaxValuesEl);
		this.#containerElement = targetEl.appendChild(containerEl);
	
		return this.#containerElement;
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
		this.#minMaxValuesElement.style.display = this.#showRange ? "flex" : "none";
	}

	#updateBoxedDisplay() {
		if (!this.#containerElement) return;
		this.#containerElement.classList.toggle("boxed");
	}
	
	#getValueText() {
		return this.#smallStep % 1 == 0 ? `${this.value}` : `${this.value.toFixed(2)}`;
	}
	
	#getDisplayText() {
		switch (this.#displayMode) {
			case 1:
				return this.#getValueText();
			case 2:
				return `${this.percent}%`;
			case 3:
				return `${this.#getValueText()} (${this.percent}%)`;
			case 0:
			default:
				return '';
		}
	}
	
	#getProgressStyle() {
		const minRGB = ColorHelper.toDecRGB(this.#minColor);
		const maxRGB = ColorHelper.toDecRGB(this.#maxColor);
		const r = ColorHelper.getChannelValue(this.progress, minRGB[0], maxRGB[0]);
		const g = ColorHelper.getChannelValue(this.progress, minRGB[1], maxRGB[1]);
		const b = ColorHelper.getChannelValue(this.progress, minRGB[2], maxRGB[2]);
		
		var bg_color = `background: ${this.#minColor};`;
		var bg_gradient = `background: linear-gradient(90deg,rgba(${minRGB[0]}, ${minRGB[1]}, ${minRGB[2]}, 1) 0%, rgba(${r}, ${g}, ${b}, 1) 100%);`;
		var width = `width: ${this.percent}%;`;
		
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
