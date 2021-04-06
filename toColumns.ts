import {
  filter,
  from,
  map,
  mergeAll,
  Observable,
  of,
  toArray,
  zip,
} from "./deps.ts";

const str: string = await Deno.readTextFile("./data.txt");
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

from(arr)
  .pipe(
    filter((x) => !!x),
    map((x) => {
      const [key, , comment] = x.split("|");
      const prefix$ = getPrefix(comment);
      const title$ = getTitle$(prefix$);
      const value_enum$ = getValueEnum$(prefix$);
      return zip(of(key), title$, value_enum$);
    }),
    mergeAll(),
    map((x) => {
      const [key, title, valueEnum] = x;
      if (valueEnum) {
        return {
          key,
          dataIndex: key,
          title,
          valueEnum,
          search: false,
        };
      }
      return {
        key,
        dataIndex: key,
        title,
        search: false,
      };
    }),
    toArray(),
  )
  .subscribe(async (x) => {
    await Deno.writeTextFile("./columns.txt", JSON.stringify(x));
    console.log("done");
  });
