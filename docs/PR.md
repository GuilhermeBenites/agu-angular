# Título

Implementar interface de tarefas com sessão JWT, NgRx e integração testada

# Descrição

O skeleton não completava o ciclo de sessão nem o CRUD de tarefas. A SPA agora permite cadastrar/entrar, restaurar a sessão, criar, percorrer páginas, editar por URL/reload, excluir com confirmação e sair, com layout responsivo em Angular Material e formulários reativos tipados.

NgRx organiza autenticação e tarefas com reducers/selectors/effects/facades. Token e senha ficam fora do Store; requisições pendentes são canceladas no fim da sessão e respostas antigas não repovoam dados de outra conta. Erros preservam a edição e permitem nova tentativa. A URL pública da API é configurada antes do bootstrap.

A integração usa o [backend Symfony](https://github.com/GuilhermeBenites/agu-php), contrato 0.1.0. O coordenador E2E recebe diretório ou URL/ref, provisiona banco/cache/chaves temporários e permite um projeto frontend separado. Nenhum comando exige uma pasta irmã.

## Validação local

- Instalação, dependências, lint, cobertura e build a partir de cópia limpa com volume node_modules novo.
- 78 testes aprovados; 91,56% de linhas; build inicial 471,20 kB.
- 20 execuções E2E em desktop/celular mais oito com Redis desligado; API/banco reais.
- Cenários de teclado, isolamento, paginação, edição por URL e recuperação de falhas.
- Ensaio com .env.local inválido no backend confirmou que o ambiente temporário usa seus próprios serviços/chaves.

Relatórios e limites em docs/FASE_5.md; roteiro em docs/DEMONSTRACAO.md. Dois estilos geram avisos acima de 2 kB, respeitando o limite de erro de 4 kB. O teste visual não inclui leitor de tela.
