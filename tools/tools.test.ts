import { describe, expect, it, vi } from "vitest";
import { getFirstNameTool } from "../tools/get-first-name.js";
import { getAgeTool } from "../tools/get-age.js";

describe("getFirstNameTool", () => {
  it("returns Alex as firstName", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await getFirstNameTool.execute({});
    expect(JSON.parse(result)).toEqual({ firstName: "Alex" });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("[getFirstName]"),
    );
    logSpy.mockRestore();
  });
});

describe("getAgeTool", () => {
  it("returns age 28", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await getAgeTool.execute({});
    expect(JSON.parse(result)).toEqual({ age: 28 });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[getAge]"));
    logSpy.mockRestore();
  });
});

describe("toolDefinitions registry", () => {
  it("includes both person tools", async () => {
    const { toolDefinitions, toolExecutors } = await import("../tools/index.js");
    const names = toolDefinitions.map((d) => d.name).sort();
    expect(names).toEqual(["get_age", "get_first_name"]);
    expect(typeof toolExecutors.get_first_name).toBe("function");
    expect(typeof toolExecutors.get_age).toBe("function");
  });
});
