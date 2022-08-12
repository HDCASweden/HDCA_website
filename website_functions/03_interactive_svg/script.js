let metadata = [];
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

  // create variables containing the CCS notation arrays of the matrix
  // x are the values, i the indices, p the indexpointer
  const mx = f.get("matrix/data").value;
  const mi = f.get("matrix/indices").value;
  const mp = f.get("matrix/indptr").value;

  console.log("mx", mx);
  console.log("mi", mi);
  console.log("mp", mp);

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
        createOptions(results.data[0]);
        metadata = results.data;
      },
    }
  );
};

const createOptions = (columnNames) => {
  columnNames.map((name) => {
    document.getElementById("dropdown").innerHTML += `<option>${name}</option>`;
  });
};

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
      <p>${min}</p>
      <p>${(min + max) / 2}</p>
      <p>${max}</p>
    </div>
  `;
};

const addColor = (columnName) => {
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

window.onload = loadData();
