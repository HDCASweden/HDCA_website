// Information from the csv file
let metadata = [];

// A list of all genes present in the hdf5 file
let genesList = [];

// The three arrays defining the sparse matrix in the hdf5 file
let mx = [];
let mi = [];
let mp = [];

// The row names of the sparse matrix
let barcodes = [];

// All areas of the svg image
let imageAreas = [];
// All genes values
let geneValues = [];

const createOptions = (optionArray) => {
  const list = document.getElementById("filter-list");
  list.innerHTML = "";
  optionArray.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    list.appendChild(option);
  });
};

const showTooltip = (evt, id) => {
  let tooltip = document.getElementById("tooltip");
  tooltip.innerHTML = geneValues.length > 0 ? id + " <br /> " + geneValues.find(e => e.name === id).value : id;
  tooltip.style.display = "block";
  tooltip.style.left = evt.pageX + 10 + 'px';
  tooltip.style.top = evt.pageY + 10 + 'px';
}

const hideTooltip = () => {
  var tooltip = document.getElementById("tooltip");
  tooltip.style.display = "none";
}

// Function to generate the right legend for the visualization
// depending on what column is selected for visualisation
const generateLegend = (legendRows) => {
  const legendWrapper = document.getElementById("legendWrapper");
  legendWrapper.innerHTML = `<table id="legend"></table>`;
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  Object.keys(legendRows).forEach((row) => {
    legend.innerHTML += `
      <tr>
        <td class="legend-field" style="background-color: ${legendRows[row]}"></td>
        <td>${row}</td>
      </tr>
    `;
  });
};

// Function to generate a legend for sequential coloring
// based on the min and max value of the scale
const generateSeqLegend = (min, max) => {
  const legend = document.getElementById("legendWrapper");
  legend.innerHTML = `
    <div class="seq-legend-colors"></div>
    <div class="seq-legend-labels">
      <p>${max.toFixed(2)}</p>
      <p>${((min + max) / 2).toFixed(2)}</p>
      <p>${min.toFixed(2)}</p>
    </div>
  `;
};

// Function to add color to the svg based on a chosen filter.
// columnName: string. The chosen filter.
const showMetadata = (columnName) => {
  // The legend object will be populated with key value pairs
  // for each unique value we find in this column.
  // The unique value from the column will become a key in the object and
  // be combined with a color HEX code as its object value.
  const legend = {};
  const colIndex = metadata[0].indexOf(columnName);
  metadata.map((areaArray, index) => {
    if (index == 0) {
      return;
    }
    const area = document.getElementById(areaArray[0]);
    if (!area || areaArray[0][0] == "_") {
      return;
    }
    if (columnName === "name") {
      area.setAttribute("fill", `${DISCRETE_COLORS[index - 1]}`);
      if (!Object.keys(legend).includes(areaArray[1])) {
        legend[areaArray[1]] = DISCRETE_COLORS[index - 1];
      }
    }
    const value = areaArray[colIndex];
    if (isNaN(value) && !Object.keys(legend).includes(value)) {
      legend[value] = COLORS[value];
    }

    //color numeric values with color scale
    if (!isNaN(value)) {
      area.setAttribute(
        "fill",
        getSequentialColor(value, getSampleArray(metadata))
      );
    }
    if (value == "NA") {
      area.setAttribute("fill", COLORS.NA);
    } else if (value == "TRUE") {
      area.setAttribute("fill", COLORS.TRUE);
    } else if (value == "FALSE") {
      area.setAttribute("fill", COLORS.FALSE);
    } else if (value == "left") {
      area.setAttribute("fill", COLORS.left);
    } else if (value == "right") {
      area.setAttribute("fill", COLORS.right);
    }
  });
  if (columnName === "inflammation_level") {
    generateSeqLegend(
      Math.min(...getSampleArray(metadata)),
      Math.max(...getSampleArray(metadata))
    );
  } else {
    generateLegend(legend);
  }
};

// Function to add color to the svg based on a chosen gene.
// gene: string
const showGenes = (gene) => {
  // We need the gene's index to later look for it in mi (the matrix index array)
  const genePosition = genesList.indexOf(gene);

  // We want to find a value for every area of the svg image
  // All values together will define the color scale for the visualization
  geneValues = imageAreas.map((item) => {
    // barcodes holds a list of all areas that is equivalent to a list of all columns in the matrix.
    // We need the areas position to identify the right part of mi
    const areaPosition = barcodes.indexOf(item);
    let areaInfo = {};
    areaInfo.name = item;
    areaInfo.start = mp[areaPosition];
    areaInfo.end = mp[areaPosition + 1] - 1;

    // If the area's column in the matrix does not hold a value for the gene's position, its value will be 0
    let value = 0.0;
    let result = {};
    // Check if the area's column holds a value for the gene
    for (let i = areaInfo.start; i <= areaInfo.end; i++) {
      if (mi[i] === genePosition) {
        value = mx[i];
      }
      result.name=areaInfo.name;
      result.value=value;
      console.log(result)
    }
    return result;
  });

  // Reach for the HTML Element of each area and fill it with a calculated value
  imageAreas.forEach((item, index) => {
    document
      .getElementById(item)
      .setAttribute("fill", getSequentialColor(geneValues[index].value, geneValues.map(e => e.value)));
  });

  generateSeqLegend(Math.min(...geneValues.map(e => e.value)), Math.max(...geneValues.map(e => e.value)));
};

