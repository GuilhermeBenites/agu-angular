# Planejamento e integração com a API

Fase 0, contrato 0.1.0, definida em 30/10/2026. Contrato de implementação das fases 1 a 3; autenticação e tarefas concluídas nas fases 2/3, com integração Redis validada na fase 4.

## Escopo e responsabilidades

Este repositório entrega a SPA Angular com cadastro, login, sessão JWT e CRUD de tarefas responsivo. Será submetido separadamente do backend. Cada projeto mantém suas dependências, testes, CI e README e pode ser clonado em qualquer diretório.

Exportação assíncrona e RabbitMQ estão fora do escopo atual. Redis está implementado como otimização interna do backend e não altera o contrato da SPA. Tarefas têm título e descrição; conclusão de tarefa, filtros, busca e tempo real ficam fora da primeira versão.

Stack definida: Angular 17.3, TypeScript 5.4, Material 17, NgRx Store/Effects/Selectors 17, RxJS e SCSS. Usar formulários reativos tipados. O requisito explícito de NgRx prevalece sobre a alternativa genérica RxJS/NgRx/Signals do enunciado.

Node de referência: 20.20.2, fixado na fase 1. A [matriz oficial do Angular](https://angular.dev/reference/versions) coloca TypeScript 5.5 e Node 22 fora da combinação suportada para Angular 17.3.

Organização implementada: `core` para configuração, sessão, contratos e interceptors; `components/login` e `components/register` para autenticação; `features/tasks` para formulário/estado, `features/workspace` para lista e `services` para acesso HTTP. Componentes despacham ações e apresentam selectors; effects controlam efeitos HTTP. O Store guarda usuário/status e tarefas, sem guardar senha ou JWT.

## Fonte do contrato

O contrato canônico é `docs/openapi.yaml` no repositório backend `agu-php`, versão inicial **0.1.0**. Repositórios próprios: GuilhermeBenites/agu-php e GuilhermeBenites/agu-angular; referência inicial da API: submission-v1. Nenhum comando obrigatório importará ou lerá a pasta irmã. Não manter uma segunda cópia do OpenAPI neste repositório.

Endereços previstos: SPA em `http://localhost:4200` e apiBaseUrl em `http://localhost:8080/api`. Desde a fase 1, a SPA carrega apiBaseUrl de `/assets/config.json` antes do bootstrap. O arquivo é público e contém somente configuração não sensível. A URL poderá mudar sem recompilar a aplicação.

Rotas propostas: `/login`, `/register`, `/tasks`, `/tasks/new` e `/tasks/:id/edit`. A consulta por ID permite abrir/recarregar a URL de edição. O carregamento e a falha da restauração da sessão precisam de estados explícitos na interface.

## Tipos previstos para os serviços

As interfaces abaixo descrevem o contrato. Os tipos de autenticação estão implementados na fase 2; os tipos/operações finais de tarefas estão conectados desde a fase 3. ApiError é o envelope HTTP; o estado usa ApiFailure normalizado, incluindo uma falha local unavailable quando não há envelope válido.

```ts
export interface Credentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
}

export interface LoginResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
}

export interface UpdateTaskRequest {
  title: string;
  description: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskPage {
  items: Task[];
  pagination: Pagination;
}

export interface Violation {
  field: string;
  message: string;
}

export type ApiErrorCode =
  | 'invalid_json' | 'validation_failed' | 'invalid_credentials'
  | 'token_missing' | 'token_invalid' | 'token_expired'
  | 'username_taken' | 'task_not_found' | 'unsupported_media_type'
  | 'method_not_allowed' | 'not_found' | 'internal_error';

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details: Violation[];
  };
  requestId: string;
}
```

O frontend deve interpretar IDs e contadores como números, descrição como string/null e datas como strings UTC `YYYY-MM-DDTHH:mm:ssZ`, convertendo apenas sua apresentação para o horário local.

## Operações e respostas

Caminhos relativos a apiBaseUrl:

| Operação | Método/caminho | Corpo | Sucesso |
| --- | --- | --- | --- |
| Cadastrar | POST /register | Credentials | 201 User; navegar ao login |
| Entrar | POST /login | Credentials | 200 LoginResponse |
| Restaurar sessão | GET /me | — | 200 User |
| Listar | GET /tasks?page=1&limit=20 | — | 200 TaskPage |
| Criar | POST /tasks | CreateTaskRequest | 201 Task; header Location |
| Carregar edição | GET /tasks/{id} | — | 200 Task |
| Salvar edição | PUT /tasks/{id} | UpdateTaskRequest | 200 Task |
| Excluir | DELETE /tasks/{id} | — | 204; Observable<void> |

A lista retorna um objeto TaskPage, substituindo o array simples esperado pelo serviço atual. Exemplo de resposta sem tarefas:

```json
{"items": [], "pagination": {"page": 1, "limit": 20, "total": 0, "totalPages": 0}}
```

Listagem com ordem fixa por createdAt DESC, id DESC. Page começa em 1; limit padrão 20, de 1 a 100. Uma página além do total retorna items vazio e totais preservados. Ao excluir o último item de uma página posterior à primeira, recarregar a página anterior; após criar, voltar à primeira página e recarregar. Após editar, recarregar a página atual, mantendo o estado coerente com a API. Cancelamento de confirmação de exclusão não faz requisição.

O formulário remove espaços das bordas do username antes de enviar. A API aceita 3 a 50 caracteres sem espaços, primeiro alfanumérico e demais alfanuméricos ou `.`, `_`, `-`, e converte para lowercase ASCII após validar. Senha não tem trim: mínimo de 8 caracteres e máximo de 72 bytes UTF-8. O formulário deve verificar bytes com TextEncoder e contar caracteres Unicode conforme a validação do servidor, em vez de assumir que string.length representa os dois limites.

Title tem de 1 a 255 caracteres e conteúdo não branco; description tem até 10000 caracteres. Os limites são verificados no payload recebido e, depois, a API aplica trim; descrição vazia vira null. POST permite omitir description; PUT exige ambos os campos. O formulário de edição sempre envia description explicitamente. Proprietário, ID e datas não são enviados em escritas.

## Sessão e erros

- Token em sessionStorage na chave `agu.access_token`, sem senha/token no NgRx ou DevTools.
- Login usa expiresIn informativo; exp do JWT orienta o vencimento local. Decodificar exp no cliente não substitui verificar a assinatura no servidor.
- Reload: ler token, checar exp e consultar GET /me antes de liberar a rota protegida. Estado inicial `checking`; depois `authenticated`, `anonymous` ou `unavailable`, com nova tentativa em falha de rede/500.
- Interceptor limita Bearer ao prefixo exato da API configurada e às operações protegidas. Cadastro, login e health não recebem token. Não usar withCredentials.
- 401 em operação protegida limpa token, usuário e tarefas e redireciona ao login. 401 no login apresenta credenciais inválidas no formulário. Logout aplica a mesma limpeza local; sem revogação de JWT no servidor.
- 400/415 representam falha no formato da requisição. 422 associa details aos campos, incluindo `$` para o corpo completo. Mensagem não reconhecida pode ser mostrada no nível do formulário.
- 409 no cadastro informa username indisponível. 404 de tarefa apresenta recurso indisponível e permite voltar à lista. 500/falha de rede oferece nova tentativa; alteração só é refletida como concluída após sucesso da API.
- Usar error.code para decisões de interface e requestId para suporte. Respostas inválidas, sem o envelope esperado, precisam de mensagem genérica, preservando o estado e permitindo nova tentativa.

Exemplo de erro 422:

```json
{"error": {"code": "validation_failed", "message": "Revise os campos informados.", "details": [{"field": "title", "message": "Informe o título."}]}, "requestId": "0123456789abcdef0123456789abcdef"}
```

## Entregas e verificação por fase

| Fase | Entrega do frontend | Verificação prevista |
| --- | --- | --- |
| 0 | Decisões, tipos planejados, operações e comandos documentados | Revisão contra os schemas/exemplos do contrato 0.1.0 |
| 1 | Configuração da API, ambiente, build, testes básicos e CI | Instalação em diretório independente, testes e build de produção |
| 2 | Material, formulários, estado da autenticação e sessão | Testes de formulários/HTTP/interceptor/guard/estado e E2E com API real |
| 3 | CRUD, paginação, NgRx de tarefas e responsividade | Tests de estado/HTTP/componentes, E2E e revisão móvel/desktop/teclado |
| 4 | Compatibilidade com Redis implementada | E2E com cache habilitado e Redis desligado |
| 5 | README final, evidências e CI remota | Instalação limpa e suíte completa com backend de versão explícita |

Comandos de execução: npm ci, npm start, npm run build e npm test. A validação automatizada usa os scripts headless e o ambiente Docker descritos no README.

Scripts de qualidade/testes configurados na fase 1, com E2E implementado na fase 2:

| Comando | Finalidade |
| --- | --- |
| npm run check | Lint e formatação em modo de verificação |
| npm run test:ci | Jasmine/Karma sem watch e com ChromeHeadless |
| npm run test:coverage | Testes com relatório de cobertura do código próprio |
| npm run build | Build de produção Angular |
| npm run e2e | Playwright com API real, disponível a partir da fase 2 |

E2E usa E2E_BASE_URL para a SPA e API_BASE_URL para a API de testes. O contexto Playwright recebe apiBaseUrl correspondente, preservando o arquivo público usado pelo desenvolvedor. Cada execução registra a revisão do backend e identifica quando o working tree local está sendo usado. Provisionamento não pode assumir `../agu-php`; usar URL já disponível ou checkout temporário por referência explícita. Fluxo configurado na fase 2, conforme TESTES_E2E.md; CI usa o backend próprio na referência submission-v1 por padrão, com sobrescrita explícita opcional.

Todo incremento inclui seus testes e a suíte acumulada. Pendências obrigatórias impedem concluir a fase funcional. O fechamento documental desta fase consta em [FASE_0.md](FASE_0.md); o [enunciado original](ENUNCIADO.md) permanece disponível.

Estado após a fase 1: configuração em execução, build, lint e 21 testes aprovados localmente. Evidências em [FASE_1.md](FASE_1.md). Registro histórico da fundação. A autenticação foi implementada na fase 2; tarefas foram implementadas posteriormente na fase 3.

Estado após a fase 2: autenticação, Material/formulários reativos e estado NgRx implementados, com 55 testes e 12 cenários E2E aprovados localmente. O provisionamento por diretório explícito ou referência Git está em [TESTES_E2E.md](TESTES_E2E.md); evidências em [FASE_2.md](FASE_2.md). Registro histórico; as fases 3 e 4 foram concluídas posteriormente.

Estado após as fases 3/4 (31/10/2026): CRUD e paginação completos, 78 testes Angular e 20 execuções E2E com Redis mais oito dos fluxos de tarefas com Redis desligado, todas aprovadas. O contrato não mudou; cache é detalhe interno do backend. Relatórios em [FASE_3.md](FASE_3.md) e [FASE_4.md](FASE_4.md). Fase 5/CI remota/publicação ainda pendentes.

Preparação da entrega e reprodução limpa registradas em [FASE_5.md](FASE_5.md). A abertura das PRs será manual por decisão do candidato.
