class Tooltip {
  constructor() {
    this.tooltip = d3.select("body").append("div").attr("class", "tooltip");
  }

  show(content) {
    this.tooltip.html(content).classed("is-visible", true);
    this.tooltipDimension = this.tooltip.node().getBoundingClientRect();
  }

  hide() {
    this.tooltip.classed("is-visible", false);
  }

  move(event) {
    const x = Math.min(
      document.body.clientWidth - this.tooltipDimension.width,
      Math.max(0, event.pageX - this.tooltipDimension.width / 2)
    );
    const y = event.pageY - this.tooltipDimension.height - 16;
    this.tooltip.style("transform", `translate(${x}px,${y}px)`);
  }
}
