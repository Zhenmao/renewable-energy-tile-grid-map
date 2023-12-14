class TileGridMap {
  constructor({
    el,
    data,
    tileData,
    date,
    codeAccessor,
    dateAccessor,
    nameAccessor,
    valueAccessor,
    valueFormat,
  }) {
    this.el = el;
    this.data = data;
    this.tileData = tileData;
    this.date = date;
    this.codeAccessor = codeAccessor;
    this.dateAccessor = dateAccessor;
    this.nameAccessor = nameAccessor;
    this.valueAccessor = valueAccessor;
    this.valueFormat = valueFormat;
    this.init();
  }

  init() {
    this.setup();
    this.scaffold();
    this.wrangle();
    this.ro = new ResizeObserver((entries) =>
      entries.forEach((entry) => {
        this.resize(entry.contentRect);
      })
    );
    this.ro.observe(this.el);
  }

  setup() {
    this.marginTop = 4;
    this.marginRight = 4;
    this.marginBottom = 4;
    this.marginLeft = 4;

    this.minWidth = 800;

    this.paddingInner = 0.1;
    this.x = d3
      .scaleBand()
      .domain(d3.range(d3.max(this.tileData, (d) => d.coordinates[0]) + 1))
      .paddingOuter(0)
      .paddingInner(this.paddingInner);
    this.y = d3
      .scaleBand()
      .domain(d3.range(d3.max(this.tileData, (d) => d.coordinates[1]) + 1))
      .paddingOuter(0)
      .paddingInner(this.paddingInner);
    this.z = d3.scaleLinear().domain([0, 1]);
  }

  scaffold() {
    this.container = d3
      .select(this.el)
      .append("div")
      .attr("class", "tile-grid-map");

    this.svg = this.container.append("svg");

    this.svg
      .append("defs")
      .append("pattern")
      .attr("id", "no-data-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 10)
      .attr("height", 10)
      .append("path")
      .attr("class", "no-data-path")
      .attr("d", "M 0,10 l 10,-10 M -2.5,2.5 l 5,-5 M 7.5,12.5 l 5,-5")
      .attr("stroke-width", 2)
      .attr("shape-rendering", "auto")
      .attr("stroke-linecap", "square");

    this.tooltip = new Tooltip();
  }

  wrangle() {
    const currentDateData = this.data.get(this.date);
    this.displayData = this.tileData.map((d) => ({
      code: d["alpha-3"],
      name: d.name,
      coordinates: d.coordinates,
      data: currentDateData.get(d["alpha-3"]),
    }));

    if (this.width) this.render();
  }

  resize({ width }) {
    if (this.width === Math.max(width, this.minWidth)) return;
    this.width = Math.max(width, this.minWidth);

    this.x.range([this.marginLeft, this.width - this.marginRight]);
    this.height =
      this.marginTop +
      this.marginBottom +
      (this.y.domain()[this.y.domain().length - 1] + 1) * this.x.step() -
      this.x.step() * this.paddingInner;
    this.y.range([this.marginTop, this.height - this.marginBottom]);

    this.z.range([this.y.bandwidth(), 0]);

    this.svg
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", [0, 0, this.width, this.height]);

    if (this.displayData) this.render();
  }

  render() {
    this.tile = this.svg
      .selectAll(".tile")
      .data(this.displayData, (d) => d.code)
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "tile")
          .call((g) => g.append("rect").attr("class", "tile-background"))
          .call((g) => g.append("rect").attr("class", "tile-fill"))
          .call((g) =>
            g
              .append("text")
              .attr("class", "tile-code")
              .attr("fill", "currentColor")
              .attr("text-anchor", "middle")
              .attr("dy", "0.71em")
              .attr("y", 4)
              .text((d) => d.code)
          )
          .on("pointerenter", (event, d) => {
            this.tooltipData = d;
            this.tooltip.show(this.tooltipContent());
          })
          .on("pointermove", (event) => {
            this.tooltip.move(event);
          })
          .on("pointerleave", () => {
            this.tooltipData = null;
            this.tooltip.hide();
          })
      )
      .attr(
        "transform",
        (d) =>
          `translate(${this.x(d.coordinates[0])},${this.y(d.coordinates[1])})`
      )
      .classed("no-data", (d) => !d.data)
      .call((g) =>
        g
          .select(".tile-background")
          .attr("width", this.x.bandwidth())
          .attr("height", this.y.bandwidth())
          .style("fill", (d) => (d.data ? null : "url(#no-data-pattern)"))
      )
      .call((g) =>
        g
          .select(".tile-fill")
          .attr("width", this.x.bandwidth())
          .attr("y", (d) =>
            d.data ? this.z(this.valueAccessor(d.data)) : this.y.bandwidth()
          )
          .attr("height", (d) =>
            d.data ? this.y.bandwidth() - this.z(this.valueAccessor(d.data)) : 0
          )
      )
      .call((g) => g.select(".tile-code").attr("x", this.x.bandwidth() / 2));
  }

  tooltipContent() {
    const d = this.tooltipData.data;
    return `
    <div>${this.tooltipData.name}</div>
    <div>${this.date}</div>
    <div>${d ? this.valueFormat(this.valueAccessor(d)) : "no data"}</div>
    `;
  }

  updateDate(date) {
    this.date = date;
    this.wrangle();
    if (this.tooltipData) {
      this.tooltipData = this.displayData.find(
        (d) => d.code === this.tooltipData.code
      );
      this.tooltip.show(this.tooltipContent());
    }
  }
}
