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

const addColor = (columnName) => {
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
    if (value == "NA") {
      area.setAttribute("fill", "#F2F2F2");
    } else if (value == "TRUE") {
      area.setAttribute("fill", "#8856a7");
    } else if (value == "FALSE") {
      area.setAttribute("fill", "#9ebcda");
    } else if (value == "left") {
      area.setAttribute("fill", "#8c96c6");
    } else if (value == "right") {
      area.setAttribute("fill", "#810f7c");
    }
  });
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
