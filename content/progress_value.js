import { ValueDisplayMode, ValueUpdateResult } from './pb_enums.js';

export class ProgressValue {
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

export default ProgressValue;
