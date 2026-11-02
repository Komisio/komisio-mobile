import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const { captureFlow, screenshotSize, screenshotName } = await import(
  new URL("../scripts/appstore-capture-flow.mjs", import.meta.url).href
);

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
    assert.equal(taps.length, 11);
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
