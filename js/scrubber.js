class Scrubber {
  constructor({
    el,
    values,
    format = (value) => value,
    initial = 0,
    delay = null,
    autoplay = true,
    loop = true,
    loopDelay = null,
  } = {}) {
    this.el = el;
    this.values = values;
    this.format = format;
    this.initial = initial;
    this.delay = delay;
    this.autoplay = autoplay;
    this.loop = loop;
    this.loopDelay = loopDelay;
    this.tick = this.tick.bind(this);
    this.init();
  }

  init() {
    this.setup();
    this.render();
  }

  setup() {
    this.frame = null;
    this.timer = null;
    this.interval = null;
  }

  render() {
    this.form = d3
      .select(this.el)
      .append("form")
      .attr("class", "scrubber")
      .on("pointerenter", () => {
        this.form.classed("is-active", true);
      })
      .on("pointerleave", () => {
        this.form.classed("is-active", false);
      });

    this.thumbSize = parseFloat(
      getComputedStyle(this.form.node()).getPropertyValue("--slider-thumb-size")
    );

    this.actionButton = this.form
      .append("button")
      .attr("class", "action-button")
      .attr("type", "button")
      .on("click", () => {
        if (this.running()) return this.stop();
        this.stepTo((this.input.node().valueAsNumber + 1) % this.values.length);
        this.start();
      });

    this.actionButtonText = this.actionButton
      .append("span")
      .attr("class", "visually-hidden");

    this.startValueButton = this.form
      .append("button")
      .attr("class", "start-button")
      .attr("type", "button")
      .text(this.format(this.values[0]))
      .on("click", () => {
        if (this.running()) this.stop();
        this.stepTo(0);
      });

    this.slider = this.form.append("div").attr("class", "slider");

    this.input = this.slider
      .append("input")
      .attr("class", "slider-input")
      .attr("type", "range")
      .attr("min", 0)
      .attr("max", this.values.length - 1)
      .attr("value", this.initial)
      .attr("step", 1)
      .on("input", (event) => {
        if (event && event.isTrusted && this.running()) this.stop();
        const index = this.input.node().valueAsNumber;
        this.updateOutput(index);
      });

    this.output = this.slider.append("output").attr("class", "slider-output");
    this.updateOutput(this.initial);

    this.endValueButton = this.form
      .append("button")
      .attr("class", "end-button")
      .attr("type", "button")
      .text(this.format(this.values[this.values.length - 1]))
      .on("click", () => {
        if (this.running()) this.stop();
        this.stepTo(this.values.length - 1);
      });

    if (this.autoplay) this.start();
    else this.stop();
  }

  start() {
    this.form.classed("is-playing", true);
    this.actionButtonText.text("Pause");
    if (this.delay === null) this.frame = requestAnimationFrame(this.tick);
    else this.interval = setInterval(this.tick, this.delay);
  }

  stop() {
    this.form.classed("is-playing", false);
    this.actionButtonText.text("Play");
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  running() {
    return this.frame !== null || this.timer !== null || this.interval !== null;
  }

  tick() {
    const index = this.input.node().valueAsNumber;
    if (index === this.values.length - 1) {
      if (!this.loop) return this.stop();
      if (this.loopDelay !== null) {
        if (this.frame !== null) {
          cancelAnimationFrame(this.frame);
          this.frame = null;
        }
        if (this.interval !== null) {
          clearInterval(this.interval);
          this.interval = null;
        }
        this.timer = setTimeout(() => {
          this.setupTo(0);
          this.start();
        }, this.loopDelay);
      }
    }
    if (this.delay === null) this.frame = requestAnimationFrame(this.tick);
    this.stepTo((index + 1) % this.values.length);
  }

  stepTo(index) {
    this.input.node().valueAsNumber = index;
    this.input.dispatch("input", { bubbles: true });
  }

  updateOutput(index) {
    const percentage = index / (this.values.length - 1);
    const adjustment = (0.5 - percentage) * this.thumbSize;
    this.output.node().value = this.format(this.values[index]);
    this.output.style("left", `calc(${percentage * 100}% + ${adjustment}px)`);
  }
}
