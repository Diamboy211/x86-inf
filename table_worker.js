import { lower_bound, upper_bound, code_add, code_mul } from "./table_common.js";

onmessage = e =>
{
  let matrix = e.data;
  for (;;)
  {
    for (let i = lower_bound; i <= upper_bound; i++)
    {
      postMessage(matrix);
      for (let y = lower_bound; y <= upper_bound; y++)
        for (let x = lower_bound; x <= upper_bound; x++)
          matrix[y][x] = code_add(matrix[y][x], code_mul(matrix[y][i], matrix[i][x]));
    }
  }
}