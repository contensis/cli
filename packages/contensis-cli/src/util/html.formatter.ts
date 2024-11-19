import { flattenObject } from './json.formatter';

export const htmlFormatter = <T>(entries: T | T[], isDoc = true) => {
  // Flatten the passed in object
  const flatEntries = [] as any[];
  if (Array.isArray(entries))
    for (const entry of entries) {
      flatEntries.push(flattenObject(entry));
    }
  else flatEntries.push(flattenObject(entries));

  // Parse the flattened object to csv
  // const csv = stringify(flatEntries, { header: true });
  // Create an exhaustive list of columns from the entries array
  const columns = new Set<string>(flatEntries.map(e => Object.keys(e)).flat());

  let table = `<table id="contensis-cli-table"><thead><tr>`;
  for (const column of columns) {
    table += `<td>${column}</td>`;
  }
  table += `</tr></thead><tbody>`;
  for (const row of flatEntries) {
    table += `<tr>`;
    for (const column of columns) {
      const val = row[column];
      table += `<td>${typeof val === 'undefined' ? '' : val}</td>`;
    }
    table += `</tr>`;
  }
  table += `</tbody></table>`;

  if (isDoc)
    table = `<html><head>${headTag()}</head><body>${table}${scriptTag()}</body></html>`;
  return table;
};

const headTag = () => {
  return `<link rel="stylesheet" href="https://cdn.datatables.net/2.1.8/css/dataTables.dataTables.css" />
<script
  src="https://code.jquery.com/jquery-3.7.1.slim.min.js"
  integrity="sha256-kmHvs0B+OpCW5GVHUNjv9rOmY0IvSIRcf7zGUDTDQM8="
  crossorigin="anonymous"></script>
<script src="https://cdn.datatables.net/2.1.8/js/dataTables.js"></script>`;
};

const scriptTag = () => {
  return `<script>
let table = new DataTable('#contensis-cli-table', {
  pageLength: 50
});
</script>`;
};
