const text = await Deno.readTextFile("./data.txt");
import { bufferCount, from, map, partition, tap, zip } from "./deps.ts";

const data = text.split(/\n/);
const parts = from<string[]>(data);
const [$t, $c] = partition(parts, (x) => x.startsWith("#"));
const [$content] = partition($c, (x) => !!x);

zip(
  $t.pipe(map((x) => x.slice(1))),
  $content.pipe(
    map((x) => {
      const [key, type, null_able, comment] = x.split("|");
      const sql_type = getSqlType(type);
      const allow_null = getAllowNull(null_able);
      return `${key} ${sql_type} ${allow_null} #${comment}`;
    }),
    bufferCount(3),
    map((x) => x.join(",")),
    map((x) => `(${x})`),
    tap(console.log),
  ),
)
  .pipe(tap(console.log))
  .subscribe();
function getSqlType(type: string) {
  if (type === "string") return "varchar(255)";
  if (type === "number") return "int";
  return "unknown_type";
}
function getAllowNull(str: string) {
  if (str === "yes") {
    return "null";
  }
  return "not null";
}
