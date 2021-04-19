import {
  filter,
  from,
  map,
  mergeAll,
  of,
  skip,
  take,
  tap,
  toArray,
  walkSync,
  zip,
} from "./deps.ts";
import { getValueEnum } from "./utils.ts";
import { getColumnConfig, getPrefix, getTitle } from "./operators.ts";

const paths = walkSync("./data");

Array.from(paths)
  .filter((f) => f.isFile)
  .map((f) => f.path)
  .filter((s) => s.endsWith("page.txt"))
  .forEach(async (f) => {
    const c$ = await genColumnsByFilePath(f);
    c$.pipe(tap(async (x) => {
      const { api, content } = x;
      const dir = "./data_columns"
      const ext = ".txt";
      const base_name = api
        .split("/")
        .filter((x) => !!x)
        .join("_");
      const file_name =`${dir}/${base_name}${ext}`;
      console.log(`${file_name}:started`);
      await Deno.writeTextFile(file_name,content);
      console.log(`${file_name}:ended`);
    }))
      .subscribe();
  });

/**
 * @param path
 */
async function genColumnsByFilePath(path: string) {
  const str: string = await Deno.readTextFile(path);
  const arr = str.split(/\n/);

  const columns$ = from(arr)
    .pipe(skip(1));
  const api$ = from(arr)
    .pipe(take(1));

  const columns_result$ = columns$
    .pipe(
      filter((x) => !!x),
      map((x) => {
        const [key, , comment] = x.split("|");
        const prefix$ = of(comment).pipe(getPrefix());
        const title$ = prefix$.pipe(getTitle());
        const value_enum$ = prefix$.pipe(getValueEnum());
        const search$ = of(false);
        return zip(of(key), title$, value_enum$, search$);
      }),
      mergeAll(),
      map(getColumnConfig()),
      toArray(),
    );

  return zip(api$, columns_result$)
    .pipe(
      map((x) => {
        const [api, columns] = x;
        const content: string =
          `const url = "/${api}";const request = curriedRequest(url);const columns = ${
            JSON.stringify(columns)
          }`;
        return { api, content };
      }),
    );
}
