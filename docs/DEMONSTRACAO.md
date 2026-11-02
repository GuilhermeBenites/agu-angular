# Roteiro de demonstração — interface

Preparação: seguir os READMEs dos [dois repositórios](https://github.com/GuilhermeBenites/agu-php). Abrir http://localhost:4200. Não existe conta padrão.

1. **Cadastro/login:** tentar enviar campos vazios, cadastrar uma conta de demonstração e entrar. Mostrar a identidade e recarregar a página para conferir restauração.
2. **Criar:** abrir Nova tarefa, validar título obrigatório, preencher título/descrição e salvar. Mostrar confirmação e tarefa na lista.
3. **Editar por URL:** abrir a edição, recarregar a URL, alterar o título e remover a descrição. Mostrar persistência ao voltar.
4. **Paginação:** usar uma massa de teste com mais de 20 tarefas, trocar a quantidade por página e navegar. O E2E cria essa massa automaticamente em banco descartável.
5. **Excluir:** abrir a confirmação, cancelar com Escape e conferir que a tarefa continua. Repetir e confirmar a exclusão.
6. **Isolar contas:** sair, cadastrar/entrar em outra conta e mostrar lista própria. Abrir a URL de edição da primeira conta: tarefa não encontrada. Voltar à primeira conta para conferir os dados.
7. **Falhas e sessão:** apresentar o E2E de recuperação após falha da API e de expiração/401; mostrar que textos editados são mantidos e que logout limpa o estado.
8. **Redis:** apresentar as 20 execuções normais e oito com o Redis temporário parado. A interface mantém o fluxo; a otimização é interna à API.

Tempo sugerido: 5–8 minutos de produto e mais alguns minutos para decisões/testes. Use contas/tarefas descartáveis para demonstrar exclusão.

## Reprodução automatizada

```sh
E2E_VERIFY_REDIS_OUTAGE=1 bash scripts/e2e.sh /caminho/absoluto/para/agu-php
```

O roteiro de teclado, reload, troca de conta, paginação e cancelamento da exclusão está em e2e/tasks.spec.ts. Relatórios em playwright-report e playwright-report/redis-outage; detalhes em [TESTES_E2E.md](TESTES_E2E.md).
