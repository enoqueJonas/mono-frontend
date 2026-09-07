import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.MONO_BASE_URL || "http://127.0.0.1:3000";
const phone = process.env.MONO_SCREENSHOT_PHONE;
const password = process.env.MONO_SCREENSHOT_PASSWORD;
const groupId = process.env.MONO_SCREENSHOT_GROUP_ID;
const credentialId = process.env.MONO_SCREENSHOT_CREDENTIAL_ID;
const outputDir = path.resolve(process.env.MONO_SCREENSHOT_DIR || "monograph-screenshots");

if (!phone || !password) {
  throw new Error(
    "Defina MONO_SCREENSHOT_PHONE e MONO_SCREENSHOT_PASSWORD antes de executar o script."
  );
}

if (!groupId) {
  throw new Error(
    "Defina MONO_SCREENSHOT_GROUP_ID com o grupo que será apresentado na monografia."
  );
}

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  locale: "pt-PT",
});
const page = await context.newPage();

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

  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: options.fullPage ?? true,
  });
  console.log(`✓ ${filename}`);
}

try {
  // 01 — Login: capturado antes de criar uma sessão autenticada.
  await capture("01-login.png", "/login", { fullPage: false });

  // Autenticação real no sistema.
  await page.getByLabel("Número de telefone").fill(phone);
  await page.getByLabel("Palavra-passe").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/dashboard/);
  await settle();

  await page.screenshot({
    path: path.join(outputDir, "02-dashboard.png"),
    fullPage: true,
  });
  console.log("✓ 02-dashboard.png");

  // O formulário é preenchido apenas para apresentação; não é submetido.
  await capture("03-create-group.png", "/groups/new", {
    prepare: async () => {
      await page.getByLabel("Nome do grupo").fill("Xitique Família");
      await page.getByLabel("Descrição").fill(
        "Círculo mensal familiar para poupança e apoio financeiro entre os membros."
      );
    },
  });

  await capture("04-group-details.png", `/groups/${groupId}`);
  await capture("05-group-members.png", `/groups/${groupId}/members`);
  await capture("06-contributions.png", `/groups/${groupId}/contributions`);
  await capture("07-rotation.png", `/groups/${groupId}/rotation`);
  await capture("08-disbursements.png", `/groups/${groupId}/disbursements`);

  // A página reúne emissão, credenciais geridas e verificação.
  await capture("09-credentials.png", "/credentials");

  if (credentialId) {
    await capture(
      "10-credential-details.png",
      `/credentials/${credentialId}`
    );
  } else {
    console.log(
      "– 10-credential-details.png ignorado: MONO_SCREENSHOT_CREDENTIAL_ID não definido."
    );
  }

  console.log(`\nScreenshots guardados em: ${outputDir}`);
} finally {
  await browser.close();
}
