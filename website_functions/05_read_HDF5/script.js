const loadMatrix = async () => {
  // read the hdf5 file as ArrayBuffer
  const res = await fetch(
    "https://export.uppmax.uu.se/snic2022-23-113/datasets/Milich2021/Milich2021_GSM4955359_counts.h5"
  );
  const arrayBuffer = await res.arrayBuffer();

  // read as hdf5 file
  const f = new hdf5.File(arrayBuffer);

  // To check out the file structure of f, use f.keys
  // console.log(f.keys)
  // will return ["matrix"]. This is the top level directory

  // To check for deeper structure, use combination of .get and .keys
  // console.log(f.get("matrix").keys);
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

  // Add header to html
  document.getElementById(
    "matrixHeader"
  ).innerHTML = `<h2>Matrix Name</h2><p>${shape[0]} rows x ${shape[1]} columns`;

  // Create array with names of first and last five rows
  const allNames = f.get("matrix/features/name").value;
  const names = [
    ...allNames.slice(0, 5),
    ...allNames.slice(allNames.length - 5, allNames.length),
  ];

  // Add names to html
  const left = document.getElementById("left");
  names.map((name, index) => {
    if (index == 4) {
      left.innerHTML += `<p>${name}</p>
    <div class="transparent"></div>
    <div class="transparent"></div>
    <div class="transparent"></div>
    `;
    } else {
      left.innerHTML += `<p>${name}</p>`;
    }
  });

  // Create empty visualization arrays
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

  // This function goes through one column of a sparse matrix.
  // It's based on the values mi, mp, mx and shape calculated above.
  // It populates a nested array that is used to visualize the first five rows and columns of the matrix.
  // To do that, it:
  // - identifies the part of the index array mi that is relevant for the current column
  // - identifies which of those indices are relevant for the visualization,
  // - accesses the values in mx that belong to those indices
  // - inserts them into the nested array that represents the visualization.
  // colInd: the index of the column in the sparse matrix we are looking at
  // vis: the nested visualization array that needs to be populated.
  //      Consists of five arrays (columns) with ten values (rows) each.

  const populateVisualization = (colInd, vis) => {
    // Which array in vis are we updating?
    // If we look at the first five columns, it's the same as colInd
    let visInd = colInd;
    // If we look at the last five columns, we need to calculate an offset
    if (colInd > 4) {
      visInd = colInd - shape[1] + 5;
    }
    // Use pointer array to check number of non zero values in current column
    const values = mp[colInd + 1] - mp[colInd];
    // If it's more than 10, we don't need all of them for the 10x10 visualization.
    // Check only first and last five indices
    if (values > 10) {
      // i runs over first five indices in the part of the index array that represents the current column
      for (let i = mp[colInd]; i < mp[colInd] + 5; i++) {
        // get index from index array
        const ind = mi[i];
        // Check if the index should be part of the visualization
        if (ind < 5) {
          // get matching value from value array
          const val = mx[i];
          vis[visInd].splice(ind, 1, val);
        }
      }
      // i runs over last five indices in the part of the index array that represents the current column
      for (let i = mp[1] - 5; i < mp[1]; i++) {
        // get index from indexarray
        const ind = mi[i];
        // Check if the index should be part of the visualization
        if (ind > 14) {
          // get matching value from value array
          const val = mx[i];
          vis[visInd].splice(vis[visInd].length - (shape[0] - ind), 1, val);
        }
      }
    }
    // If it's less than 10, check all values indices present for the current column in the index array
    else {
      for (let i = mp[colInd]; i < mp[colInd + 1]; i++) {
        // get index from indexarray
        const ind = mi[i];
        // Check if the index should be part of the visualization
        if (ind < 5 || ind > 14) {
          // get matching value from value array
          const val = mx[i];
          vis[visInd].splice(vis[visInd].length - (shape[0] - ind), 1, val);
        }
      }
    }
  };

  // populate first 5 columns
  for (let i = 0; i < 5; i++) {
    populateVisualization(i, first5Columns);
  }

  first5Columns.forEach((column) => console.log(column));
  first5Columns.forEach((column, index) => {
    const matrixDiv = document.getElementById(`column${index}`);
    column.map((value, index) => {
      if (index == 4) {
        matrixDiv.innerHTML += `<p>${value == 0 ? "." : value}</p>
      <div class="separator horizontal-left"></div>
      <div class="separator horizontal-left"></div>
      <div class="separator horizontal-left"></div>
      `;
      } else {
        matrixDiv.innerHTML += `<p>${value == 0 ? "." : value}</p>`;
      }
    });
  });

  // populate last 5 columns
  for (let i = shape[1] - 5; i < shape[1]; i++) {
    populateVisualization(i, last5Columns);
  }

  last5Columns.forEach((column) => console.log(column));
  last5Columns.forEach((column, index) => {
    const matrixDiv = document.getElementById(`column${index + 5}`);
    column.map((value, index) => {
      if (index == 4) {
        matrixDiv.innerHTML += `<p>${value == 0 ? "." : value}</p>
      <div class="separator horizontal-right"></div>
      <div class="separator horizontal-right"></div>
      <div class="separator horizontal-right"></div>
      `;
      } else {
        matrixDiv.innerHTML += `<p>${value == 0 ? "." : value}</p>`;
      }
    });
  });
};

window.onload = loadMatrix();
