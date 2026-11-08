import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";

type Role = "manager" | "beneficiary" | "voter1" | "voter2" | "outsider";
type Scenario = "reversal" | "membership" | "small" | "legacy";
type Fixture = {
  users: Record<Role, { id: string; phone: string }>;
  groups: Record<Scenario, { id: string; memberships: Partial<Record<Role, string>> }>;
};
type Session = { page: Page; token: string };
const uiBase = process.env.RN06_E2E_UI_URL ?? "http://127.0.0.1:3000";
const apiBase = process.env.RN06_E2E_API_URL ?? "http://127.0.0.1:8000";

function fixture(): Fixture {
  const filename = process.env.RN06_E2E_FIXTURE_PATH;
  if (!filename || !process.env.RN06_E2E_PASSWORD) throw new Error("Disposable RN06 fixture and password required.");
  return JSON.parse(readFileSync(path.resolve(filename), "utf8")) as Fixture;
}

async function login(browser: Browser, request: APIRequestContext, data: Fixture, scenario: Scenario, role: Role, contexts: BrowserContext[]): Promise<Session> {
  const context = await browser.newContext({ locale: "pt-PT" });
  contexts.push(context);
  const page = await context.newPage();
  await page.goto(uiBase + "/login");
  await page.getByLabel("Número de telefone").fill(data.users[role].phone);
  await page.getByLabel("Palavra-passe").fill(process.env.RN06_E2E_PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\/|\?|$)/, { timeout: 20_000 });
  const token = await page.evaluate(() => localStorage.getItem("mono_access_token"));
  expect(token, "Missing independent JWT for " + role).toBeTruthy();
  const who = await request.get(apiBase + "/api/v1/accounts/me/", { headers: { Authorization: "Bearer " + token } });
  expect(who.status()).toBe(200);
  const whoJson = await who.json() as { data: { id: string } };
  expect(String(whoJson.data.id)).toBe(data.users[role].id);
  await page.goto(uiBase + "/groups/" + data.groups[scenario].id + "/disbursements");
  await expect(page.getByRole("heading", { name: "Xitique RN06 — " + scenario })).toBeVisible();
  return { page, token: token! };
}

function endpoint(id: string) { return "/api/v1/groups/" + id + "/disbursements/"; }

async function propose(page: Page) {
  await page.getByRole("button", { name: "Criar desembolso" }).click();
  await expect(page.getByText("Desembolso criado com sucesso.")).toBeVisible();
  await expect(page.locator("article").first()).toContainText("Aprovações: 0 de 2");
}

