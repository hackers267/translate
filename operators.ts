import {map, pipe} from "./deps.ts";

export function getPrefix() {
    return pipe(
        map((x: string) => x.slice(1)),
        map((x) => {
            const last = x.length - 1;
            return x.slice(0, last);
        }),
    );
}

export function getTitle() {
    return pipe(
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

export function getColumnConfig() {
    return (x: any[]) => {
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
    };
}
