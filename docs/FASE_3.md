# Fase 3 — interface completa de tarefas

Fluxos implementados e validados em 30/10/2026; fechamento documental consolidado em 31/10/2026 após a interrupção. Contrato HTTP 0.1.0 preservado. A fase 4 revalida a integração com Redis.

## Entrega

- Lista paginada em /tasks, criação em /tasks/new e edição por URL em /tasks/:id/edit, com GET por ID e suporte a reload.
- Material e formulários reativos tipados; títulos/descrições com limites por caracteres Unicode compatíveis com a API.
- TaskService com configuração lazy, contratos tipados e validação das respostas, sem campos internos do proprietário.
- NgRx Store/Effects/Selectors e TasksFacade: carregamento, dados, erros, escritas pendentes e retorno à lista após sucesso.
- Cancelamento de requisições e reset do estado no fim da sessão; páginas antigas canceladas ao solicitar outra; prevenção de envios simultâneos.
- Edição preservada após falha, nova tentativa, exclusão com confirmação e cancelamento; página corrigida após excluir seu último item.
- Estados vazio/carregando/erro, retorno 404 sem formulário editável e layout responsivo seguindo a base visual da fase 2.

Componentes provisórios task/task-list foram substituídos pela feature funcional. Não foram acrescentados conclusão, filtros ou busca fora do contrato.

## Resultados executados

| Verificação | Resultado |
| --- | --- |
| npm run check | ESLint/Prettier aprovados |
| npm run test:coverage | 78 testes; linhas 91,56%, branches 83,72%, funções 86,70% |
| npm run build | Produção aprovada; bundle inicial 471,20 kB, abaixo do aviso de 500 kB |
| E2E com API/MySQL reais | 20 execuções: 10 cenários em 1440×960 e 390×844 |
| Estado/efeitos | Cancelamento no logout, respostas atrasadas, falhas/retry, paginação e escritas pendentes |
| Formulários/HTTP | Limites Unicode, campos obrigatórios, valores preservados em erro, GET/POST/PUT/DELETE e respostas inválidas |
| Isolamento | Troca de sessão na mesma SPA e tentativa de edição direta de outra conta, sem expor dados |

O build emite dois avisos informativos de estilos acima de 2 kB: workspace 3,43 kB e AuthShell 3,97 kB. Ambos respeitam o limite de erro de 4 kB; os budgets não foram aumentados.

## Revisão visual e teclado

Capturas de lista vazia, formulário, tarefas, paginação e confirmação revisadas manualmente em desktop/celular. Textos longos e ausência de rolagem horizontal foram conferidos; o ícone de nova tarefa foi corrigido para SVG local após a revisão.

Navegação por teclado foi verificada no E2E: título → descrição → cancelar → criar, envio com Enter, foco inicial seguro no botão Cancelar do diálogo, Escape e restauração de foco. Validação de campo e 404 também foram inspecionados. Não foi realizado teste com leitor de tela.

Capturas locais em .artifacts/phase3-*.png; relatório em playwright-report/index.html. Arquivos ignorados pelo Git são coletados pelo workflow como artefatos. A execução remota ainda depende da publicação dos repositórios próprios.

## Fechamento

CRUD completo entregue e revalidado na fase 4 com cache ligado e desligado. Testes continuam sem importar arquivos de uma pasta irmã; o coordenador recebe explicitamente a API/backend. Publicação, PRs e reprodução dos repositórios próprios ficam na fase 5.
