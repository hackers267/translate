import { map, pipe } from "./deps.ts";

export function getValueEnum() {
  return pipe(
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
