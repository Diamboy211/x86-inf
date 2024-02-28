import { lower_bound, upper_bound, code_square } from "./table_common.js";

onmessage = e =>
{
  let matrix = e.data;
  for (;;)
  {
    postMessage(matrix);
    let n = 0;
    for (let i = lower_bound; i <= upper_bound; i++)
      for (let j = lower_bound; j <= upper_bound; j++)
        n += !matrix[i][j];
    if (!n) break;
    matrix = code_square(matrix);
  }
}