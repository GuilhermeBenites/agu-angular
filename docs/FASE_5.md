# Fase 5 — entrega e reprodução

Validação local concluída em 31/10/2026. Publicação/CI remota serão registradas abaixo após a execução; o candidato optou por abrir as PRs manualmente.

## Reprodução independente

Arquivos de entrega foram copiados para diretório aleatório em /private/tmp sem Git, node_modules, .angular, builds, cobertura ou variáveis locais. Um projeto Compose exclusivo recebeu node_modules novo e porta 14200, preservando o frontend de desenvolvimento em 4200. A API foi instalada em outro diretório independente, em 18080.

Foram seguidos os comandos do README: build da imagem, npm ci, inicialização, npm run check, npm run test:coverage e npm run build. Resultado: 78 testes, 91,56% de linhas, 83,72% de branches e 86,70% de funções; build inicial 471,20 kB. Permanecem os avisos de estilos da fase 3, abaixo do limite de erro.

O E2E recebeu caminho absoluto da API e E2E_FRONTEND_PROJECT=agu-phase5-web. Com E2E_VERIFY_REDIS_OUTAGE=1, aprovou 20 execuções normais e oito de tarefas com Redis parado. A configuração local inválida do backend não foi herdada pelo processo temporário; banco, cache, chaves, TTL e CORS foram definidos explicitamente no ambiente de testes. Houve 23 chaves Redis antes da parada. O ambiente temporário foi removido ao terminar.

Fontes funcionais das cópias foram comparados com a origem após os ajustes de tooling; documentação/CI foram finalizadas separadamente. O primeiro ensaio foi de snapshots do working tree, pois os repositórios de entrega ainda estavam vazios. A validação remota posterior usa checkout Git. [Registro/fingerprints](medicoes/fase5-reproducao.json).

Logs, relatórios e capturas desse ensaio estão em .artifacts/phase5, ignorados pelo Git. O backend aprovou também 86 testes/1.095 asserções, benchmark, OpenAPI, exemplos e 29 respostas reais/CORS na instalação independente.

## Comandos utilizados

Com FRONTEND_PORT=14200 no .env e a URL 18080 em src/assets/config.json:

```sh
docker compose -p agu-phase5-web build frontend
docker compose -p agu-phase5-web run --rm frontend npm ci
docker compose -p agu-phase5-web up -d frontend
docker compose -p agu-phase5-web run --rm frontend npm run check
docker compose -p agu-phase5-web run --rm frontend npm run test:coverage
docker compose -p agu-phase5-web run --rm frontend npm run build
E2E_FRONTEND_PROJECT=agu-phase5-web E2E_VERIFY_REDIS_OUTAGE=1 bash scripts/e2e.sh /caminho/absoluto/para/a/copia/da-api
```

A API temporária recebe porta aleatória, banco/cache e volume JWT próprios. O coordenador aceita diretório sem metadados Git ou repositório Git/ref; registra a proveniência disponível sem exigir ../agu-php. O padrão do E2E de CI passa a ser GuilhermeBenites/agu-php na referência submission-v1, com variáveis opcionais para sobrescrita; não depende de configurar variáveis para deixar de pular o job.

## Documentos e submissão

README, .env.example, [arquitetura](ARQUITETURA.md), [demonstração](DEMONSTRACAO.md), [execução E2E](TESTES_E2E.md) e [texto da PR](PR.md) finalizados. Enunciado original preservado. Contrato 0.1.0, sem novos opcionais de produto nesta fase.

Destinos: [frontend](https://github.com/GuilhermeBenites/agu-angular) e [backend](https://github.com/GuilhermeBenites/agu-php). main preserva a base do skeleton e feat/complete-task-manager contém a implementação. O candidato fará a abertura das PRs manualmente; a automação não publica no repositório do avaliador.

## Publicação e CI remota

Em preparação. Não considerar CI remota aprovada até haver execução concluída registrada nesta seção. A criação das PRs permanece manual por decisão do candidato.
