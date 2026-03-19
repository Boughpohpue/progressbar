import NamedColor from 'https://boughpohpue.github.io/colorjs/compiled/colorjs.mod.js';
import ValueDisplayMode from './pb_enums.js';

export class PbOptions {
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

export default PbOptions;
