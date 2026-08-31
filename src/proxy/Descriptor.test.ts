import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { LogDecorator } from "./Descriptor.js";

describe("LogDecorator", () => {
  test("replaces descriptor.value with a wrapper that logs and preserves the result", () => {
    const descriptor: PropertyDescriptor = {
      value: function (this: { base: number }, x: number) {
        return this.base + x * 2;
      },
    };

    const logs: unknown[][] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args);
    };
    try {
      const returned = LogDecorator({}, "compute", descriptor, "method");
      const receiver = { base: 10 };
      const value = (descriptor.value as (x: number) => number).call(
        receiver,
        3,
      );

      assert.equal(returned, descriptor);
      assert.deepEqual(logs, [["[INFO]:compute"]]);
      assert.equal(value, 16);
    } finally {
      console.log = originalLog;
    }
  });
});