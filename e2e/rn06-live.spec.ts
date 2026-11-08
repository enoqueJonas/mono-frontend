import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

interface FixtureUser { id: string; phone: string }
type Role = "manager" | "beneficiary" | "voter1" | "voter2" | "outsider";
interface Fixture {
  groupId: string;
  users: Record<Role, FixtureUser>;
  cycleNumber: number;
  requiredApprovals: number;
  expectedAmount: string;
}
interface Session {
  context: BrowserContext;
  page: Page;
  token: string;
}

const uiBase = process.env.RN06_E2E_UI_URL ?? "http://127.0.0.1:3000";
const apiBase = process.env.RN06_E2E_API_URL ?? "http://127.0.0.1:8000";
const password = process.env.RN06_E2E_PASSWORD;
const fixtureFile = process.env.RN06_E2E_FIXTURE_PATH;

test("RN06: real login + independent votes + administrative completion", async ({ browser, request }) => {
  if (!password || !fixtureFile) {
    throw new Error("Live E2E requires RN06_E2E_PASSWORD and RN06_E2E_FIXTURE_PATH");
  }
  const fixture = JSON.parse(
    readFileSync(path.resolve(fixtureFile), "utf8")
  ) as Fixture;
  const endpoint = `/api/v1/groups/${fixture.groupId}/disbursements/`;
  const sessions: BrowserContext[] = [];

  async function enter(role: Role): Promise<Session> {
    // Each real browser context owns different localStorage/JWT/cookies.
    // There is NO route interception or fake API response in this test.
    const context = await browser.newContext({ locale: "pt-PT" });
    sessions.push(context);
    const page = await context.newPage();
    await page.goto(`${uiBase}/login`);
    await page.getByLabel("Número de telefone").fill(fixture.users[role].phone);
    await page.getByLabel("Palavra-passe").fill(password!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard(?:\/|\?|$)/, { timeout: 20_000 });

    const token = await page.evaluate(() => localStorage.getItem("mono_access_token"));
    expect(token, `Missing JWT in ${role} isolated context`).toBeTruthy();

    const who = await request.get(`${apiBase}/api/v1/accounts/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(who.status()).toBe(200);
    const whoJson = await who.json() as { data?: { id: string } };
    expect(String(whoJson.data?.id)).toBe(fixture.users[role].id);

    if (role !== "outsider") {
      await page.goto(`${uiBase}/groups/${fixture.groupId}/disbursements`);
      await expect(
        page.getByRole("heading", { name: "Xitique RN06 — baseline" })
      ).toBeVisible();
    }
    return { context, page, token: token! };
  }

  async function apiPost(route: string, token: string) {
    return request.post(`${apiBase}${route}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async function refreshAndCheck(page: Page, fragment: string) {
    await page.reload();
    await expect(page.locator("article").first()).toContainText(fragment);
  }

  try {
    const manager = await enter("manager");
    const beneficiary = await enter("beneficiary");
    const voterA = await enter("voter1");
    const voterB = await enter("voter2");
    const outsider = await enter("outsider");

    // Create the proposal through the actual Next.js form.
    await manager.page.getByRole("button", { name: "Criar desembolso" }).click();
    await expect(manager.page.getByText("Desembolso criado com sucesso.")).toBeVisible();
    await expect(manager.page.locator("article").first()).toContainText("Aprovações: 0 de 2");

    const firstList = await request.get(`${apiBase}${endpoint}`, {
      headers: { Authorization: `Bearer ${manager.token}` },
    });
    expect(firstList.status()).toBe(200);
    const firstData = await firstList.json() as { data: Array<{ id: string; status: string; amount: string }> };
    expect(firstData.data).toHaveLength(1);
    const disbursementId = firstData.data[0].id;
    const approvalRoute = `${endpoint}${disbursementId}/approve/`;
    const completionRoute = `${endpoint}${disbursementId}/complete/`;
    expect(firstData.data[0].status).toBe("AWAITING_CONSENSUS");
    expect(String(firstData.data[0].amount)).toBe(fixture.expectedAmount);

    // Direct HTTP attempts prove that hiding UI controls is NOT the security boundary.
    expect((await apiPost(completionRoute, manager.token)).status()).toBe(400);
    expect((await apiPost(approvalRoute, manager.token)).status()).toBe(400);
    expect((await apiPost(approvalRoute, beneficiary.token)).status()).toBe(400);
    expect((await apiPost(approvalRoute, outsider.token)).status()).toBe(400);
    await refreshAndCheck(beneficiary.page, "Aprovações: 0 de 2");
    await expect(beneficiary.page.getByRole("button", { name: "Registar o meu voto" })).toHaveCount(0);
    await expect(manager.page.getByRole("button", { name: "Registar o meu voto" })).toHaveCount(0);

    // Voter A: one vote is insufficient; same token must not approve twice.
    await refreshAndCheck(voterA.page, "Aprovações: 0 de 2");
    await voterA.page.getByRole("button", { name: "Registar o meu voto" }).click();
    await voterA.page.getByRole("button", { name: "Confirmar voto" }).click();
    await expect(voterA.page.locator("article").first()).toContainText("Aprovações: 1 de 2");
    await expect(voterA.page.getByRole("button", { name: "Registar o meu voto" })).toHaveCount(0);
    expect((await apiPost(approvalRoute, voterA.token)).status()).toBe(400);

    // Voter B is a separate, authenticated browser, not a reused JWT.
    await refreshAndCheck(voterB.page, "Aprovações: 1 de 2");
    await voterB.page.getByRole("button", { name: "Registar o meu voto" }).click();
    await voterB.page.getByRole("button", { name: "Confirmar voto" }).click();
    await expect(voterB.page.locator("article").first()).toContainText("Aprovações: 2 de 2");

    // Manager may ONLY mark administrative completion after quorum.
    await refreshAndCheck(manager.page, "Aprovações: 2 de 2");
    await manager.page.getByRole("button", { name: "Registar conclusão administrativa" }).click();
    await manager.page.getByRole("button", { name: "Registar", exact: true }).click();
    await expect(manager.page.getByText(
      "Conclusão administrativa registada. Isto não confirma uma transferência financeira externa."
    )).toBeVisible();

    const finished = await request.get(`${apiBase}${endpoint}${disbursementId}/`, {
      headers: { Authorization: `Bearer ${manager.token}` },
    });
    expect(finished.status()).toBe(200);
    const finishedJson = await finished.json() as {
      data: { status: string; approval_count: number; required_approvals: number }
    };
    expect(finishedJson.data.status).toBe("COMPLETED");
    expect(finishedJson.data.approval_count).toBe(2);
    expect(finishedJson.data.required_approvals).toBe(2);

    const rotation = await request.get(
      `${apiBase}/api/v1/groups/${fixture.groupId}/rotation/?cycle_number=1`,
      { headers: { Authorization: `Bearer ${manager.token}` } }
    );
    expect(rotation.status()).toBe(200);
    const rotationData = await rotation.json() as { data: Array<{ status: string }> };
    expect(rotationData.data).toHaveLength(1);
    expect(rotationData.data[0].status).toBe("COMPLETED");

    await manager.page.screenshot({ path: "test-results/rn06-live-completed.png", fullPage: true });
  } finally {
    await Promise.all(sessions.map(async (context) => context.close()));
  }
});
