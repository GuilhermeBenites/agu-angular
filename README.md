# AGU — Frontend

SPA de tarefas com Angular 17.3/TypeScript 5.4, para consumir uma API PHP/Symfony em repositório independente.

## Estado atual

Autenticação, CRUD paginado com telas responsivas, Material/formulários reativos e NgRx. Instalação reproduzida em cópia limpa e integração validada com Redis ligado e desligado no backend.

Crie sua conta em http://localhost:4200/register e entre em http://localhost:4200/login. Não há usuário/senha padrão. Após entrar, /tasks permite percorrer, criar, editar e excluir suas tarefas. /tasks/new cria; /tasks/:id/edit permite edição direta e reload.

Token permanece em sessionStorage; o reload confirma a sessão na API e a expiração faz logout automático. Falhas temporárias permitem tentar novamente. Exportação/RabbitMQ ficam fora do escopo atual; Redis está implementado no backend e não altera a configuração da SPA.

## Execução com Docker

Requisito: Docker com Compose. Execute na raiz deste repositório; o backend pode estar em qualquer diretório ou máquina.

```sh
git clone --branch feat/complete-task-manager https://github.com/GuilhermeBenites/agu-angular.git
cd agu-angular
docker compose build frontend
docker compose run --rm frontend npm ci
docker compose up -d frontend
```

Frontend em `http://localhost:4200`. A imagem usa Node **20.20.2** e Chromium para os testes. node_modules fica em volume próprio; execute npm ci novamente quando mudar o lockfile. Para parar: `docker compose down`.

A API deve ser iniciada separadamente, seguindo o [README do backend](https://github.com/GuilhermeBenites/agu-php/blob/feat/complete-task-manager/README.md). A versão das fases 3/4 atende ao contrato completo 0.1.0; Redis é uma otimização interna da API.

## Configuração pública da API

Edite `src/assets/config.json`:

```json
{"apiBaseUrl": "http://localhost:8080/api"}
```

O arquivo é carregado antes do bootstrap, sem recompilar a aplicação. O serviço valida a URL e os clientes HTTP recebem a configuração por injeção. Em falha de carregamento ou URL inválida, a inicialização falha com uma mensagem na tela.

No build de produção, a configuração fica em `dist/frontend/browser/assets/config.json`; substitua esse arquivo ao preparar outro ambiente. Ele é público e não recebe credenciais.

Use a origem `http://localhost:4200` no navegador para o CORS padrão do backend. Copie .env.example para .env se quiser configurar FRONTEND_PORT e mudar a porta do Compose; nesse caso, ajuste também a origem permitida na API. A URL da API deve ser acessível pelo navegador.

## Testes, qualidade e build

```sh
docker compose run --rm frontend npm run check
docker compose run --rm frontend npm run test:coverage
docker compose run --rm frontend npm run build
```

- `check`: ESLint TypeScript e Prettier em modo de verificação.
- `test:ci`: Jasmine/Karma com Chromium headless no ambiente Docker.
- `test:coverage`: a suíte com relatórios em `coverage/`.
- `build`: build de produção em `dist/frontend/browser/`.
- `format`: aplica a formatação dos arquivos do projeto.

A suíte acumulada tem **78 testes aprovados** e **91,56% de cobertura de linhas**, incluindo autenticação, tarefas, estado/effects, formulários, guard e interceptor. O Playwright executou **20 cenários em desktop/celular** contra API/MySQL/Redis isolados e repetiu **oito execuções de tarefas com Redis desligado**. Reprodução em [TESTES_E2E.md](docs/TESTES_E2E.md).

A [CI própria](.github/workflows/ci.yml) usa os mesmos comandos, com cobertura como artefato. O job E2E usa por padrão GuilhermeBenites/agu-php na referência submission-v1, com teste de Redis indisponível. E2E_BACKEND_REPOSITORY/E2E_BACKEND_REF permitem sobrescrever esse par. Resultados locais/remotos em [FASE_5.md](docs/FASE_5.md).

## Alternativa local

Use Node 20.20.2 (`.nvmrc`), execute npm ci e use os mesmos scripts npm. Para Karma local, instale Chrome/Chromium e execute `npm test -- --watch=false --browsers=ChromeHeadless`; CHROME_BIN pode indicar o binário. Não reutilize node_modules instalado em outro sistema operacional.

## Documentação e submissão

- [Integração, tipos, sessão e etapas](docs/INTEGRACAO.md).
- [Fechamento da fase 0](docs/FASE_0.md).
- [Resultados e limites da fase 1](docs/FASE_1.md).
- [Resultados, cobertura e revisão visual da fase 2](docs/FASE_2.md).
- [CRUD, cobertura e revisão visual — fase 3](docs/FASE_3.md).
- [Integração com cache e indisponibilidade — fase 4](docs/FASE_4.md).
- [Execução dos testes ponta a ponta](docs/TESTES_E2E.md).
- [Entrega e reprodução limpa — fase 5](docs/FASE_5.md).
- [Arquitetura e decisões](docs/ARQUITETURA.md).
- [Roteiro de demonstração](docs/DEMONSTRACAO.md).
- [Enunciado e README originais](docs/ENUNCIADO.md).

[OpenAPI canônico 0.1.0](https://github.com/GuilhermeBenites/agu-php/blob/submission-v1/docs/openapi.yaml). Repositórios próprios: [frontend](https://github.com/GuilhermeBenites/agu-angular) e [backend](https://github.com/GuilhermeBenites/agu-php). A implementação fica na branch feat/complete-task-manager; main preserva o skeleton para comparação.

A abertura das PRs será feita manualmente pelo candidato. [Texto preparado](docs/PR.md) e [comparação da implementação](https://github.com/GuilhermeBenites/agu-angular/compare/main...feat/complete-task-manager?expand=1). O código não será enviado ao repositório do avaliador.
