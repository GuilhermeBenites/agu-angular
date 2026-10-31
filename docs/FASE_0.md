# Fechamento da fase 0 — Frontend

Registro histórico da fase 0. Consulte o README para o estado atual do projeto.

Data: 30/10/2026. Estado: **concluída — planejamento e contrato**. A fase 1 não foi iniciada.

## Entregáveis

- [Integração, arquitetura, sessão, tipos e comandos planejados](INTEGRACAO.md).
- [README](../README.md) com estado real do skeleton e documentação própria.
- [Enunciado e README originais](ENUNCIADO.md), preservados integralmente.
- Contrato consumidor alinhado à versão 0.1.0 do OpenAPI em `docs/openapi.yaml` do repositório backend `agu-php`.

Dois repositórios independentes; exportação assíncrona/RabbitMQ fora do escopo atual. Material, formulários reativos e NgRx adotados. Redis permanece pendente no backend, sem alterar a interface HTTP.

## Revisão executada

- Conferência de 10 interfaces planejadas, com 30 campos, seus tipos e obrigatoriedade, contra os schemas do OpenAPI.
- Conferência dos 12 códigos de erro da união ApiErrorCode.
- Validação dos 2 exemplos JSON deste repositório — TaskPage vazio e ApiError — contra os schemas do backend.
- Revisão das operações e dos comportamentos de sessão, edição por URL, paginação, estados de erro e limpeza no logout.
- Revisão dos requisitos de Angular, Material, formulários reativos, NgRx e responsividade, com sua alocação nas fases 1 a 3.
- Verificação dos links locais e da preservação do README original do skeleton.

Resultado: revisão documental aprovada. O OpenAPI canônico também passou na validação estrutural e na verificação de seus 28 exemplos, no repositório backend. As URLs públicas e a referência por tag/commit ainda serão definidas na preparação dos repositórios de entrega; não existe dependência de execução por caminho para a pasta irmã.

## Limites e próxima fase

Os tipos estão documentados, ainda sem implementação nos serviços Angular. A correspondência conferida é de campos, tipos declarados e exemplos; não houve compilação TypeScript ou geração de cliente.

Não foram instaladas dependências do projeto nem executados testes Angular, E2E ou build. Scripts de qualidade/CI, runtime Node compatível e configuração pública da URL da API entram na fase 1. Autenticação e CRUD completos entram nas fases 2 e 3, com seus testes de aceite.

Nenhum código funcional, manifest ou lockfile foi alterado. Publicação, commits e PRs não foram realizados. A execução segue uma fase por vez, conforme solicitado.
