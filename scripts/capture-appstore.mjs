import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  appId,
  captureFlow,
  locales,
  screens,
  screenshotName,
  screenshotSize,
  selectCaptureSimulator,
  safeCommandProgress,
  safeFailureCategory,
  safeLoginFindings,
} from "./appstore-capture-flow.mjs";

const mode = process.env.CAPTURE_MODE;
const target = process.env.CAPTURE_DEVICE ?? "ipad";
const buildId = process.env.CAPTURE_BUILD_ID;
function preflight() {
  if (!["ipad", "iphone"].includes(target))
    throw new Error("Choose ipad or iphone capture device.");
  if (!["probe", "capture"].includes(mode))
    throw new Error("Choose probe or capture mode.");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      buildId ?? "",
    )
  ) {
    throw new Error("An exact simulator build ID is required.");
  }
  if (
    mode === "capture" &&
    (!process.env.MAESTRO_SCREENSHOT_EMAIL ||
      !process.env.MAESTRO_SCREENSHOT_PASSWORD)
  ) {
    throw new Error(
      "Set MAESTRO_SCREENSHOT_EMAIL and MAESTRO_SCREENSHOT_PASSWORD as secret EAS preview variables. Never pass credentials as workflow inputs.",
    );
  }
}

let device;
const deadline = Date.now() + 15 * 60 * 1000;
function run(command, args, label, options = {}) {
  const remaining = deadline - Date.now();
  if (remaining <= 0)
    throw new Error("Capture exceeded its 15 minute execution limit.");
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: Math.min(remaining, 5 * 60 * 1000),
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
  // Maestro output and diagnostics may expand secrets. Never print them.
  if (result.status !== 0 || result.error) {
    if (label.endsWith(" capture")) {
      console.error(
        `Capture failure category: ${safeFailureCategory(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)}; timedOut=${result.error?.code === "ETIMEDOUT"}.`,
      );
    }
    // This command runs before login and only contains a new device name and
    // public simulator identifiers. Its error explains worker incompatibility.
    if (command === "xcrun" && args[0] === "simctl" && args[1] === "create")
      console.error(result.stderr?.slice(0, 2000));
    throw new Error(
      `${label} failed. Raw output withheld to protect demo credentials.`,
    );
  }
  return result.stdout.trim();
}
const sim = (args, label) => run("xcrun", ["simctl", ...args], label);

