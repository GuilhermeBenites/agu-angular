# Fase 4 — integração preservada com Redis

Validada localmente em 31/10/2026. A otimização está no backend e mantém o contrato 0.1.0; não acrescenta configuração Redis à SPA nem altera as telas de produto.

## Entrega e evidências

O coordenador E2E detecta se a versão fornecida do backend oferece o serviço redis e o inicia no projeto temporário. Continua compatível com uma API anterior que não oferece esse serviço. Com E2E_VERIFY_REDIS_OUTAGE=1 e Redis presente, executa novamente os quatro cenários de tarefas em dois tamanhos de tela após parar apenas o Redis temporário. Relatórios normal e de falha ficam separados.

Comando executado a partir deste repositório:

```sh
E2E_VERIFY_REDIS_OUTAGE=1 bash scripts/e2e.sh /caminho/absoluto/para/agu-php
```

Resultado: 20 execuções com Redis ligado, seguidas de oito execuções de tarefas com Redis parado, todas aprovadas. Os fluxos incluem CRUD, paginação, isolamento de contas, edição por URL/reload, teclado e recuperação de falhas HTTP. O coordenador reiniciou o Redis e removeu os serviços/volumes temporários ao terminar.

A suíte Angular acumulada permanece em 78 testes, com 91,56% de linhas, 83,72% de branches e 86,70% de funções. Lint/formatação e build de produção aprovados; avisos de tamanho de estilos permanecem os descritos na fase 3.

O backend verificou separadamente cache frio/quente, TTL natural, consultas evitadas, invalidação nas três mutações, leitor atrasado, escritores concorrentes, indisponibilidade/recuperação com chaves antigas e rollback da versão junto da tarefa. Os resultados e a medição reproduzível estão em docs/FASE_4.md no repositório backend, sem criar dependência entre pastas.

## Relatórios e CI

- Normal: playwright-report/index.html.
- Redis desligado: playwright-report/redis-outage/index.html.
- Traces em falha: test-results e seu subdiretório redis-outage.
- Capturas de revisão visual: .artifacts/phase3-*.png.

O job application-e2e habilita o cenário de indisponibilidade e exige E2E_BACKEND_REPOSITORY/E2E_BACKEND_REF. Foi validado localmente com o working tree do backend; os repositórios próprios/ref de submissão ainda precisam ser definidos. CI remota, PRs e reprodução de clones próprios permanecem na fase 5.
