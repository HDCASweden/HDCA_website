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
};

window.onload = loadData();
