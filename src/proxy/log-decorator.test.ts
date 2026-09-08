import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createLogDecorator, LogDecorator } from "./log-decorator.js";

function makeDescriptor(): PropertyDescriptor {
  return {
    value: function (this: { base: number }, x: number) {
      return this.base + x * 2;
    },
  };
}

const receiver = { base: 10 };

describe("createLogDecorator", () => {
  test("wraps the method, logs the property key and preserves the result", () => {
    const descriptor = makeDescriptor();
    const messages: string[] = [];
    const decorator = createLogDecorator({ logger: (m) => messages.push(m) });

    const returned = decorator({}, "compute", descriptor);
    const value = (descriptor.value as (x: number) => number).call(receiver, 3);

    assert.equal(returned, descriptor);
    assert.deepEqual(messages, ["[INFO]:compute"]);
    assert.equal(value, 16);
  });

  test("enabled: false skips logging but still executes the method", () => {
    const descriptor = makeDescriptor();
    const messages: string[] = [];
    const decorator = createLogDecorator({
      enabled: false,
      logger: (m) => messages.push(m),
    });

    decorator({}, "compute", descriptor);
    const value = (descriptor.value as (x: number) => number).call(receiver, 3);

    assert.deepEqual(messages, []);
    assert.equal(value, 16);
  });

  test("uses console.log by default when no logger is given", () => {
    const descriptor = makeDescriptor();
    const logs: unknown[][] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args);
    };
    try {
      const decorator = createLogDecorator();
      decorator({}, "compute", descriptor);
      (descriptor.value as (x: number) => number).call(receiver, 1);

      assert.deepEqual(logs, [["[INFO]:compute"]]);
    } finally {
      console.log = originalLog;
    }
  });

  test("keeps the receiver as this for the wrapped call", () => {
    const descriptor = makeDescriptor();
    const decorator = createLogDecorator({ enabled: false });

    decorator({}, "compute", descriptor);
    const value = (descriptor.value as (x: number) => number).call(receiver, 4);

    assert.equal(value, 18);
  });
});

describe("LogDecorator", () => {
  test("default export always logs and preserves the result", () => {
    const descriptor = makeDescriptor();
    const messages: string[] = [];
    const originalLog = console.log;
    console.log = (m: string) => {
      messages.push(m);
    };
    try {
      const returned = LogDecorator({}, "compute", descriptor);
      const value = (descriptor.value as (x: number) => number).call(receiver, 3);

      assert.equal(returned, descriptor);
      assert.deepEqual(messages, ["[INFO]:compute"]);
      assert.equal(value, 16);
    } finally {
      console.log = originalLog;
    }
  });
});
