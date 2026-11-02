import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const {
  captureFlow,
  screenshotSize,
  screenshotName,
  selectCaptureSimulator,
  safeCommandProgress,
  safeFailureCategory,
  safeLoginFindings,
} = await import(
  new URL("../scripts/appstore-capture-flow.mjs", import.meta.url).href
);

test("capture progress never includes values or exception details", () => {
  assert.deepEqual(
    safeLoginFindings("private-password Fel e-post eller lösenord."),
    ["wrong-credentials"],
  );
  assert.deepEqual(safeLoginFindings("private-password"), []);
  assert.equal(
    safeFailureCategory("Unable to connect to driver: private-password"),
    "driver-startup",
  );
  assert.equal(
    safeFailureCategory("Unrecognized field private-password"),
    "flow-syntax",
  );
  assert.equal(safeFailureCategory("private-password"), "unclassified");
  const progress = safeCommandProgress([
    {
      command: { inputTextCommand: { text: "private-password" } },
      metadata: { status: "COMPLETED", evaluatedCommand: "private-password" },
    },
    {
      command: { assertConditionCommand: { selector: "private-email" } },
      metadata: { status: "FAILED", error: "private-password" },
    },
    {
      command: { "private-key": "private-password" },
      metadata: { status: "private-status" },
    },
  ]);
  assert.deepEqual(progress, [
    { step: 0, kind: "inputTextCommand", status: "COMPLETED" },
    { step: 1, kind: "assertConditionCommand", status: "FAILED" },
    { step: 2, kind: "other", status: "UNKNOWN" },
  ]);
  assert.equal(JSON.stringify(progress).includes("private"), false);
});

test("simulator selection uses runtime compatibility, not advertised device names", () => {
  const m5 = { name: "iPad Pro 13-inch (M5)", identifier: "ipad-m5" };
  const m4 = { name: "iPad Pro 13-inch (M4)", identifier: "ipad-m4" };
  const phone = { name: "iPhone 16 Pro", identifier: "iphone" };
  const phoneRuntime = {
    name: "iOS 27.1",
    version: "27.1",
    identifier: "phone-os",
    isAvailable: true,
    supportedDeviceTypes: [phone],
  };
  const tabletRuntime = {
    name: "iPadOS 27.0",
    version: "27.0",
    identifier: "tablet-os",
    isAvailable: true,
    supportedDeviceTypes: [m4],
  };
  const listing = {
    devicetypes: [m5, m4, phone],
    runtimes: [phoneRuntime, tabletRuntime],
  };
  assert.equal(
    selectCaptureSimulator(listing, "16.0", "iphone").type.identifier,
    phone.identifier,
  );
  assert.throws(() => selectCaptureSimulator(listing, "16.0", "unknown"));
  assert.equal(
    selectCaptureSimulator(listing, "16.0").type.identifier,
    m4.identifier,
  );
  assert.equal(
    selectCaptureSimulator(listing, "16.0").runtime.identifier,
    tabletRuntime.identifier,
  );
  assert.throws(() =>
    selectCaptureSimulator({ ...listing, runtimes: [phoneRuntime] }, "16.0"),
  );
  assert.throws(() => selectCaptureSimulator(listing, "28.0"));
  assert.throws(() =>
    selectCaptureSimulator(
      { ...listing, runtimes: [{ ...tabletRuntime, isAvailable: false }] },
      "16.0",
    ),
  );
});

test("capture flows only log in and navigate; passwords stay as runtime references", () => {
  for (const locale of ["sv-SE", "en-GB"]) {
    const flow = captureFlow(locale);
    const commands = JSON.parse(flow.split("---\n")[1]);
    const screenshots = commands.filter(
      (cmd: Record<string, unknown>) => "takeScreenshot" in cmd,
    );
    assert.equal(screenshots.length, 5);
    assert.deepEqual(
      screenshots.map(
        (cmd: { takeScreenshot: { path: string } }) => cmd.takeScreenshot.path,
      ),
      [0, 1, 2, 3, 4].map((i) => screenshotName(locale, i)),
    );
    assert.match(flow, /\$\{MAESTRO_SCREENSHOT_PASSWORD\}/);
    const taps = commands.filter(
      (cmd: Record<string, unknown>) => "tapOn" in cmd,
    );
    assert.equal(taps.length, 12);
    assert.ok(
      !/payout|utbetalning|accept|godkänn|save|spara/i.test(
        JSON.stringify(taps),
      ),
    );
    assert.ok(!/https?:\/\//.test(flow));
  }
  assert.throws(() => captureFlow("de-DE"));
  assert.throws(() => screenshotName("../private", 0));
});

function png(width: number, height: number) {
  const bytes = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.write("IHDR", 12);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

test("capture dimensions reject the smaller iPad and phone formats", () => {
  assert.deepEqual(screenshotSize(png(1206, 2622), "iphone"), {
    width: 1206,
    height: 2622,
  });
  assert.throws(() => screenshotSize(png(2064, 2752), "iphone"));
  assert.throws(() => screenshotSize(png(2064, 2752), "unknown"));
  assert.deepEqual(screenshotSize(png(2064, 2752)), {
    width: 2064,
    height: 2752,
  });
  assert.deepEqual(screenshotSize(png(2048, 2732)), {
    width: 2048,
    height: 2732,
  });
  for (const [w, h] of [
    [1620, 2160],
    [1206, 2622],
    [2752, 2064],
  ]) {
    assert.throws(() => screenshotSize(png(w, h)));
  }
  assert.throws(() => screenshotSize(Buffer.from("not an image")));
});

test("capture preflight rejects missing credentials without exposing their values", () => {
  const script = fileURLToPath(
    new URL("../scripts/capture-appstore.mjs", import.meta.url),
  );
  const run = (mode: string, password = "", email = "") =>
    spawnSync(process.execPath, [script, "--preflight"], {
      encoding: "utf8",
      env: {
        ...process.env,
        CAPTURE_MODE: mode,
        CAPTURE_BUILD_ID: "12345678-1234-1234-1234-123456789abc",
        MAESTRO_SCREENSHOT_EMAIL: email,
        MAESTRO_SCREENSHOT_PASSWORD: password,
      },
    });
  assert.equal(run("probe").status, 0);
  assert.equal(run("capture").status, 1);
  assert.equal(run("unexpected").status, 1);
  const result = run(
    "capture",
    "synthetic-secret-do-not-print",
    "demo@example.test",
  );
  assert.equal(result.status, 0);
  assert.ok(
    !`${result.stdout}${result.stderr}`.includes(
      "synthetic-secret-do-not-print",
    ),
  );
  assert.ok(!`${result.stdout}${result.stderr}`.includes("demo@example.test"));
});
