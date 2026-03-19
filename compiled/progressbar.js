(() => {
  try {
      var test = {} instanceof Enum;
  }
  catch {
    console.warn("Required type missing: Enum. Please include 'https://boughpohpue.github.io/artifactory/js/enum/1.0.1/enum.js'.");
  }
  try {
      var test = ColorHelper.resolveColor(NamedColor.White);
  }
  catch {
    console.warn("Required library missing: ColorJS. Please include 'https://boughpohpue.github.io/artifactory/js/color/1.0.1/colorjs.js'.");
  }
})();

class ValueUpdateResult extends Enum {
  static NONE = new ValueUpdateResult();
  static NORMAL = new ValueUpdateResult();
  static MINIMUM = new ValueUpdateResult();
  static MAXIMUM = new ValueUpdateResult();
  static NEWLOOP = new ValueUpdateResult();
  static { this.seal(); }
}

class ValueDisplayMode extends Enum {
	static NONE = new ValueDisplayMode();
  static VALUE = new ValueDisplayMode();
  static PERCENT = new ValueDisplayMode();
  static COMBINED = new ValueDisplayMode();
  static { this.seal(); }
}

class PbOptions {
	constructor() {
    this.elementId = undefined;
    this.elementWidth = undefined;
    this.elementHeight = undefined;
    this.trackBgColor = undefined;
    this.boxBgColor = undefined;
    this.tickSize = undefined;
    this.value = undefined;
    this.precision = 0;
    this.minValue = 0;
		this.maxValue = 100;
    this.isBoxed = false;
    this.isLooped = false;
    this.showRuler = false;
		this.minColor = NamedColor.Gold;
		this.maxColor = NamedColor.Lime;

    this.displayMode = ValueDisplayMode.NONE;
    this.onChangedListener = null;
    this.onCompletedListener = null;
    this.onIterationListener = null;
  }

  withId(id) {
    this.elementId = id;
    return this;
  }
  withWidth(val) {
    this.elementWidth = `${parseFloat(val)}`.length === `${val}`.length
      ? `${val}px`
      : val;
    return this;
  }
  withHeight(val) {
    this.elementHeight = `${parseFloat(val)}`.length === `${val}`.length
      ? `${val}px`
      : val;
    return this;
  }
  withTrackBgColor(color) {
    this.trackBgColor = color
    return this;
  }
  withBoxBgColor(color) {
    this.boxBgColor = color;
    return this;
  }
	withTickSize(val) {
    this.tickSize = val;
    return this;
  }
  withValue(val) {
    this.value = val;
    return this;
  }
  withPrecision(val) {
    this.precision = val;
    return this;
  }
  withMin(val) {
    this.minValue = val;
    return this;
  }
	withMax(val) {
    this.maxValue = val;
    return this;
  }
	withMinColor(color) {
    this.minColor = color;
    return this;
  }
	withMaxColor(color) {
    this.maxColor = color;
    return this;
  }
	looped(looped = true) {
    this.isLooped = looped;
    return this;
  }
	boxed() {
    this.isBoxed = true;
    return this;
  }
	withRuler() {
    this.showRuler = true;
    return this;
  }
	withDisplayMode(mode) {
    this.displayMode = mode;
    return this;
  }
  withOnChanged(listener) {
    this.onChangedListener = listener;
    return this;
  }
  withOnCompleted(listener) {
    this.onCompletedListener = listener;
    return this;
  }
  withOnIteration(listener) {
    this.onIterationListener = listener;
    return this;
  }
  sealed(printInfo = false) {
    if (Object.isFrozen(this)) return this;
    if (printInfo) console.log(this.getInfo());
    return Object.freeze(this);
  }
  getInfo() {
    let cfgInfo = [`${this.constructor.name}:`];
    for (const [key, value] of Object.entries(this)) {
      cfgInfo.push(`${key}: ${value?.value ?? value ?? ""} ${value?.name ?? ""}`);
    }
    return cfgInfo.join('\n');
  }
  static create() {
    return new PbOptions();
  }
}

class ProgressValue {
	#value = 0;
	#minValue = 0;
	#maxValue = 100;
  #tickSize = 1;
  #precision = 0;
  #looped = false;
  #reversed = false;

	constructor(opts) {
    this.#looped = opts.isLooped;
    this.#reversed = opts.minValue > opts.maxValue;
		this.#minValue = Math.min(opts.minValue, opts.maxValue);
		this.#maxValue = Math.max(opts.minValue, opts.maxValue);
    this.#tickSize = (opts.tickSize ?? ((this.#maxValue - this.#minValue) * 0.01));
		this.#value = (opts.value ?? (this.#reversed ? this.#maxValue : this.#minValue));
    this.#precision = opts.precision;
	}