try {
  preflight();
  if (process.argv.includes("--preflight")) {
    console.log(`Capture preflight passed (${mode}).`);
    process.exit(0);
  }
  if (process.platform !== "darwin")
    throw new Error("Run this capture on an EAS macOS worker.");
  const app = process.env.SIMULATOR_APP_PATH;
  if (!app)
    throw new Error(
      "The downloaded app path was not passed to the capture step.",
    );
  if (!app?.endsWith(".app") || !existsSync(join(app, "Info.plist")))
    throw new Error("A downloaded simulator .app is required.");
  const plist = (key) =>
    run(
      "/usr/libexec/PlistBuddy",
      ["-c", `Print :${key}`, join(app, "Info.plist")],
      "Read app identity",
    );
  if (
    plist("CFBundleIdentifier") !== appId ||
    plist("DTPlatformName") !== "iphonesimulator"
  ) {
    throw new Error("The archive must be the Komisio iOS simulator app.");
  }
  const appVersion = plist("CFBundleShortVersionString");
  if (appVersion !== "2.0.0")
    throw new Error("This capture is scoped to Komisio 2.0.0.");
  const listing = JSON.parse(sim(["list", "--json"], "List simulator devices"));
  // Installed device types alone do not establish runtime compatibility.
  console.log(
    JSON.stringify(
      listing.runtimes.map((r) => ({
        name: r.name,
        version: r.version,
        available: r.isAvailable,
        supportedIpads: r.supportedDeviceTypes
          ?.filter((d) => /^iPad/.test(d.name))
          .map((d) => d.name),
      })),
    ),
  );
  const { type, runtime } = selectCaptureSimulator(
    listing,
    plist("MinimumOSVersion"),
    target,
  );
  console.log(`Selected ${type.identifier} with ${runtime.identifier}.`);
  console.log(
    `Installed iPad types: ${listing.devicetypes
      .filter((d) => /^iPad Pro 13-inch/.test(d.name))
      .map((d) => d.identifier)
      .join(", ")}.`,
  );
  device = sim(
    [
      "create",
      "Komisio App Store capture",
      type.identifier,
      runtime.identifier,
    ],
    "Create capture-only simulator",
  );
  if (!/^[0-9A-F-]{36}$/i.test(device))
    throw new Error("Unexpected simulator identifier.");
  console.log(`Capturing on ${type.name}, ${runtime.name}; mode=${mode}.`);
  sim(["boot", device], "Boot simulator");
  sim(["bootstatus", device, "-b"], "Wait for simulator boot");
  sim(
    [
      "spawn",
      device,
      "defaults",
      "write",
      "NSGlobalDomain",
      "AppleLanguages",
      "-array",
      "en-GB",
    ],
    "Set initial device language",
  );
  sim(
    [
      "spawn",
      device,
      "defaults",
      "write",
      "NSGlobalDomain",
      "AppleLocale",
      "en_GB",
    ],
    "Set initial device region",
  );
  sim(
    [
      "status_bar",
      device,
      "override",
      "--time",
      "9:41",
      "--batteryState",
      "charged",
      "--batteryLevel",
      "100",
    ],
    "Set capture status bar",
  );
  sim(["install", device, app], "Install simulator app");
  const temporary = mkdtempSync(join(tmpdir(), "komisio-capture-"));
  const output = resolve("artifacts/appstore");
  // Refuse to mix outputs from two builds or an earlier failed run.
  if (existsSync(output))
    throw new Error("Capture output directory must be fresh.");
  mkdirSync(output, { recursive: true });
  const expected =
    mode === "probe"
      ? ["probe-store-picker.png"]
      : locales.flatMap((locale) =>
          screens.map((_, index) => `${screenshotName(locale, index)}.png`),
        );
  const maestro = existsSync(
    join(process.env.HOME ?? "", ".maestro/bin/maestro"),
  )
    ? join(process.env.HOME, ".maestro/bin/maestro")
    : "maestro";
  const flows =
    mode === "probe"
      ? [
          [
            "probe",
            `appId: ${appId}\n---\n- launchApp:\n    clearState: true\n    clearKeychain: true\n- extendedWaitUntil:\n    visible: "(Choose store|Välj butik)"\n    timeout: 60000\n- takeScreenshot: probe-store-picker\n`,
          ],
        ]
      : locales.map((locale) => [locale, captureFlow(locale)]);
  for (const [name, flow] of flows) {
    const path = join(temporary, `${name}.yaml`);
    writeFileSync(path, flow);
    console.log(`Running ${name} capture flow.`);
    try {
      run(
        maestro,
        [
          "--device",
          device,
          "test",
          "--debug-output",
          join(temporary, "diagnostics", name),
          "--test-output-dir",
          join(temporary, "screens", name),
          path,
        ],
        `${name} capture`,
        {
          env: { ...process.env, MAESTRO_CLI_NO_ANALYTICS: "1" },
        },
      );
    } catch (error) {
      // Inspect the actual post-failure screen, not the command report (which
      // does not contain the current hierarchy). Keep raw output in memory.
      const hierarchy = spawnSync(
        maestro,
        ["--device", device, "hierarchy", "--no-reinstall-driver"],
        {
          encoding: "utf8",
          timeout: 60000,
          maxBuffer: 5 * 1024 * 1024,
          env: { ...process.env, MAESTRO_CLI_NO_ANALYTICS: "1" },
        },
      );
      if (hierarchy.status === 0) {
        const text = hierarchy.stdout ?? "";
        console.log(`Current login errors: ${JSON.stringify(safeLoginFindings(text))}`);
        console.log(`Current UI markers: ${JSON.stringify({
          emailField: text.includes("login-email"),
          passwordField: text.includes("login-password"),
          overviewId: text.includes("tab-overview"),
          profileId: text.includes("tab-profile"),
          overviewLabel: text.includes("Översikt") || text.includes("Overview"),
          profileLabel: text.includes("Profil") || text.includes("Profile"),
          expectedEmailPresent: text.includes(process.env.MAESTRO_SCREENSHOT_EMAIL),
          storePicker: text.includes("Choose store") || text.includes("Välj butik"),
        })}`);
      } else {
        console.log("Post-failure UI inspection unavailable; raw output withheld.");
      }
      const diagnostics = temporary;
      if (existsSync(diagnostics)) {
        for (const file of readdirSync(diagnostics, {
          recursive: true,
          withFileTypes: true,
        })) {
          if (file.isFile() && /^commands.*\.json$/.test(file.name)) {
            try {
              const reportText = readFileSync(
                join(file.parentPath, file.name),
                "utf8",
              );
              console.log(
                `Visible login errors: ${JSON.stringify(safeLoginFindings(reportText))}`,
              );
              console.log(
                `Capture command status: ${JSON.stringify(safeCommandProgress(JSON.parse(readFileSync(join(file.parentPath, file.name), "utf8"))))}`,
              );
            } catch {
              /* Keep raw diagnostics private even if the report is incomplete. */
            }
          }
        }
      }
      throw error;
    }
  }
  // Explicit allowlist: no debug screenshots, command reports, logs or sessions.
  const files = readdirSync(join(temporary, "screens"), {
    recursive: true,
    withFileTypes: true,
  }).filter((file) => file.isFile());
  const manifest = {
    buildId,
    target,
    appVersion,
    mode,
    device: type.name,
    runtime: runtime.name,
    captures: [],
  };
  for (const filename of expected) {
    const matches = files.filter((file) => file.name === filename);
    if (matches.length !== 1)
      throw new Error(`Expected exactly one ${filename}.`);
    const source = join(matches[0].parentPath, filename);
    const dimensions = screenshotSize(readFileSync(source), target);
    copyFileSync(source, join(output, filename));
    manifest.captures.push({ filename, ...dimensions });
  }
  writeFileSync(
    join(output, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    `Verified ${expected.length} native PNGs. Visual review is still required before App Store upload.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Capture failed.");
  process.exitCode = 1;
} finally {
  if (device && /^[0-9A-F-]{36}$/i.test(device)) {
    // Only the simulator created by this run is touched, on the ephemeral VM.
    spawnSync("xcrun", ["simctl", "shutdown", device], {
      stdio: "ignore",
      timeout: 20000,
    });
    spawnSync("xcrun", ["simctl", "delete", device], {
      stdio: "ignore",
      timeout: 20000,
    });
  }
}
