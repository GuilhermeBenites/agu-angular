import { expect, test, Page, APIRequestContext } from '@playwright/test';
const api = process.env['API_BASE_URL']!;
const password = 'example-password-123';
async function account(request: APIRequestContext) {
  const username = `tasks_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  expect((await request.post(`${api}/register`, { data: { username, password } })).status()).toBe(
    201,
  );
  const session = await request.post(`${api}/login`, { data: { username, password } });
  expect(session.ok()).toBeTruthy();
  return { username, token: (await session.json()).token as string };
}
async function login(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('Nome de usuário', { exact: true }).fill(username);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole('heading', { name: 'Suas tarefas', exact: false })).toBeVisible();
}
async function seed(
  request: APIRequestContext,
  token: string,
  title: string,
  description: string | null = null,
) {
  const response = await request.post(`${api}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { title, description },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id as number;
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
}
const unavailable = {
  error: { code: 'internal_error', message: 'Serviço temporariamente indisponível.', details: [] },
  requestId: '0123456789abcdef0123456789abcdef',
};
test.beforeEach(async ({ page }) => {
  await page.route('**/assets/config.json', (route) =>
    route.fulfill({ json: { apiBaseUrl: api } }),
  );
});

test('CRUD real, edição por URL, confirmação e navegação por teclado', async ({
  page,
  request,
}, info) => {
  const user = await account(request);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page, user.username);
  await expect(page.getByRole('link', { name: 'Criar minha primeira tarefa' })).toBeVisible();
  await page.screenshot({
    path: `.artifacts/phase3-empty-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('link', { name: 'Nova tarefa', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'Nova tarefa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Criar tarefa', exact: true }).click();
  await expect(page.locator('mat-error')).toContainText('Informe um título.');
  await page.getByLabel('Título', { exact: true }).focus();
  await page.keyboard.insertText('Preparar demonstração');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Descrição (opcional)')).toBeFocused();
  await page.keyboard.insertText('Revisar os principais fluxos e compartilhar as decisões.');
  await page.screenshot({
    path: `.artifacts/phase3-form-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Cancelar', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Criar tarefa', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.locator('.task-row')).toHaveCount(1);
  await expect(page.getByRole('status')).toContainText('Tarefa criada.');
  await noOverflow(page);
  await page.screenshot({
    path: `.artifacts/phase3-tasks-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('link', { name: 'Editar Preparar demonstração', exact: true }).click();
  await expect(page).toHaveURL(/\/tasks\/\d+\/edit$/);
  const editUrl = page.url();
  await page.reload();
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Preparar demonstração');
  await page.getByLabel('Título', { exact: true }).fill('Demonstração revisada');
  await page.getByLabel('Descrição (opcional)').fill('');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.locator('.task-row')).toContainText('Demonstração revisada');
  await expect(page.locator('.task-description')).toHaveText('Sem descrição');
  await page.getByRole('button', { name: 'Excluir Demonstração revisada' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused();
  await page.screenshot({
    path: `.artifacts/phase3-delete-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Excluir Demonstração revisada' })).toBeFocused();
  await expect(page.locator('.task-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Excluir Demonstração revisada' }).click();
  await page.getByRole('button', { name: 'Excluir tarefa', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Criar minha primeira tarefa' })).toBeVisible();
  await page.goto(editUrl);
  await expect(page.getByRole('alert')).toContainText('Tarefa não encontrada.');
  await expect(page.locator('form')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('paginação real permite percorrer tudo e excluir o último item da última página', async ({
  page,
  request,
}, info) => {
  const user = await account(request);
  for (let i = 1; i <= 21; i++)
    await seed(
      request,
      user.token,
      `Tarefa ${String(i).padStart(2, '0')}`,
      i === 21 ? 'x'.repeat(1000) : null,
    );
  await login(page, user.username);
  await expect(page.locator('.task-row')).toHaveCount(20);
  await noOverflow(page);
  await page.screenshot({
    path: `.artifacts/phase3-pagination-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  const first = await page.locator('.task-title').allTextContents();
  await page.getByRole('button', { name: 'Próxima página', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(1);
  const last = await page.locator('.task-title').allTextContents();
  expect(new Set([...first, ...last]).size).toBe(21);
  expect(last).toEqual(['Tarefa 01']);
  await page.locator('.task-row').getByRole('button', { name: 'Excluir', exact: false }).click();
  await page.getByRole('button', { name: 'Excluir tarefa', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(20);
  await expect(page.getByRole('button', { name: 'Próxima página', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Por página' }).click();
  await page.getByRole('option', { name: '10', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(10);
  await page.getByRole('button', { name: 'Próxima página', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(10);
  await noOverflow(page);
});

test('duas contas permanecem isoladas na API, na edição direta e após trocar sessão', async ({
  page,
  request,
}) => {
  const a = await account(request);
  const b = await account(request);
  const id = await seed(request, a.token, 'Plano privado da conta A', 'Informação exclusiva');
  await login(page, a.username);
  await expect(page.locator('.task-row')).toContainText('Plano privado da conta A');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await login(page, b.username);
  await expect(page.getByRole('link', { name: 'Criar minha primeira tarefa' })).toBeVisible();
  await expect(page.getByText('Plano privado da conta A', { exact: true })).toHaveCount(0);
  await page.goto(`/tasks/${id}/edit`);
  await expect(page.getByRole('alert')).toContainText('Tarefa não encontrada.');
  await expect(page.locator('form')).toHaveCount(0);
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const response = await request.fetch(`${api}/tasks/${id}`, {
      method,
      headers: { Authorization: `Bearer ${b.token}` },
      data: method === 'PUT' ? { title: 'Invasão', description: null } : undefined,
    });
    expect(response.status()).toBe(404);
    expect((await response.json()).error.code).toBe('task_not_found');
  }
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await login(page, a.username);
  await expect(page.locator('.task-row')).toContainText('Plano privado da conta A');
  await expect(page.locator('.task-row')).toContainText('Informação exclusiva');
});

test('falhas temporárias na lista e nas escritas preservam dados e permitem nova tentativa', async ({
  page,
  request,
}) => {
  const user = await account(request);
  await login(page, user.username);
  await page.route('**/api/tasks?*', (route) => route.fulfill({ status: 503, json: unavailable }));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar');
  await page.unroute('**/api/tasks?*');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('link', { name: 'Criar minha primeira tarefa' })).toBeVisible();
  await page.getByRole('link', { name: 'Nova tarefa', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'Nova tarefa', exact: true })).toBeVisible();
  await page.getByLabel('Título', { exact: true }).fill('Manter meu texto');
  await page.getByLabel('Descrição (opcional)').fill('Detalhes importantes');
  await page.route('**/api/tasks', (route) => route.fulfill({ status: 503, json: unavailable }));
  await page.getByRole('button', { name: 'Criar tarefa', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Serviço temporariamente');
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Manter meu texto');
  await page.unroute('**/api/tasks');
  await page.getByRole('button', { name: 'Criar tarefa', exact: true }).click();
  await expect(page.locator('.task-row')).toHaveCount(1);
  await page.getByRole('link', { name: 'Editar Manter meu texto', exact: true }).click();
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Manter meu texto');
  await page.getByLabel('Título', { exact: true }).fill('Edição preservada');
  await page.route('**/api/tasks/*', (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({ status: 503, json: unavailable })
      : route.continue(),
  );
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('alert')).toContainText('Serviço temporariamente');
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Edição preservada');
  await expect(page.getByLabel('Descrição (opcional)')).toHaveValue('Detalhes importantes');
  await page.unroute('**/api/tasks/*');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.locator('.task-row')).toContainText('Edição preservada');
  await page.route('**/api/tasks/*', (route) =>
    route.request().method() === 'DELETE'
      ? route.fulfill({ status: 503, json: unavailable })
      : route.continue(),
  );
  await page.getByRole('button', { name: 'Excluir Edição preservada' }).click();
  await page.getByRole('button', { name: 'Excluir tarefa', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível excluir');
  await expect(page.locator('.task-row')).toHaveCount(1);
  await page.unroute('**/api/tasks/*');
  await page.getByRole('button', { name: 'Excluir Edição preservada' }).click();
  await page.getByRole('button', { name: 'Excluir tarefa', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Criar minha primeira tarefa' })).toBeVisible();
});
