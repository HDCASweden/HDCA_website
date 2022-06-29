// This function is called on load of the html body
const getTableData = async () => {
  // Waiting to fetch csv data and extract it into an array of objects.
  // Every object in the array represents one line in the csv file.
  const publicationData = await d3.csv(
    "https://raw.githubusercontent.com/HDCASweden/HDCA_database/main/compiled/publications/paper_news.csv",
    (data) => {
      return data;
      // The result is an array of objects with one object per row.
      // The keys of each object correspond to the columns in the csv file.
    }
  );
  publicationData.forEach((row) => {
    document.getElementById("publications").innerHTML =
      document.getElementById("publications").innerHTML +
      `<p><b>${row.DATE}</b>
      <br/>
      <b>${row.JOURNAL}.</b> <a href="https://pubmed.ncbi.nlm.nih.gov/${row.PMID}">${row.ARTICLE}</a>
      ${row.AUTHORS}
      `;
  });
};
