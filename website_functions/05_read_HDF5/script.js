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
const x = f.get("matrix/data").value;
const i = f.get("matrix/indices").value;
const p = f.get("matrix/indptr").value;

// check the dimensions of the matrix.
// will return an array with 2 values: [number_of_rows, number_of_columns]
const shape = f.get("matrix/shape").value;
console.log("x", x);
console.log("i", i);
console.log("p", p);
console.log(shape);
