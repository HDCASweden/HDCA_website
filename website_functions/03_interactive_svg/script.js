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
const generateLegend = (columnName) => {
  const legend = document.getElementById("legend");
  // Delete old legend
  legend.innerHTML = "";
  switch (columnName) {
    case "name":
      metadata.forEach((areaArray, index) => {
        // Some arrays in metadata metadata don't contain relevant data, skip those.
        if (
          index === 0 ||
          index === metadata.length - 1 ||
          areaArray[0][0] == "_"
        ) {
          return;
        }
        legend.innerHTML += `
        <tr>
        <td class="legend-field" style="background-color: ${
          // because we skip the first row in metadata,
          // we need the -1 to match the legend colors to the right regions
          DISCRETE_COLORS[index - 1]
        }"></td>
        <td>${areaArray[1]}</td>
        </tr>
        `;
      });
      break;
    case "side":
      legend.innerHTML = `
        <tr>
        <td class="legend-field" style="background-color: ${COLORS.right}"></td>
        <td>Right</td>
        </tr>
        <tr>
          <td class="legend-field" style="background-color: ${COLORS.left}"></td>
          <td>Left</td>
        </tr>
        <tr>
          <td class="legend-field" style="background-color: ${COLORS.na}"></td>
          <td>NA</td>
        </tr>
        `;
      break;
    case "inflammation_level":
    /** */
    default:
      legend.innerHTML = `
        <tr>
        <td class="legend-field" style="background-color: ${COLORS.true}"></td>
        <td>True</td>
        </tr>
        <tr>
          <td class="legend-field" style="background-color: ${COLORS.false}"></td>
          <td>False</td>
        </tr>
        <tr>
          <td class="legend-field" style="background-color: ${COLORS.na}"></td>
          <td>NA</td>
        </tr>
        `;
  }
};

const addColor = (columnName) => {
  generateLegend(columnName);
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
    }

    const value = areaArray[colIndex];
    //color numeric values with color scale
    if (!isNaN(value) ){
      area.setAttribute("fill", getSequentialColor(value, getSampleArray(metadata)));
    }
    if (value == "NA") {
      area.setAttribute("fill", COLORS.na);
    } else if (value == "TRUE") {
      area.setAttribute("fill", COLORS.true);
    } else if (value == "FALSE") {
      area.setAttribute("fill", COLORS.false);
    } else if (value == "left") {
      area.setAttribute("fill", COLORS.left);
    } else if (value == "right") {
      area.setAttribute("fill", COLORS.right);
    }
  });

};

// Function to get a array of only numeric values
// The data is the metadata provided in the project
// The function applies to inflammation_level column values
// data: any[]
const getSampleArray = (data) => {
  let sampleArray = [];
  for(var i = 1; i < metadata.length -1; i++){
    if(!isNaN(metadata[i][metadata[i].length-1])){
      sampleArray.push(metadata[i][metadata[i].length-1]);
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
