# Fechamento da fase 1 — Frontend

Data: 30/10/2026. Estado: **concluída localmente — fundação executável**. A fase 2 não foi iniciada.

## Entregáveis

- Ambiente Docker com Node 20.20.2 e Chromium, .nvmrc e engines compatíveis; dependências pelo package-lock.
- Configuração pública em assets/config.json, carregada por APP_INITIALIZER antes do bootstrap e oferecida por injeção.
- Validação de URL e mensagem acessível quando a inicialização falha; clientes sem a porta 9000 fixa do skeleton.
- RouterLink importado corretamente, providers de teste corrigidos e expectativas dos testes alinhadas à base atual.
- Jasmine/Karma/ChromeHeadless, ESLint/Prettier, scripts de testes/cobertura/build e workflow independente de CI.
- [README executável](../README.md), sem dependência da localização do backend.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Build da imagem com npm ci sem copiar node_modules do host | Aprovado no Node 20.20.2 |
| `npm run check` no Docker | ESLint e Prettier aprovados |
| `npm run build` no Docker | Build de produção aprovado; bundle inicial 278,85 kB |
| `npm run test:coverage` no Docker/Chromium | **21 testes aprovados** |
| Configuração pública servida em /assets/config.json | HTTP 200 com a URL configurada |
| Smoke no Chromium real contra o servidor local | Aplicação inicializada e tela de login renderizada |

Cenários: configuração válida e imutável, normalização de barra final, rejeição de configuração ausente/nula/tipo incorreto, protocolo inadequado, credenciais/query/fragmento na URL e falha de carregamento; inicializador fornece a configuração após carregar; serviços usam a URL injetada e preservam falhas HTTP; shell/RouterLink e base dos componentes.

Cobertura inicial: **77,02% das linhas (57/74)**, 77,63% dos statements e 85,71% dos branches. Relatórios em coverage/index.html e coverage/lcov.info, ignorados no Git. Esse resultado cobre o incremento e partes do skeleton, sem representar os futuros fluxos de negócio ou estado NgRx.

## Limites e continuidade

A CI foi adicionada, com os mesmos comandos executados localmente. Execução remota aguarda os repositórios próprios de entrega; nenhum commit, push ou PR foi realizado.

Autenticação e CRUD ainda seguem o comportamento provisório do skeleton, inclusive os formatos transitórios dos serviços. Material, formulários reativos, estado NgRx, ciclo sessionStorage/JWT e contratos finais serão implementados nas fases 2 e 3. O script Playwright/E2E ainda não existe. Não houve E2E de cadastro/login/CRUD; o smoke desta fase verifica apenas inicialização/renderização.
