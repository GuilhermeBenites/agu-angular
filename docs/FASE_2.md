# Fechamento da fase 2 — Frontend

Data: 30/10/2026. Estado: **concluída localmente — autenticação e base visual**. A fase 3 não foi iniciada.

## Entrega

- Login e cadastro com Angular Material, formulários reativos tipados, mensagens de validação e confirmação de senha apenas no cliente.
- Tema compartilhado, layout de autenticação responsivo, identidade visual, ícones SVG locais e favicon, sem fontes/imagens externas obrigatórias.
- NgRx Store/Effects/Selectors, AuthFacade e comandos transitórios. Usuário/status/erros tratados ficam no Store; senha e JWT não transitam em ações nem são persistidos no estado.
- Token na chave sessionStorage agu.access_token, validação local de exp e confirmação de identidade via GET /me após reload.
- Guard aguarda a restauração; usuário autenticado sai das telas públicas. Falha temporária vai para /session, preserva o token e permite nova tentativa.
- Interceptor limita Bearer ao prefixo/origem exatos da API e às operações protegidas. 401 de uma requisição antiga não encerra uma sessão nova, inclusive quando a requisição começou sem token.
- Expiração automática sem nova chamada HTTP; logout/expiração limpam token, usuário e estado global. Login pendente é cancelado no logout.
- Requisições de autenticação têm espera limitada a 10 segundos. Inicialização mostra um estado de carregamento, com retorno seguro quando houver falha.
- Área /tasks protegida com identidade e opção Sair. É o espaço inicial da sessão; a interface de CRUD entra na fase 3.

NgRx Effects aceita fontes observáveis além das ações. AuthCommands usa Subject para credenciais transitórias, mantendo a integração com Effects e evitando registrar senhas/tokens no histórico de ações. Referência: [NgRx Effects](https://ngrx.io/guide/effects).

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| ESLint, incluindo E2E/configuração, e Prettier | Aprovados |
| Jasmine/Karma/Chromium | **55 testes aprovados** |
| Cobertura de linhas reportada pelo Karma | **88,81% — 254/286** |
| Branches / funções | 79,02% / 82,50% |
| Build de produção | Aprovado; carga inicial aproximada de **443 kB**, abaixo do orçamento de 500 kB |
| Playwright com API/MySQL reais e isolados | **12 cenários aprovados**, desktop e celular |
| Revisão visual | Login/cadastro em 1440×960 e 390×844; fixture visual de nome com 50 caracteres sem overflow horizontal |

A suíte Angular cobre formulários, limites Unicode/bytes, confirmação, erros vindos da API, estado/selectors/reset, comandos/effects, cancelamento de login, identidade restaurada, fallback temporário, escopo do interceptor e proteção contra 401 tardio. Os E2E verificam cadastro/login/reload/logout, senha incorreta, duplicidade, validação, expiração, token adulterado e recuperação de sessão.

O relógio do navegador é controlado para testar uma hora de expiração sem esperar fisicamente. Token adulterado é rejeitado pelo backend real. A falha temporária de /me é injetada apenas no cenário de recuperação. A configuração pública da API é substituída no contexto de teste para apontar ao backend temporário; não há alteração da configuração usada pelo navegador do desenvolvedor.

## Evidências e reprodução

- coverage/index.html e lcov.info: cobertura local.
- playwright-report/index.html: relatório E2E.
- .artifacts/phase2-login-desktop.png e phase2-login-mobile.png: telas de login.
- .artifacts/phase2-register-desktop.png e phase2-register-mobile.png: telas de cadastro.
- .artifacts/phase2-workspace-longname-mobile.png: revisão visual com fixture de nome longo; não é um cenário de autenticação real.

Esses artefatos são ignorados pelo Git. Comandos e provisionamento independente estão em [TESTES_E2E.md](TESTES_E2E.md) e no [README](../README.md).

O build emite um aviso informativo para o CSS do AuthShell: aproximadamente 3,97 kB, acima do aviso padrão de 2 kB e abaixo do limite de erro de 4 kB. Os orçamentos não foram ampliados. As telas são carregadas por rotas lazy.

## CI e continuidade

A CI independente mantém lint/testes/build e ganhou um job E2E condicionado às variáveis E2E_BACKEND_REPOSITORY e E2E_BACKEND_REF. As URLs/referências próprias ainda precisam ser configuradas na entrega; execução remota não foi realizada. Sem commit, push ou PR.

O CRUD e o estado NgRx de tarefas entram na fase 3; o backend de tarefas continua provisório. Redis continua pendente de escolha. A revisão visual desta fase não equivale a uma auditoria completa de acessibilidade, prevista na revisão final.
