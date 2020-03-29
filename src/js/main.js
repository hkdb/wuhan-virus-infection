import numeral from "numeral";
import populations from "./population.json";
import { getData } from "./api";

let tableData;
const filtered = {
  "Diamond Princess": 1
};

const totalNum = (data, field) => data.reduce((sum, d) => sum + (d[field] || 0), 0);

const totalRate = (data, field, baseField) => {
  const total = data.reduce((sum, d) => sum + d[field], 0);
  const totalBase = data.reduce((sum, d) => sum + (d[baseField] || 0), 0);
  return total/totalBase;
};

const renderList = () => {
  const filters = Object.keys(filtered);
  $("#data-table").bootstrapTable("refreshOptions", {
    data: (tableData || []).filter((d) => !filters.includes(d.region))
  });
};

const renderFilters = () => {
  const filterContainer = $(".filters").html("");
  const filters = Object.keys(filtered);
  filters.forEach((f) => {
    const chip = $("<span></span>").addClass("badge badge-pill badge-secondary");
    const closeBtn = $("<a>&times</a>").attr({ href: "#", region: f }).addClass("badge badge-pill badge-light");
    closeBtn.click((ev) => {
      const { region } = ev.target.attributes;
      delete filtered[region.nodeValue];
      console.log("click", filtered);
      renderList();
      renderFilters();
    });
    chip.append(f).append(closeBtn);
    filterContainer.append(chip);
  });
};

const filterEvents = {
  "click .remove": (ev, val, row, index) => {
    filtered[row.region] = 1;
    renderList();
    renderFilters();
  },
};

$(async () => {
  const table = $("#data-table");
  const rawData = await getData();
  const filters = Object.keys(filtered);
  tableData = rawData.map((data) => {
    const population = populations[data.Country_Region];
    return {
      region: data.Country_Region,
      population,
      confirmed: data.Confirmed,
      confirmedRate: population ? data.Confirmed/population : 0,
      death: data.Deaths,
      deathRate: data.Deaths/data.Confirmed,
      recovered: data.Recovered,
      recoveredRate: data.Recovered/data.Confirmed,
    };
  });
  table.bootstrapTable({
    data: tableData.filter((d) => !filters.includes(d.region)),
    height: 700,
    showFooter: true,
    columns: [{
      title: "Ranking", width: 50,
      formatter: (val, row, index) => index+1,
    }, {
      title: "Country/Region", field: "region", width: 300,
      footerFormatter: (data) => "Total",
    }, {
      title: "Population(k)", field: "population", width: 100, align: "right", sortable: true,
      formatter: (val) => val ? numeral(val/1000).format(val >= 1000 ? "0,0" : "0.00") : "---",
      footerFormatter: (data) => numeral(totalNum(data, "population")/10000).format("0,0"),
    }, {
      title: "Confirmed Cases", field: "confirmed", width: 100, align: "right", sortable: true,
      formatter: (val) => numeral(val).format("0,0"),
      footerFormatter: (data) => numeral(totalNum(data, "confirmed")).format("0,0"),
    }, {
      title: "Confirm Rate(%)", field: "confirmedRate", width: 100, align: "right", sortable: true,
      formatter: (val, row) => row.population ? numeral(val*10000).format("0,0.000") : "---",
      footerFormatter: (data) => numeral(totalRate(data, "confirmed", "population")*10000).format("0,0.000"),
    }, {
      title: "Death(s)", field: "death", width: 100, align: "right", sortable: true, 
      formatter: (val) => numeral(val).format("0,0"),
      footerFormatter: (data) => numeral(totalNum(data, "death")).format("0,0"),
    }, {
      title: "Death Rate(%)", field: "deathRate", width: 100, align: "right", sortable: true,
      formatter: (val) => numeral(val).format("0.000%"),
      footerFormatter: (data) => numeral(totalRate(data, "death", "confirmed")).format("0.000%"),
    }, {
      title: "Recovered", field: "recovered", width: 100, align: "right", sortable: true,
      formatter: (val) => numeral(val).format("0,0"),
      footerFormatter: (data) => numeral(totalNum(data, "recovered")).format("0,0"),
    }, {
      title: "Recovery Rate(%)", field: "recoveredRate", width: 100, align: "right", sortable: true,
      formatter: (val) => numeral(val).format("0.000%"),
      footerFormatter: (data) => numeral(totalRate(data, "recovered", "confirmed")).format("0.000%"),
    }, {
      title: "Remove", align: "center",
      events: filterEvents,
      formatter: (val, row) => '<a class="remove badge  badge-danger" href="javascript:void(0)">&times</a>',
    }],
  });
  renderFilters();
});