	get value() { return parseFloat(`${this.#value.toFixed(this.#precision)}`); }
	get minValue() { return parseFloat(`${this.#minValue.toFixed(this.#precision)}`); }
	get maxValue() { return parseFloat(`${this.#maxValue.toFixed(this.#precision)}`); }
	get isMin() { return this.#compare(this.#value, this.#minValue) === 0; }
	get isMax() { return this.#compare(this.#value, this.#maxValue) === 0; }
	get range() { return this.#maxValue - this.#minValue; }
	get progress() { return (this.#value - this.#minValue) / this.range; }
	get percent() { return Math.round(this.progress * 100); }
  get looped() { return this.#looped; }
  get reversed() { return this.#reversed; }
  get percentText() { return `${this.percent}%`; }
  get valueText() { return `${this.#value.toFixed(this.#precision)}`; }

  setValue(val) {
    if (typeof val !== "number") throw new Error("Provided value is of invalid type!");
    if (this.#compare(val, this.#value) === 0) return ValueUpdateResult.NONE;
		if (this.#compare(val, this.#minValue) === -1 ) {
      if (!this.#looped) return ValueUpdateResult.NONE;
      this.#value = this.#maxValue;
      return ValueUpdateResult.NEWLOOP;
    }
    if (this.#compare(val, this.#maxValue) === 1 ) {
      if (!this.#looped) return ValueUpdateResult.NONE;
      this.#value = this.#minValue;
      return ValueUpdateResult.NEWLOOP;
    }
		this.#value = val;
    return this.isMin
      ? ValueUpdateResult.MINIMUM
      : this.isMax
        ? ValueUpdateResult.MAXIMUM
        : ValueUpdateResult.NORMAL;
	}

  increase() { return this.setValue(this.#value + this.#tickSize); }
	decrease() { return this.setValue(this.#value - this.#tickSize); }
	tick() { return this.#reversed ? this.decrease() : this.increase(); }

  #compare(d1, d2) {
    const e = 0.000001;
    let diff = Math.abs(d1 - d2);
    if (diff < e) return 0;
    else if (d1 > d2) return 1;
    else return -1;
  }
}

class ProgressBarElement {
  #id = undefined;
	#boxed = false;
	#showRuler = false;
	#minColor = new Color("#ffff00");
	#maxColor = new Color("#00ff00");
	#displayMode = ValueDisplayMode.NONE;

	#containerElement = null;
	#progressBarElement = null;
	#progressInfoElement = null;
	#progressInputElement = null;
	#rangeValuesElement = null;
	#minValueElement = null;
	#maxValueElement = null;

	constructor(targetElement, pvalue, opts) {

    this.#id = opts.elementId;
    this.#boxed = opts.isBoxed;
    this.#showRuler = opts.showRuler;
    this.#displayMode = opts.displayMode;
    this.#minColor = ColorHelper.resolveColor(opts.minColor);
    this.#maxColor = ColorHelper.resolveColor(opts.maxColor);

    const targetEl = (targetElement ?? document.body);

		const containerEl = document.createElement('div');
		containerEl.id = `${this.#id}_wrapper`;
		containerEl.className = "progress-bar";
    if (opts.elementWidth) containerEl.style.width = opts.elementWidth;
    if (opts.elementHeight) containerEl.style.height = opts.elementHeight;
    if (this.#boxed) {
      containerEl.classList.add("boxed");
      if (opts.boxBgColor) {
        try {
            let c = ColorHelper.resolveColor(opts.boxBgColor);
            containerEl.style.background = c.hexRgb;
        }
        catch {}
      }
    }


		const progressTrackEl = document.createElement('div');
		progressTrackEl.className = "track";
    if (opts.trackBgColor) {
      try {
          let c = ColorHelper.resolveColor(opts.trackBgColor);
          progressTrackEl.style.background = c.hexRgb;
      }
      catch {}
    }

		const progressInputEl = document.createElement('input');
		progressInputEl.id = `${this.#id}`;
		progressInputEl.type = "hidden";
		progressInputEl.value = `${pvalue.valueText}`;
		this.#progressInputElement = progressTrackEl.appendChild(progressInputEl);

		const progressBarEl = document.createElement('div');
		progressBarEl.className = "progress";
		progressBarEl.style.cssText = this.#getProgressBarStyle(pvalue);
		this.#progressBarElement = progressTrackEl.appendChild(progressBarEl);

		const progressValueEl = document.createElement('div');
		progressValueEl.className = "info";
		progressValueEl.innerText = this.#getDisplayText(pvalue);
		this.#progressInfoElement = progressTrackEl.appendChild(progressValueEl);

		const rangeValuesEl = document.createElement('div');
		rangeValuesEl.className = "range";
		rangeValuesEl.style.cssText = this.#showRuler ? "display: flex" : "display: none";

		const minValEl = document.createElement('span');
		minValEl.innerText = `${pvalue.minValue}`;
		this.#minValueElement = rangeValuesEl.appendChild(minValEl);

		const maxValEl = document.createElement('span');
		maxValEl.innerText = `${pvalue.maxValue}`;
		this.#maxValueElement = rangeValuesEl.appendChild(maxValEl);

		containerEl.appendChild(progressTrackEl);
		this.#rangeValuesElement = containerEl.appendChild(rangeValuesEl);

		this.#containerElement = targetEl.appendChild(containerEl);
	}

  get boxed() { return this.#boxed; }
  get showRuler() { return this.#showRuler; }
  get displayMode() { return this.#displayMode; }
  get inputValue() { return parseFloat(this.#progressInputElement.value); }

  toggleBoxVisibility() {
		if (!this.#containerElement) return;
		this.#containerElement.classList.toggle("boxed");
	}

  toggleRulerVisibility() {
		if (!this.#containerElement) return;
		this.#rangeValuesElement.style.display = this.#showRuler ? "flex" : "none";
	}

	updateValue(pvalue) {
		this.#progressInputElement.value = pvalue.valueText;
    this.#progressInfoElement.innerText = this.#getDisplayText(pvalue);
		this.#progressBarElement.style.cssText = this.#getProgressBarStyle(pvalue);
	}

  destroy() { this.#containerElement.remove(); }

  #getDisplayText(pvalue) {
		switch (this.#displayMode) {
			case ValueDisplayMode.VALUE:
				return pvalue.valueText;
			case ValueDisplayMode.PERCENT:
				return pvalue.percentText;
			case ValueDisplayMode.COMBINED:
				return `${pvalue.valueText} (${pvalue.percentText})`;
			case ValueDisplayMode.NONE:
			default:
				return '';
		}
	}

	#getProgressBarStyle(pvalue) {
		const minRGB = this.#minColor.rgb;
		const curRGB = ColorHelper.calculateColorChannelsTransit(this.#minColor.rgb, this.#maxColor.rgb, pvalue.progress);
		var width = `width: ${pvalue.percent}%;`;
		var bg_color = `background: ${this.#minColor.hexRgb};`;
		var bg_gradient = `background: linear-gradient(90deg,rgba(${minRGB[0]}, ${minRGB[1]}, ${minRGB[2]}, 1) 0%, rgba(${curRGB[0]}, ${curRGB[1]}, ${curRGB[2]}, 1) 100%);`;
		return `${width} ${bg_color} ${bg_gradient}`;
	}
}

class ProgressBar {
  #progressValue = undefined;
  #progressBarElement = undefined;
  #inputValueObserver = undefined;
  #onChangedListeners = new Set();
	#onCompletedListeners = new Set();
	#onIterationListeners = new Set();

	constructor(targetElement, opts) {
    this.#progressValue = new ProgressValue(opts);
    this.#progressBarElement = new ProgressBarElement(targetElement, this.#progressValue, opts);
    this.#inputValueObserver = setInterval(() => { this.#checkInputValue(); }, 69);
    this.addOnChangedListener(opts.onChangedListener);
    this.addOnCompletedListener(opts.onCompletedListener);
    this.addOnIterationListener(opts.onIterationListener);
  }

  addOnChangedListener(listener) {
    if (!listener) return;
		if (typeof(listener) !== 'function')
			throw new Error("Listener must be a function!");
		this.#onChangedListeners.add(listener);
	}
	addOnCompletedListener(listener) {
    if (!listener) return;
		if (typeof(listener) !== 'function')
			throw new Error("Listener must be a function!");
		this.#onCompletedListeners.add(listener);
	}
	addOnIterationListener(listener) {
    if (!listener) return;
		if (typeof(listener) !== 'function')
			throw new Error("Listener must be a function!");
		this.#onIterationListeners.add(listener);
	}

  get value() { return this.#progressValue.value; }

	setValue(val) { this.#handleUpdateResult(this.#progressValue.setValue(val)); }
	increase() { this.#handleUpdateResult(this.#progressValue.increase()); }
	decrease() { this.#handleUpdateResult(this.#progressValue.decrease()); }
	tick() { this.#handleUpdateResult(this.#progressValue.tick()); }

  destroy() {
    clearInterval(this.#inputValueObserver);
    this.#onCompletedListeners = new Set();
    this.#onIterationListeners = new Set();
    this.#progressBarElement.destroy();
    this.#progressBarElement = null;
  }

  #handleUpdateResult(result) {
    if (result === ValueUpdateResult.NONE) return;
		this.#progressBarElement.updateValue(this.#progressValue);
		this.#invokeListeners(result);
  }

	#checkInputValue() {
		const inputValue = this.#progressBarElement.inputValue;
		if (inputValue !== this.#progressValue.value)
			this.setValue(inputValue);
	}

	#invokeListeners(result) {
    for (const fn of this.#onChangedListeners) fn();

    if (result === ValueUpdateResult.NEWLOOP)
			for (const fn of this.#onIterationListeners) fn();
		else if ((this.#progressValue.reversed && result === ValueUpdateResult.MINIMUM)
      || (!this.#progressValue.reversed && result === ValueUpdateResult.MAXIMUM))
		    for (const fn of this.#onCompletedListeners) fn();
	}
}
