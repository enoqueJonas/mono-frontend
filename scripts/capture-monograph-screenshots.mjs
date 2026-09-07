import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.MONO_BASE_URL || "http://127.0.0.1:3000";
const phone = process.env.MONO_SCREENSHOT_PHONE;
const password = process.env.MONO_SCREENSHOT_PASSWORD;
const groupId = process.env.MONO_SCREENSHOT_GROUP_ID;
const credentialId = process.env.MONO_SCREENSHOT_CREDENTIAL_ID;
const outputDir = path.resolve(process.env.MONO_SCREENSHOT_DIR || "monograph-screenshots");

if (!phone || !password) throw new Error("Defina MONO_SCREENSHOT_PHONE e MONO_SCREENSHOT_PASSWORD antes de executar o script.");
if (!groupId) throw new Error("Defina MONO_SCREENSHOT_GROUP_ID com o grupo que será apresentado na monografia.");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, locale: "pt-PT" });
const page = await context.newPage();
const browserMessages = [];

page.on("console", (message) => {
  const line = `[browser:${message.type()}] ${message.text()}`;
  browserMessages.push(line);
  console.log(line);
});
page.on("pageerror", (error) => {
  const line = `[browser:pageerror] ${error.message}`;
  browserMessages.push(line);
  console.error(line);
});
page.on("requestfailed", (request) => {
  const line = `[browser:requestfailed] ${request.method()} ${request.url()} — ${request.failure()?.errorText || "unknown"}`;
  browserMessages.push(line);
  console.error(line);
});

async function settle() {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(500);
}

async function capture(filename, url, options = {}) {
  await page.goto(`${baseURL}${url}`, { waitUntil: "domcontentloaded" });
  await settle();
  if (options.prepare) {
    await options.prepare();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: options.fullPage ?? true });
  console.log(`✓ ${filename}`);
}

async function loginDiagnostics(reason) {
  const diagnosticPath = path.join(outputDir, "login-failure.png");
  await page.screenshot({ path: diagnosticPath, fullPage: true }).catch(() => {});

  const state = await page.evaluate(() => {
    const phoneInput = document.querySelector("#phone_number");
    const passwordInput = document.querySelector("#password");
    const submit = document.querySelector('button[type="submit"]');
    const form = submit?.closest("form");
    return {
      url: window.location.href,
      readyState: document.readyState,
      phoneValue: phoneInput instanceof HTMLInputElement ? phoneInput.value : null,
      passwordLength: passwordInput instanceof HTMLInputElement ? passwordInput.value.length : null,
      submitDisabled: submit instanceof HTMLButtonElement ? submit.disabled : null,
      formExists: Boolean(form),
      bodyText: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 1200),
    };
  });

  throw new Error(
    `${reason}\nDiagnóstico do browser: ${JSON.stringify(state, null, 2)}\n` +
    `Screenshot: ${diagnosticPath}\n` +
    `Últimos logs: ${browserMessages.slice(-15).join(" | ") || "nenhum"}`
  );
}

async function login() {
  const phoneInput = page.getByLabel("Número de telefone");
  const passwordInput = page.getByLabel("Palavra-passe");
  const submit = page.getByRole("button", { name: "Entrar" });

  await phoneInput.fill(phone);
  await passwordInput.fill(password);
  await phoneInput.blur();
  await passwordInput.blur();

  console.log(`Login: telefone preenchido (${await phoneInput.inputValue()}); password preenchida (${(await passwordInput.inputValue()).length} caracteres).`);

  const loginResponsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && response.url().includes("/api/v1/accounts/login/"),
    { timeout: 8000 }
  );

  await submit.click();

  let response;
  try {
    response = await loginResponsePromise;
  } catch {
    await page.waitForTimeout(500);
    await loginDiagnostics("O clique em Entrar não originou uma resposta do endpoint de login.");
  }

  console.log(`Login API: ${response.status()} ${response.url()}`);
  if (!response.ok()) {
    const body = await response.text().catch(() => "");
    await loginDiagnostics(`A API de login respondeu com HTTP ${response.status()}. ${body}`);
  }

  try {
    await page.waitForURL(/\/dashboard(?:\/|\?|$)/, { timeout: 15000, waitUntil: "domcontentloaded" });
  } catch {
    await loginDiagnostics("A API de login respondeu com sucesso, mas a aplicação não chegou ao Dashboard.");
  }
  await settle();
}

try {
  await capture("01-login.png", "/login", { fullPage: false });
  await login();

  await page.screenshot({ path: path.join(outputDir, "02-dashboard.png"), fullPage: true });
  console.log("✓ 02-dashboard.png");

  await capture("03-create-group.png", "/groups/new", {
    prepare: async () => {
      await page.getByLabel("Nome do grupo").fill("Xitique Família");
      await page.getByLabel("Descrição").fill("Círculo mensal familiar para poupança e apoio financeiro entre os membros.");
    },
  });

  await capture("04-group-details.png", `/groups/${groupId}`);
  await capture("05-group-members.png", `/groups/${groupId}/members`);
  await capture("06-contributions.png", `/groups/${groupId}/contributions`);
  await capture("07-rotation.png", `/groups/${groupId}/rotation`);
  await capture("08-disbursements.png", `/groups/${groupId}/disbursements`);
  await capture("09-credentials.png", "/credentials");

  if (credentialId) await capture("10-credential-details.png", `/credentials/${credentialId}`);
  else console.log("– 10-credential-details.png ignorado: MONO_SCREENSHOT_CREDENTIAL_ID não definido.");

  console.log(`\nScreenshots guardados em: ${outputDir}`);
} finally {
  await browser.close();
}
