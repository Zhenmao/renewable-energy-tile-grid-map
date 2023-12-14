Promise.all([
  d3.csv("data/owid-renewables-share-energy-data.csv", d3.autoType),
  d3.json("data/tile-grid-map.json"),
]).then(([data, tileData]) => {
  const dataByYearByCode = d3.index(
    data,
    (d) => d.year,
    (d) => d.iso_code
  );

  const startYear = 2003;
  const endYear = 2022;
  const years = d3.range(startYear, endYear + 1);
  let dateIndex = years.length - 1;

  const yearInTitle = d3.select("#currentYear").text(years[dateIndex]);

  const tileGridMap = new TileGridMap({
    el: document.getElementById("tileGridMap"),
    data: dataByYearByCode,
    tileData,
    date: years[dateIndex],
    codeAccessor: (d) => d.iso_code,
    dateAccessor: (d) => d.year,
    nameAccessor: (d) => d.country,
    valueAccessor: (d) => d.renewables_share_energy / 100,
    valueFormat: Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format,
  });

  const scrubberContainer = d3.select("#scrubber").on("input", (event) => {
    dateIndex = event.target.valueAsNumber;
    yearInTitle.text(years[dateIndex]);
    tileGridMap.updateDate(years[dateIndex]);
  });
  new Scrubber({
    el: scrubberContainer.node(),
    values: years,
    initial: dateIndex,
    delay: 1000,
  });
});
