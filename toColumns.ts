import {
  filter,
  from,
  map,
  mergeAll,
  Observable,
  of,
  skip,
  toArray,
  zip,
} from "./deps.ts";
import { getValueEnum } from "./utils.ts";

const file_path = "./data/api_project_page_page.txt";
const str: string = await Deno.readTextFile(file_path);
export const arr = str.split(/\n/);

function getPrefix(comment: string) {
  return of(comment).pipe(
    map((x) => x.slice(1)),
    map((x) => {
      const last = x.length - 1;
      return x.slice(0, last);
    }),
  );
}

function getTitle$(prefix$: Observable<string>) {
  return prefix$.pipe(
    map((x: string) => {
      if (x.includes(":")) {
        const index = x.indexOf(":");
        return x.slice(0, index);
      }
      if (x.includes("：")) {
        const index = x.indexOf("：");
        return x.slice(0, index);
      }
      if (x.includes("(")) {
        const index = x.indexOf("(");
        return x.slice(0, index);
      }
      if (x.includes("（")) {
        const index = x.indexOf("（");
        return x.slice(0, index);
      }
      return x;
    }),
  );
}

const columns$ = from(arr)
  .pipe(skip(1));

const columns_result$ = columns$
  .pipe(
    filter((x) => !!x),
    map((x) => {
      const [key, , comment] = x.split("|");
      const prefix$ = getPrefix(comment);
      const title$ = getTitle$(prefix$);
      const value_enum$ = prefix$.pipe(getValueEnum());
      const search$ = of(false);
      return zip(of(key), title$, value_enum$, search$);
    }),
    mergeAll(),
    map((x) => {
      const [key, title, valueEnum, search] = x;
      if (valueEnum) {
        return {
          key,
          dataIndex: key,
          title,
          valueEnum,
          search,
        };
      }
      return {
        key,
        dataIndex: key,
        title,
        search,
      };
    }),
    toArray(),
  );
columns_result$
  .subscribe((x) => {
    console.log(x);
  });