// Function to visualize a filter by adding color to the svg
// Acts as a forwarding function that calls another function depending on the filter type.
// That second function takes care of the actual coloring.
// filter: string. A metadata column name or a gene name
const visualize = (filter) => {
  // Check if we are showing genes or metadata
  const filterType = document.getElementById("selectType");
  if (filterType.value === "metadata") {
    showMetadata(filter);
  } else {
    showGenes(filter);
  }
};

// Function to get a array of only numeric values
// The data is the metadata provided in the project
// The function applies to inflammation_level column values
// data: any[]
const getSampleArray = (data) => {
  let sampleArray = [];
  for (var i = 1; i < metadata.length - 1; i++) {
    if (!isNaN(metadata[i][metadata[i].length - 1])) {
      sampleArray.push(metadata[i][metadata[i].length - 1]);
    }
  }
  return sampleArray;
};

// Function to get a color for a value that's part of a sample.
// The color is picked from a sequential scale with 101 colors.
// The min value of the sample will have the lightest color.
// The max value will have the darkest color.
// The color for the current value is picked from the colorscale accordingly.
// value: number
// sample: number[]
const getSequentialColor = (value, sampleArray) => {
  const normalizedValue =
    (value - Math.min(...sampleArray)) /
    (Math.max(...sampleArray) - Math.min(...sampleArray));
  const color = SEQUENTIAL_COLORS[Math.round(normalizedValue * 100)];
  return color;
};

const getView = (boxId) => {
  const box = document.getElementById(boxId);
  const boxX = box.getAttribute("x");
  const boxY = box.getAttribute("y");
  const boxWidth = box.getAttribute("width");
  const boxHeight = box.getAttribute("height");

  const image = document.getElementById("heart");
  image.setAttribute("viewBox", `${boxX} ${boxY} ${boxWidth} ${boxHeight}`);
};

const switchType = (type) => {
  // Clear the filter input field
  document.getElementById("filterDropdown").value = "";
  //Clear the genesValue object array
  geneValues = [];

  // Remove colors from the heart image
  metadata.forEach((areaArray, index) => {
    if (index == 0) {
      return;
    }
    const area = document.getElementById(areaArray[0]);
    area && area.setAttribute("fill", "transparent");
  });

  // Remove legend
  document.getElementById("legendWrapper").innerHTML = "";

  if (type === "metadata") {
    createOptions(metadata[0]);
  } else {
    createOptions(genesList);
  }
};

const loadData = async () => {
  // read the hdf5 file as ArrayBuffer
  const res = await fetch(
    "https://export.uppmax.uu.se/snic2022-23-113/hdca_webdev/CCF/CCF_data.h5"
  );
  const arrayBuffer = await res.arrayBuffer();

  // read as hdf5 file
  const f = new hdf5.File(arrayBuffer);

  // To check out the file structure of f, use f.keys
  console.log(f.keys);
  // will return ["matrix"]. This is the top level directory

  // To check for deeper structure, use combination of .get and .keys
  console.log(f.get("matrix").keys);
  // will return ["barcodes", "data", "features", "indices", "indptr", "shape"]

  // Get column names
  const rawBarcodes = f.get("matrix/barcodes").value;
  barcodes = rawBarcodes.map((str) => str.replace(/[^a-zA-Z0-9 _]/g, ""));

  // populate variables containing the CCS notation arrays of the matrix
  // x are the values, i the indices, p the indexpointer
  mx = f.get("matrix/data").value;
  mi = f.get("matrix/indices").value;
  mp = f.get("matrix/indptr").value;

  console.log("mx", mx);
  console.log("mi", mi);
  console.log("mp", mp);

  // Get the row names of the matrix and use as genes list
  const allGenes = f.get("matrix/features/name").value;
  genesList = allGenes.map((str) => str.replace(/[^a-zA-Z0-9 _]/g, ""));

  // check the dimensions of the matrix.
  // will return an array with 2 values: [number_of_rows, number_of_columns]
  const shape = f.get("matrix/shape").value;
  console.log(shape);

  Papa.parse(
    "https://export.uppmax.uu.se/snic2022-23-113/hdca_webdev/CCF/CCF_meta.csv",
    {
      download: true,
      complete: (results) => {
        console.log(results);
        metadata = results.data;
        metadata.forEach((areaArray, index) => {
          if (index !== 0 && areaArray[0][0] !== "_" && areaArray[0] !== "") {
            imageAreas.push(areaArray[0]);
          }
        });
        // Check the current value of the filter type dropdown to create right set of options
        const filterType = document.getElementById("selectType").value;
        switchType(filterType);
      },
    }
  );
};

window.onload = loadData();
