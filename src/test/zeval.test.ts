import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import z from "zod";
import { Zeval } from "../index";

const testFunction = async (input: string) => {
  return "hello " + input;
}

describe("zeval", () => {
  let model: Zeval;

  beforeEach(() => {
    model = new Zeval();
  });

  afterEach(async () => {
    await model.cleanup();
  });

  test("basic assertion with simple values", async () => {
    const output = await testFunction("world");

    const res = await model.eval({
      output,
      prompt: "This should be a greeting",
      responseModel: z.boolean()
    });

    expect(res).toBe(true);
  });

  test("should reject non-greetings", async () => {
    const res = await model.eval({
      output: "goodbye world",
      prompt: "This should be a greeting",
      responseModel: z.boolean()
    });

    expect(res).toBe(false);
  });
});
