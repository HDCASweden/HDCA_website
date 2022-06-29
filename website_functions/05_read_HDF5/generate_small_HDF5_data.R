
library(rhdf5)
library(niceRplots)
a <- read_h5('~/repos/workshop-scRNAseq/labs/data/covid_data_GSE149689/sub/nCoV_PBMC_1.h5')
dim(a)

b <- a[,1:200]
vars <- sparseMatrixStats::rowVars(b)
means <- sparseMatrixStats::rowMeans2(b)
plot( log(means+1) ,  log(vars+1)  )
plot( log(means) ,  log(vars+1) - log(means+1)*2.1   )
abline(h=0)

tops <- setNames( log(vars+1) - log(means+1)*2.1 ,  rownames(b))
tops <- names(sort(tops, decreasing = T))[1:100]


b <- b[tops,]
dim(b)

dim(a)
save_matrix_to_HDF5(b,'../05_read_HDF5/test_dataset_100rows_200columns.h5')
save_matrix_to_HDF5(b[1:20,1:30],'../05_read_HDF5/test_dataset_20rows_30columns.h5')
save_matrix_to_HDF5(a,'../05_read_HDF5/test_dataset_33538rows_1500columns.h5')



