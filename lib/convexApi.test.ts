import { describe, expect, it } from "vitest";
import { getFunctionName } from "convex/server";
import { api } from "./convexApi";
import manifest from "./convexApi.manifest.json";

function collectNames(): string[] {
  const names: string[] = [];
  for (const group of Object.values(api)) {
    for (const ref of Object.values(group)) {
      names.push(getFunctionName(ref));
    }
  }
  return names.sort();
}

describe("convexApi manifest", () => {
  it("содержит 17 функций", () => {
    expect(manifest.functions).toHaveLength(17);
  });

  it("ссылки в api совпадают с манифестом", () => {
    expect(collectNames()).toEqual([...manifest.functions].sort());
  });

  it("манифест отсортирован и без дублей", () => {
    expect(manifest.functions).toEqual([...new Set(manifest.functions)].sort());
  });
});
