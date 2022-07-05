import h5wasm from "https://cdn.jsdelivr.net/npm/h5wasm@0.4.0/dist/esm/hdf5_hl.js";

// the WASM loads asychronously, and you can get the module like this:
const Module = await h5wasm.ready;

// then you can get the FileSystem object from the Module:
const { FS } = Module;

// read the hdf5 file as ArrayBuffer
const res = await fetch("./test_dataset_20rows_30columns.h5");
const arrayBuffer = await res.arrayBuffer();

// write the content to a file as a UInt8Array
FS.writeFile("new_file", new Uint8Array(arrayBuffer));

// read from the newly created file
// use mode "r" for reading.  All modes can be found in h5wasm.ACCESS_MODES
const f = new h5wasm.File("new_file", "r");

// To check out the file structure of f, use f.keys()
// console.log(f.keys())
// will return ["matrix"]. This is the top level directory

// To check for deeper structure, use combination of .get and .keys
// console.log(f.get("matrix").keys());
// will return ["barcodes", "data", "features", "indices", "indptr", "shape"]

// create variables containing the CCS notation arrays of the matrix
// x are the values, i the indices, p the indexpointer
const mx = f.get("matrix/data").value;
const mi = f.get("matrix/indices").value;
const mp = f.get("matrix/indptr").value;

// check the dimensions of the matrix.
// will return an array with 2 values: [number_of_rows, number_of_columns]
const shape = f.get("matrix/shape").value;

// Initialize an empty matrix with the dimensions of the one from the hdf5 file
const matrix = math.identity(shape[0], shape[1], "sparse");

// replace the CCS notation arrays with the ones found in the hdf5 file
matrix._index = mi;
matrix._ptr = mp;
matrix._values = mx;

// Create empty visualisation arrays
const first5Columns = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const last5Columns = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const populateFirstColumns = (colIndex) => {
  console.log("populating column ", colIndex);
  // Check number of values in column
  const values = mp[colIndex + 1] - mp[colIndex];
  // If it's more than 10, check first and last five indices
  if (values > 10) {
    for (let i = mp[colIndex]; i < mp[colIndex] + 5; i++) {
      // get index from indexarray
      const ind = mi[i];
      console.log(ind);
      if (ind < 5) {
        // get matching value from value array
        const val = mx[i];
        first5Columns[colIndex].splice(ind, 1, val);
      }
    }
    for (let i = mp[1] - 5; i < mp[1]; i++) {
      // get index from indexarray
      const ind = mi[i];
      console.log(ind);
      if (ind > 14) {
        // get matching value from value array
        const val = mx[i];
        first5Columns[colIndex].splice(
          first5Columns[colIndex].length - (shape[0] - ind),
          1,
          val
        );
      }
    }
  }
  // If it's less than 10, check all until start of next column
  else {
    for (let i = mp[colIndex]; i < mp[colIndex + 1]; i++) {
      // get index from indexarray
      const ind = mi[i];
      console.log(ind);
      if (ind < 5 || ind > 14) {
        // get matching value from value array
        const val = mx[i];
        first5Columns[colIndex].splice(
          first5Columns[colIndex].length - (shape[0] - ind),
          1,
          val
        );
      }
    }
  }
};

// populate first 5 columns
for (let i = 0; i < 5; i++) {
  populateFirstColumns(i);
}

first5Columns.forEach((column) => console.log(column));
first5Columns.forEach((column, index) => {
  const matrixDiv = document.getElementById(`column${index}`);
  column.map((value, index) => {
    if (index == 4) {
      matrixDiv.innerHTML += `<p>${value}</p><div style="border: 2px solid black"></div>`;
    } else {
      matrixDiv.innerHTML += `<p>${value}</p>`;
    }
  });
});

// colIndex: Index of the column in the original matrix
const populateLastColumns = (colIndex, colTotal) => {
  console.log("populating column ", colIndex);
  // Which array in last5Columns are we updating?
  const visIndex = colIndex - colTotal + 5;
  // Check number of values in column
  const values = mp[colIndex + 1] - mp[colIndex];
  // If it's more than 10, check first and last five indices
  if (values > 10) {
    for (let i = mp[colIndex]; i < mp[colIndex] + 5; i++) {
      // get index from indexarray
      const ind = mi[i];
      console.log(ind);
      if (ind < 5) {
        // get matching value from value array
        const val = mx[i];
        last5Columns[visIndex].splice(ind, 1, val);
      }
    }
    for (let i = mp[1] - 5; i < mp[1]; i++) {
      // get index from indexarray
      const ind = mi[i];
      console.log(ind);
      if (ind > 14) {
        // get matching value from value array
        const val = mx[i];
        last5Columns[visIndex].splice(
          last5Columns[visIndex].length - (shape[0] - ind),
          1,
          val
        );
      }
    }
  }
  // If it's less than 10, check all until start of next column
  else {
    for (let i = mp[colIndex]; i < mp[colIndex + 1]; i++) {
      // get index from indexarray
      const ind = mi[i];
      console.log(ind);
      if (ind < 5 || ind > 14) {
        // get matching value from value array
        const val = mx[i];
        last5Columns[visIndex].splice(
          last5Columns[visIndex].length - (shape[0] - ind),
          1,
          val
        );
      }
    }
  }
};

// populate last 5 columns
for (let i = shape[1] - 5; i < shape[1]; i++) {
  populateLastColumns(i, shape[1]);
}

last5Columns.forEach((column) => console.log(column));
last5Columns.forEach((column, index) => {
  const matrixDiv = document.getElementById(`column${index + 5}`);
  column.map((value, index) => {
    if (index == 4) {
      matrixDiv.innerHTML += `<p>${value}</p><div style="border: 2px solid black"></div>`;
    } else {
      matrixDiv.innerHTML += `<p>${value}</p>`;
    }
  });
});
