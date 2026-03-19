import Enum from 'https://boughpohpue.github.io/artifactory/js/enum/1.0.1/enum.mod.js';

export class ValueUpdateResult extends Enum {
  static NONE = new ValueUpdateResult();
  static NORMAL = new ValueUpdateResult();
  static MINIMUM = new ValueUpdateResult();
  static MAXIMUM = new ValueUpdateResult();
  static NEWLOOP = new ValueUpdateResult();
  static { this.seal(); }
}

export class ValueDisplayMode extends Enum {
	static NONE = new ValueDisplayMode();
  static VALUE = new ValueDisplayMode();
  static PERCENT = new ValueDisplayMode();
  static COMBINED = new ValueDisplayMode();
  static { this.seal(); }
}

export default ValueDisplayMode;
