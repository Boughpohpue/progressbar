import { ColorHelper, NamedColor } from 'https://boughpohpue.github.io/artifactory/js/color/1.0.1/colorjs.mod.js';
import ValueDisplayMode from './pb_enums.js';

export class ProgressBarElement {
  #id = undefined;
	#boxed = false;
	#showRuler = false;
	#minColor = NamedColor.Gold;
	#maxColor = NamedColor.Lime;
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

export default ProgressBarElement;
