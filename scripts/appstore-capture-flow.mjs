// JSON command arrays are valid YAML. Values are data, never shell fragments.
export const appId = "com.inority.komisio";
export const screens = ["overview", "my-items", "money", "store", "profile"];
export const locales = ["sv-SE", "en-GB"];

export function safeLoginFindings(text) {
  const messages = {
    "wrong-credentials": [
      "Fel e-post eller lösenord.",
      "Wrong email or password.",
    ],
    "not-activated": [
      "Kontot är inte aktiverat.",
      "The account is not activated.",
    ],
    offline: ["Ingen anslutning. Försök igen.", "No connection. Try again."],
    "mfa-required": ["Tvåstegsverifiering", "Two-step verification"],
    "auth-bootstrap": [
      "Inloggningen kunde inte läsas in.",
      "Your sign-in could not be loaded.",
    ],
  };
  return Object.entries(messages)
    .filter(([, variants]) =>
      variants.some((message) => text.includes(message)),
    )
    .map(([code]) => code);
}

export function safeFailureCategory(output) {
  if (
    /Failed to start.*driver|Unable to (?:connect to|launch|start).*driver|driver.*(?:unavailable|not ready)|DriverStartupException/i.test(
      output,
    )
  )
    return "driver-startup";
  if (
    /Invalid flow|Syntax error|Unknown command|Unrecognized field|Cannot deserialize|InvalidCommand|Malformed|Yaml.*Exception/i.test(
      output,
    )
  )
    return "flow-syntax";
  if (/Element not found|No nodes found/i.test(output))
    return "element-not-found";
  if (/Assertion is false|Assertion.*failed/i.test(output)) return "assertion";
  if (/Failed to input|AutoFill/i.test(output)) return "text-input";
  return "unclassified";
}

// Never include command values, evaluated variables, errors or UI hierarchies.
export function safeCommandProgress(report) {
  const kinds = new Set([
    "defineVariablesCommand",
    "applyConfigurationCommand",
    "launchAppCommand",
    "assertConditionCommand",
    "tapOnElement",
    "scrollUntilVisible",
    "inputTextCommand",
    "pressKeyCommand",
    "waitForAnimationToEndCommand",
    "takeScreenshotCommand",
  ]);
  const statuses = new Set([
    "PENDING",
    "RUNNING",
    "COMPLETED",
    "FAILED",
    "SKIPPED",
    "WARNED",
  ]);
  if (!Array.isArray(report)) return [];
  return report.map((entry, index) => ({
    step: index,
    kind:
      Object.keys(entry?.command ?? {}).find((key) => kinds.has(key)) ??
      "other",
    status: statuses.has(entry?.metadata?.status)
      ? entry.metadata.status
      : "UNKNOWN",
  }));
}

export function selectCaptureSimulator(
  listing,
  minimumVersion,
  target = "ipad",
) {
  if (!["ipad", "iphone"].includes(target))
    throw new Error("Unsupported capture device");
  const types = listing.devicetypes.filter((d) =>
    target === "ipad"
      ? /^iPad Pro 13-inch/.test(d.name)
      : d.name === "iPhone 16 Pro",
  );
  const runtimes = listing.runtimes
    .filter(
      (r) =>
        r.isAvailable &&
        /^i(?:Pad)?OS /.test(r.name) &&
        r.version.localeCompare(minimumVersion, "en", { numeric: true }) >= 0,
    )
    .sort((a, b) =>
      b.version.localeCompare(a.version, "en", { numeric: true }),
    );
  for (const runtime of runtimes) {
    const supported = new Set(
      (runtime.supportedDeviceTypes ?? []).map((d) => d.identifier),
    );
    for (const existing of listing.devices?.[runtime.identifier] ?? []) {
      if (existing.isAvailable && existing.deviceTypeIdentifier)
        supported.add(existing.deviceTypeIdentifier);
    }
    const type = types.find((d) => supported.has(d.identifier));
    if (type) return { type, runtime };
  }
  throw new Error(
    "No installed runtime supports the requested capture device and the app's minimum OS version.",
  );
}

export function screenshotName(locale, index) {
  if (
    !locales.includes(locale) ||
    !Number.isInteger(index) ||
    !screens[index]
  ) {
    throw new Error("Unsupported screenshot target");
  }
  return `${locale}-${String(index + 1).padStart(2, "0")}-${screens[index]}`;
}

const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wait = (visible) => ({ extendedWaitUntil: { visible, timeout: 60000 } });
const tapId = (id) => ({ tapOn: { id } });

export function captureFlow(locale) {
  if (!locales.includes(locale)) throw new Error("Unsupported locale");
  const sv = locale === "sv-SE";
  const store = sv ? "Andra varvet — Demo" : "Second Story — Demo";
  const ready = [
    sv ? "Senaste försäljningarna" : "Recent sales",
    sv ? "[1-9][0-9]* varor" : "[1-9][0-9]* items",
    sv ? "Tillgängligt saldo" : "Available balance",
    sv ? "[1-9][0-9]* varor" : "[1-9][0-9]* items",
    sv ? "Inloggad som" : "Signed in as",
  ];
  const commands = [
    { launchApp: { clearState: true, clearKeychain: true } },
    wait("(Choose store|Välj butik)"),
    { tapOn: "(Language: English|Språk: Svenska)" },
    { tapOn: sv ? "Svenska" : "English" },
    { tapOn: sv ? "Stäng" : "Close" },
    {
      scrollUntilVisible: {
        element: { text: literal(store) },
        direction: "DOWN",
        timeout: 60000,
      },
    },
    { tapOn: literal(store) },
    wait({ id: "login-email" }),
    tapId("login-email"),
    {
      inputText: {
        text: "${MAESTRO_SCREENSHOT_EMAIL}",
        label: "Enter demo email",
      },
    },
    tapId("login-password"),
    {
      inputText: {
        text: "${MAESTRO_SCREENSHOT_PASSWORD}",
        label: "Enter demo password",
      },
    },
    // Tap the actual submit control. iOS Password AutoFill can consume Enter.
    {
      tapOn: {
        text: sv ? "Logga in" : "Log in",
        below: { id: "login-password" },
      },
    },
    wait({ id: "tab-overview" }),
  ];
  const tabs = ["overview", "items", "money", "store", "profile"];
  for (const [index, tab] of tabs.entries()) {
    commands.push(tapId(`tab-${tab}`), wait(ready[index]));
    // Wait for native transitions to settle; no financial controls are tapped.
    commands.push({ waitForAnimationToEnd: { timeout: 10000 } });
    commands.push({ takeScreenshot: { path: screenshotName(locale, index) } });
  }
  return `appId: ${appId}\n---\n${JSON.stringify(commands, null, 2)}\n`;
}

export function screenshotSize(bytes, target = "ipad") {
  if (!["ipad", "iphone"].includes(target))
    throw new Error("Unsupported capture device");
  if (
    bytes.length < 24 ||
    !bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    bytes.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new Error("Not a PNG screenshot");
  }
  const width = bytes.readUInt32BE(16),
    height = bytes.readUInt32BE(20);
  const allowed =
    target === "ipad"
      ? [
          [2064, 2752],
          [2048, 2732],
        ]
      : [
          [1206, 2622],
          [1179, 2556],
        ];
  if (!allowed.some(([w, h]) => width === w && height === h)) {
    throw new Error(
      `Unexpected ${target} screenshot dimensions: ${width}x${height}`,
    );
  }
  return { width, height };
}
