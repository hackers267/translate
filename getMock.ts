import {
  filter,
  from,
  map,
  mergeAll,
  of,
  pipe,
  reduce,
  skip,
  take,
  tap,
  walkSync,
  zip,
} from "./deps.ts";
import { getValueEnum } from "./utils.ts";

const paths = walkSync("./data");
Array.from(paths).filter((f) => f.isFile)
  .forEach((f) => {
    generateMockByFilePath(f.path);
  });

//await generateMockByFilePath(file_path);

async function generateMockByFilePath(file_path: string) {
  const str: string = await Deno.readTextFile(file_path);
  const arr = str.split(/\n/);

  const api$ = from(arr).pipe(take(1));
  const body$ = from(arr).pipe(skip(1));

  const body_result$ = body$.pipe(
    filter((x) => !!x),
    map((x) => {
      const [key] = x.split("|");
      const mock_type$ = getMockType(x);
      return zip(of(key), mock_type$);
    }),
    mergeAll(),
    map((x) => {
      const [key, type] = x;
      return { [key]: type };
    }),
    reduce((acc, cur) => ({ ...acc, ...cur }), {}),
  );

  zip(api$, body_result$)
    .pipe(
      map((x) => {
        const [api, body] = x;
        const data = JSON.stringify(body);
        if (api.endsWith("/page")) {
          return {
            api,
            body:
              `"POST /${api}":mock(success:true,data:{total:12,list:{${data}}})`,
          };
        }
        return {
          api,
          body: `"POST /${api}":mock({success:true,data:${data}})`,
        };
      }),
      tap((x) => {
        const { api, body } = x;
        const path = api.split("/").join("_") + ".txt";
        Deno.writeTextFile(path, body);
      }),
    )
    .subscribe();
}

function getMockTypeByType(type: string) {
  if (type === "String") return `@string`;
  if (type === "Integer") return `@integer`;
  if (type === "BigDecimal") return `@float`;
  if (type === "Date") return `@Date`;
  if (type === "Timestamp") {
    return `@datetime`;
  }
  return type;
}

function getMockTypeByComment(comment: string) {
  return of(comment).pipe(
    getValueEnum(),
    map((x) => {
      return Object.keys(x);
    }),
    map((x) => {
      return `@pick([${x}])`;
    }),
  );
}

function getMockType(x: string) {
  const [_, type, comment] = x.split("|");
  if (comment.includes(":")) {
    return getMockTypeByComment(comment);
  } else {
    return of(getMockTypeByType(type));
  }
}

function log() {
  return pipe(
    tap(console.log),
  );
}
