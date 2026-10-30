/**
 * Full real-browser path to Django/PostgreSQL/Ganache, with synthetic test data.
 * NO API mocks. The API responses and Solidity contracts are genuine ephemeral services.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const WEB = 'http://127.0.0.1:3000';
const API = 'http://127.0.0.1:8000';
const MANAGER = '+258841000001';
const HOLDER = '+258841000002';
const PASSWORD = 'qa-synthetic-password-2026';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
page.setDefaultTimeout(15000);
page.on('response', async response => {
  if (response.url().startsWith(API + '/api/') && response.status() >= 400) {
    console.log('API FAILURE', response.status(), response.url(), (await response.text()).slice(0, 1500));
  }
});
const api = async (endpoint, method = 'GET', body) => page.evaluate(async ({ endpoint, method, body, API }) => {
  const token = localStorage.getItem('mono_access_token');
  const res = await fetch(API + endpoint, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: res.status, data: await res.json() };
}, { endpoint, method, body, API });
const assert = (condition, message) => {
  if (!condition) throw new Error('E2E ASSERTION: ' + message);
};
try {
  // Login through the real Next.js interface / Django JWT service.
  await page.goto(WEB + '/login', { waitUntil: 'domcontentloaded' });
  await page.locator('#phone_number').fill(MANAGER);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  console.log('PASS UI->API login / JWT');

  // Create a fully configured group through the frontend. Backend anchors its settings.
  await page.goto(WEB + '/groups/new', { waitUntil: 'domcontentloaded' });
  await page.locator('#name').fill('Xitique de Validação Integrada');
  await page.getByRole('button', { name: 'Continuar para Configurações' }).click();
  await page.locator('#contribution_amount').fill('1000.00');
  await page.locator('#maximum_members').fill('10');
  await page.locator('#contribution_frequency').selectOption('MONTHLY');
  await page.locator('#rotation_strategy').selectOption('FIXED_ORDER');
  await page.locator('input[type="checkbox"][name="settings.allow_manual_contributions"]').check();
  await page.getByRole('button', { name: 'Criar grupo', exact: true }).click();
  await page.waitForURL(/\/groups\/[0-9a-f-]{36}$/, { timeout: 30000 });
  const groupId = page.url().split('/').at(-1);
  assert(groupId, 'Group creation did not return an ID');
  console.log('PASS UI->API->Ganache group creation and settings anchoring');

  // Add synthetic, pre-registered holder using the real UI.
  await page.goto(WEB + '/groups/' + groupId + '/members', { waitUntil: 'domcontentloaded' });
  await page.locator('#member-phone-input').fill(HOLDER);
  await page.getByRole('button', { name: 'Adicionar membro' }).click();
  const members = await (async () => {
    for (let i = 0; i < 20; i++) {
      const response = await api('/api/v1/groups/' + groupId + '/members/');
      assert(response.status === 200, 'Members API error ' + response.status);
      const list = response.data.data;
      if (Array.isArray(list) && list.length >= 2) return list;
      await page.waitForTimeout(500);
    }
    throw new Error('Holder not added via UI');
  })();
  const holder = members.find(x => x.user?.phone_number === HOLDER || x.phone_number === HOLDER || x.user?.phone_number?.endsWith('000002'));
  assert(holder, 'Could not find added holder');
  console.log('PASS UI->API add member');

  // Manual contribution: real blockchain anchor is required.
  await page.goto(WEB + '/groups/' + groupId + '/contributions', { waitUntil: 'domcontentloaded' });
  const contributionForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Registar contribuição' }) });
  await contributionForm.locator('select').first().selectOption(String(holder.id));
  await contributionForm.locator('input[placeholder="1000.00"]').fill('1000.00');
  await contributionForm.locator('input[type="date"]').fill('2026-09-01');
  await page.getByRole('button', { name: 'Registar contribuição' }).click();
  await page.getByText('Contribuição registada com sucesso.').waitFor({ timeout: 25000 });
  const contributions = await api('/api/v1/groups/' + groupId + '/contributions/');
  assert(contributions.status === 200 && contributions.data.data.some(x => String(x.member_id ?? x.group_member_id) === String(holder.id) && x.status === 'CONFIRMED') , 'Contribution not confirmed');
  console.log('PASS UI->API->PostgreSQL->Ganache manual contribution');

  // Issue VC in the frontend (signed by the backend and anchored in Ganache).
  await page.goto(WEB + '/credentials', { waitUntil: 'domcontentloaded' });
  const issueForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Emitir Credencial Verificável' }) });
  await issueForm.locator('select').first().selectOption(String(groupId));
  await issueForm.locator('select').nth(1).selectOption(String(holder.id));
  await issueForm.locator('input[type="date"]').first().fill('2026-09-01');
  await issueForm.locator('input[type="date"]').last().fill('2026-09-30');
  await page.getByRole('button', { name: 'Emitir Credencial Verificável' }).click();
  await page.getByText('Credencial Verificável emitida com sucesso.').waitFor({ timeout: 25000 });
  const creds = await api('/api/v1/credentials/groups/' + groupId + '/');
  assert(creds.status === 200, 'Cannot list issued credential');
  const credential = creds.data.data.find(x => String(x.group_member_id) === String(holder.id));
  assert(credential?.effective_status === 'ACTIVE' && credential.credential_document?.proof, 'Signed VC not active');
  console.log('PASS UI->API->PostgreSQL->Ganache issue signed VC');

  // Verify original and one tampered copy using UI (backend validators).
  const verify = async (document, expected) => {
    const verifyForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Verificar credencial' }) });
    await verifyForm.locator('textarea').fill(JSON.stringify(document));
    await verifyForm.getByRole('button', { name: 'Verificar credencial' }).click();
    await page.getByText(expected ? 'A Credencial Verificável é válida.' : 'A Credencial Verificável não é válida.').waitFor();
  };
  await verify(credential.credential_document, true);
  const tampered = structuredClone(credential.credential_document);
  tampered.credentialSubject.contributionHistory.totalAmount = '9900.00';
  await verify(tampered, false);
  console.log('PASS UI->API->Ganache valid VC and tamper detection');

  // Revoke in detail view, then verify original again via UI.
  await page.goto(WEB + '/credentials/' + credential.id, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Revogar credencial' }).waitFor();
  await page.locator('textarea[placeholder="Motivo da revogação (opcional)"]').fill('Validação experimental');
  await page.getByRole('button', { name: 'Revogar credencial' }).click();
  for (let i = 0; i < 20; i++) {
    const check = await api('/api/v1/credentials/' + credential.id + '/');
    if (check.data?.data?.effective_status === 'REVOKED') break;
    if (i === 19) throw new Error('Revocation not reflected in DB/API');
    await page.waitForTimeout(500);
  }
  await page.goto(WEB + '/credentials', { waitUntil: 'domcontentloaded' });
  await verify(credential.credential_document, false);
  console.log('PASS UI->API->Ganache revoke VC and reject post-revocation');

  console.log('E2E SUCCESS: actual Next.js + Django + PostgreSQL + Ganache, with synthetic data only');
} catch (error) {
  await fs.mkdir('test-artifacts', { recursive: true });
  await page.screenshot({ path: 'test-artifacts/integrated-error.png', fullPage: true }).catch(() => {});
  console.error('E2E FAILED:', error);
  console.error('Current page:', page.url());
  throw error;
} finally {
  await browser.close();
}
