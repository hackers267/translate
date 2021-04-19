import {filter, from, map, mergeAll, of, skip, take, toArray, zip,} from "./deps.ts";
import {getValueEnum} from "./utils.ts";
import {getColumnConfig, getPrefix, getTitle} from "./operators.ts";



const file_path = "./data/api_project_page_page.txt";
await genColumnsByFilePath(file_path);

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
            toArray()
        );

    zip(api$, columns_result$)
        .pipe(
            map((x) => {
                const [api, columns] = x;
                return `const url = "/${api}";const request = curriedRequest(url);const columns = ${JSON.stringify(columns)}`;
            })
        )
        .subscribe(x => {
            console.log(x)
        })
}