async function vote(page: Page, count: number) {
  await page.reload();
  await page.getByRole("button", { name: "Registar o meu voto" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar voto" }).click();
  await expect(page.locator("article").first()).toContainText("Aprovações: " + count + " de 2");
}

async function latest(request: APIRequestContext, id: string, token: string) {
  const response = await request.get(apiBase + endpoint(id), { headers: { Authorization: "Bearer " + token } });
  expect(response.status()).toBe(200);
  const body = await response.json() as { data: Array<{ id: string; status: string; approval_count: number }> };
  expect(body.data).toHaveLength(1);
  return body.data[0];
}

async function rotationCurrent(request: APIRequestContext, id: string, token: string) {
  const response = await request.get(apiBase + "/api/v1/groups/" + id + "/rotation/?cycle_number=1", { headers: { Authorization: "Bearer " + token } });
  expect(response.status()).toBe(200);
  const body = await response.json() as { data: Array<{ status: string }> };
  expect(body.data).toHaveLength(1);
  expect(body.data[0].status).toBe("CURRENT");
}

async function rejectedCompletion(page: Page) {
  await page.reload();
  await page.getByRole("button", { name: "Registar conclusão administrativa" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Registar", exact: true }).click();
  await expect(page.getByText("Nem todas as contribuições esperadas estão confirmadas.")).toBeVisible();
  await expect(page.getByText("Conclusão administrativa registada. Isto não confirma uma transferência financeira externa.")).toHaveCount(0);
}

test("RN06: a contribution reversed after two UI votes blocks completion", async ({ browser, request }) => {
  const data = fixture(), id = data.groups.reversal.id, contexts: BrowserContext[] = [];
  try {
    const manager = await login(browser, request, data, "reversal", "manager", contexts);
    const a = await login(browser, request, data, "reversal", "voter1", contexts);
    const b = await login(browser, request, data, "reversal", "voter2", contexts);
    await propose(manager.page);
    await vote(a.page, 1);
    await vote(b.page, 2);
    expect((await latest(request, id, manager.token)).status).toBe("APPROVED");

    // Real ephemeral PostgreSQL mutation, not route mocking or external payment reversal.
    const output = execFileSync("python", ["manage.py", "shell", "-c", 'exec(open("integration_tests/inject_rn06_ui_fault.py").read())'], {
      cwd: path.resolve("backend"),
      env: { ...process.env, RN06_E2E_FAULT_SCENARIO: "reversal" },
      encoding: "utf8",
    });
    expect(output).toContain("RN06_FAULT_INJECTED");
    await rejectedCompletion(manager.page);
    expect((await latest(request, id, manager.token)).status).toBe("APPROVED");
    await rotationCurrent(request, id, manager.token);
  } finally { await Promise.all(contexts.map(c => c.close())); }
});

test("RN06: joining after proposal cannot vote and invalidates the approved snapshot", async ({ browser, request }) => {
  const data = fixture(), id = data.groups.membership.id, contexts: BrowserContext[] = [];
  try {
    const manager = await login(browser, request, data, "membership", "manager", contexts);
    const a = await login(browser, request, data, "membership", "voter1", contexts);
    const b = await login(browser, request, data, "membership", "voter2", contexts);
    await propose(manager.page);
    const proposal = await latest(request, id, manager.token);
    const joined = await request.post(apiBase + "/api/v1/groups/" + id + "/members/", {
      headers: { Authorization: "Bearer " + manager.token },
      data: { phone_number: data.users.outsider.phone },
    });
    expect(joined.status()).toBe(201);
    const late = await login(browser, request, data, "membership", "outsider", contexts);
    await expect(late.page.getByRole("button", { name: "Registar o meu voto" })).toHaveCount(0);
    const denied = await request.post(apiBase + endpoint(id) + proposal.id + "/approve/", {
      headers: { Authorization: "Bearer " + late.token },
    });
    expect(denied.status()).toBe(400);
    await vote(a.page, 1);
    await vote(b.page, 2);
    await rejectedCompletion(manager.page);
    expect((await latest(request, id, manager.token)).status).toBe("APPROVED");
    await rotationCurrent(request, id, manager.token);
  } finally { await Promise.all(contexts.map(c => c.close())); }
});

test("RN06: a three-member group cannot propose without independent quorum", async ({ browser, request }) => {
  const data = fixture(), id = data.groups.small.id, contexts: BrowserContext[] = [];
  try {
    const manager = await login(browser, request, data, "small", "manager", contexts);
    await manager.page.getByRole("button", { name: "Criar desembolso" }).click();
    await expect(manager.page.getByText(/Não existem dois membros independentes elegíveis/)).toBeVisible();
    const response = await request.get(apiBase + endpoint(id), { headers: { Authorization: "Bearer " + manager.token } });
    expect(response.status()).toBe(200);
    const body = await response.json() as { data: unknown[] };
    expect(body.data).toHaveLength(0);
    await rotationCurrent(request, id, manager.token);
  } finally { await Promise.all(contexts.map(c => c.close())); }
});

test("RN06: legacy requires_consensus=false cannot silently approve", async ({ browser, request }) => {
  const data = fixture(), id = data.groups.legacy.id, contexts: BrowserContext[] = [];
  try {
    const manager = await login(browser, request, data, "legacy", "manager", contexts);
    await propose(manager.page);
    const proposal = await latest(request, id, manager.token);
    expect(proposal.status).toBe("AWAITING_CONSENSUS");
    expect(proposal.approval_count).toBe(0);
    const completion = await request.post(apiBase + endpoint(id) + proposal.id + "/complete/", {
      headers: { Authorization: "Bearer " + manager.token },
    });
    expect(completion.status()).toBe(400);
    await rotationCurrent(request, id, manager.token);
  } finally { await Promise.all(contexts.map(c => c.close())); }
});
