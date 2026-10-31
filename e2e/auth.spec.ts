import { expect, test, Page, APIRequestContext } from '@playwright/test';
const api = process.env['API_BASE_URL']!;
const password = 'example-password-123';
function username() {
  return `e2e_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}
async function createAccount(request: APIRequestContext) {
  const name = username();
  const result = await request.post(`${api}/register`, { data: { username: name, password } });
  expect(result.status()).toBe(201);
  return name;
}
async function login(page: Page, name: string) {
  await page.goto('/login');
  await page.getByLabel('Nome de usuário', { exact: true }).fill(name);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
}

test.beforeEach(async ({ page }) => {
  await page.route('**/assets/config.json', (route) =>
    route.fulfill({ json: { apiBaseUrl: api } }),
  );
});

test('cadastro, login, restauração e logout com API real', async ({ page }, testInfo) => {
  const name = username();
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Bom ter você por aqui.' })).toBeVisible();
  await page.screenshot({
    path: `.artifacts/phase2-login-${testInfo.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('link', { name: 'Criar uma conta' }).click();
  await expect(
    page.getByRole('heading', { name: 'Um novo espaço para suas ideias.' }),
  ).toBeVisible();
  await page.getByLabel('Nome de usuário', { exact: true }).fill(name);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password);
  await page.screenshot({
    path: `.artifacts/phase2-register-${testInfo.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.getByRole('status')).toContainText('Conta criada');
  await page.getByLabel('Nome de usuário', { exact: true }).fill(name);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole('heading', { name: `Bem-vindo, ${name}.` })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('agu.access_token'))).toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  await page.reload();
  await expect(page.getByRole('heading', { name: `Bem-vindo, ${name}.` })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem('agu.access_token'))).toBeNull();
  await page.goto('/tasks');
  await expect(page).toHaveURL(/\/login$/);
});

test('credenciais inválidas e nome de usuário duplicado têm feedback', async ({
  page,
  request,
}) => {
  const name = await createAccount(request);
  await page.goto('/login');
  await page.getByLabel('Nome de usuário', { exact: true }).fill(name);
  await page.getByLabel('Senha', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page.getByRole('alert')).toContainText('Usuário ou senha inválidos.');
  await page.getByRole('link', { name: 'Criar uma conta' }).click();
  await expect(
    page.getByRole('heading', { name: 'Um novo espaço para suas ideias.' }),
  ).toBeVisible();
  await page.getByLabel('Nome de usuário', { exact: true }).fill(name);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirmar senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.getByRole('alert')).toContainText('Nome de usuário indisponível.');
  await expect(page.locator('mat-error')).toContainText('já está em uso');
});

test('validação e confirmação de senha impedem envio inválido', async ({ page }) => {
  await page.goto('/register');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.locator('mat-error').first()).toContainText('Preencha este campo.');
  await page.getByLabel('Nome de usuário', { exact: true }).fill(username());
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirmar senha', { exact: true }).fill('different-password');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.locator('mat-error')).toContainText('As senhas precisam ser iguais.');
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
});

test('expiração encerra a sessão mesmo sem uma nova requisição', async ({ page, request }) => {
  const name = await createAccount(request);
  await page.clock.install();
  await login(page, name);
  await page.clock.fastForward('01:00:05');
  await expect(page).toHaveURL(/\/login\?reason=expired$/);
  await expect(page.getByRole('status')).toContainText('Sua sessão expirou');
  expect(await page.evaluate(() => sessionStorage.getItem('agu.access_token'))).toBeNull();
});

test('token adulterado é rejeitado pela API durante a restauração', async ({ page, request }) => {
  const name = await createAccount(request);
  await login(page, name);
  await page.evaluate(() => {
    const parts = sessionStorage.getItem('agu.access_token')!.split('.');
    parts[2] = (parts[2][0] === 'a' ? 'b' : 'a') + parts[2].slice(1);
    sessionStorage.setItem('agu.access_token', parts.join('.'));
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => sessionStorage.getItem('agu.access_token'))).toBeNull();
});

test('falha temporária na restauração preserva token e permite tentar novamente', async ({
  page,
  request,
}) => {
  const name = await createAccount(request);
  await login(page, name);
  const token = await page.evaluate(() => sessionStorage.getItem('agu.access_token'));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: { code: 'internal_error', message: 'Unavailable', details: [] },
        requestId: '0123456789abcdef0123456789abcdef',
      },
    }),
  );
  await page.reload();
  await expect(page).toHaveURL(/\/session$/);
  expect(await page.evaluate(() => sessionStorage.getItem('agu.access_token'))).toBe(token);
  await page.unroute('**/api/me');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole('heading', { name: `Bem-vindo, ${name}.` })).toBeVisible();
});
