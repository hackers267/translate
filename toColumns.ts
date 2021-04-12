import {filter, from, map, mergeAll, Observable, of, skip, toArray, zip,} from "./deps.ts";

const file_path = "./data/api_product_page_page.txt";
const str: string = await Deno.readTextFile(file_path);
const arr = str.split(/\n/);

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

function getValueEnum$(prefix$: Observable<string>) {
  return prefix$.pipe(
    map((x: string) => {
      const reg = /[:：]/;
      const index = x.search(reg);
      if (index > -1) {
        return x.slice(index + 1);
      }
      return "";
    }),
    map((x: string) => {
      if (!x) return x;
      return x.split(/[;；]/).map((item) => {
        const [key, value] = item.split("->");
        return { [key]: value };
      }).reduce((acc, cur) => ({ ...acc, ...cur }), {});
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
      const value_enum$ = getValueEnum$(prefix$);
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
