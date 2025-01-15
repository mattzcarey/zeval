import { beforeAll, describe, expect, test } from "bun:test";
import { Zeval } from "../index";

const testFunction = async (input: string) => {
  return "hello " + input;
}

describe("zeval", () => {
  let model: Zeval;

  beforeAll(async () => {
    model = await Zeval.load({
      debug: true,
    });
  });

  test("basic assertion with simple values", async () => {
    const output = await testFunction("world");

    const res = await model.eval({
      output,
      prompt: "This should be a greeting",
    });

    expect(res).toBe(false);
  }, 50000);

  test("should reject non-greetings", async () => {
    const output = "goodbye world";

    const res = await model.eval({
      output,
      prompt: "This should be a greeting",
    });

    expect(res).toBe(false);
  }, 50000);
});
