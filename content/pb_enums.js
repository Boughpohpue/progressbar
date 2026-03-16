export class DisplayMode extends Enum {
	static NONE = new DisplayMode();
  static VALUE = new DisplayMode();
  static PERCENT = new DisplayMode();
  static COMBINED = new DisplayMode();
  static { this.seal(); }
}

export default DisplayMode;
