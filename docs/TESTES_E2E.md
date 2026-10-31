# Testes ponta a ponta de autenticação e tarefas

Playwright 1.64.1, executado no Node 20/Chromium do projeto. A suíte atual contém dez cenários em dois tamanhos de tela: desktop 1440×960 e celular 390×844.

## Com backend local em qualquer diretório

Requisitos: Docker/Compose, Bash e uma cópia compatível do backend. Execute na raiz do frontend:

```sh
bash scripts/e2e.sh /caminho/absoluto/para/agu-php
```

Também é possível fornecer E2E_BACKEND_DIR. A localização do backend é explícita, sem assumir uma pasta irmã. O script usa o working tree desse diretório, exibindo a revisão base e identificando o uso local; alterações não commitadas fazem parte da execução.

O script:

1. Cria um projeto Compose temporário com backend/MySQL próprios e Redis quando disponível na versão fornecida; aplica migrations e verifica o HTTP.
2. Constrói o ambiente do frontend, instala pelo lockfile e reinicia seu servidor local.
3. Conecta o Nginx temporário à rede do frontend com alias único; não usa o banco de desenvolvimento principal.
4. Executa os E2E com API_BASE_URL explícita e a origem do navegador localhost:4200. A configuração pública é sobrescrita somente no contexto Playwright.
5. Opcionalmente para apenas o Redis temporário e repete os fluxos de tarefas com fallback MySQL.
6. Remove os serviços/volume temporários e o diretório temporário ao terminar, inclusive em falha. O frontend permanece disponível.

A porta publicada do backend temporário é escolhida pelo Docker, evitando disputar 8080. As chaves do processo temporário ficam em volume próprio; as chaves locais da origem são preservadas. Registros da suíte ficam apenas no MySQL temporário. Não é necessário publicar ou enviar commits para executar localmente.

## Com uma referência Git do backend

Quando os repositórios de entrega forem publicados:

```sh
E2E_BACKEND_REPOSITORY=https://github.com/SEU_USUARIO/SEU_BACKEND.git E2E_BACKEND_REF=TAG_OU_COMMIT bash scripts/e2e.sh
```

Use uma referência explícita compatível e acessível pelo executor. O checkout é temporário. A CI usa por padrão https://github.com/GuilhermeBenites/agu-php.git na referência submission-v1. As duas variáveis permitem substituir explicitamente esse par; o job não é mais condicionado à presença delas. Para backend privado, o executor precisa ter permissão de leitura. Não incluir credenciais na configuração pública da SPA.

## Com um ambiente de testes já provisionado

O comando npm run e2e exige API_BASE_URL e aceita E2E_BASE_URL. Ambas as URLs precisam ser acessíveis pelo navegador/runner. O comando não provisiona nem remove essa API:

```sh
docker compose exec -T -e API_BASE_URL=http://API_DE_TESTE/api -e E2E_BASE_URL=http://localhost:4200 frontend npm run e2e
```

Preferir o coordenador para obter banco isolado e limpeza automática.

## Cobertura e artefatos

A suíte verifica cadastro/login/reload/logout, credenciais/duplicidade, validação, expiração, assinatura adulterada e recuperação da sessão; também CRUD de tarefas, edição por URL/reload, paginação, exclusão da última tarefa da página, isolamento na troca de contas, confirmação/cancelamento por teclado e recuperação após falhas na lista e nas escritas.

Cenários específicos de recuperação injetam 503 em /me e nas operações de tarefas. As demais operações e as novas tentativas usam a API real. No teste adicional de Redis, o processo é realmente parado, sem simular falha por resposta HTTP. O contrato de configuração em execução permite apontar cada contexto do navegador ao alias da API temporária.

Relatório em playwright-report/index.html; traces/capturas em test-results quando há falha; capturas visuais em .artifacts. Todos ficam fora do Git. As capturas com animações desabilitadas servem à revisão visual, sem comparação de pixels automatizada.

## Redis indisponível

```sh
E2E_VERIFY_REDIS_OUTAGE=1 bash scripts/e2e.sh /caminho/absoluto/para/agu-php
```

Quando o backend tem Redis, esse comando executa 20 casos com ele ligado, para somente o Redis do projeto temporário, repete oito execuções de tarefas e reinicia o serviço. Não altera o Redis de desenvolvimento. Se a versão fornecida não tem serviço Redis, mantém o E2E normal sem o ensaio adicional. O job application-e2e da CI define a opção como 1.

Relatório normal: playwright-report/index.html. Relatório adicional: playwright-report/redis-outage/index.html; saída/traces em test-results/redis-outage. Em 31/10/2026 foram aprovadas as 20 + 8 execuções, conforme [FASE_4.md](FASE_4.md). Estado da publicação/CI em [FASE_5.md](FASE_5.md).

## Projeto frontend independente e isolamento

E2E_FRONTEND_PROJECT altera o projeto Compose do frontend (padrão agu-frontend); a rede temporária usa o projeto escolhido. Isso permite validar uma cópia sem reiniciar o servidor de desenvolvimento. FRONTEND_PORT continua sendo a porta publicada; o runner dentro do contêiner usa localhost:4200.

O backend temporário recebe DATABASE_URL, REDIS_URL, APP_ENV, JWT, TTL e CORS definidos pelo coordenador. Não herda valores perigosos de backend/.env.local. Chaves são geradas em um volume JWT exclusivo removido na limpeza. O modo de diretório aceita snapshots sem .git; o modo de referência Git registra o SHA completo obtido. Na fase 5, um arquivo local deliberadamente inválido confirmou esse isolamento.
