# Arquitetura e decisões

## Organização

App carrega assets/config.json antes do bootstrap e verifica a sessão. core concentra configuração, contratos, autenticação e interceptors; components/login e register contêm os formulários de conta. features/workspace apresenta a lista, features/tasks concentra formulário/estado e services faz o acesso HTTP. Rotas de telas são lazy.

A SPA acessa a [API Symfony](https://github.com/GuilhermeBenites/agu-php) por URL configurável, sem importar arquivos do backend. OpenAPI 0.1.0 no backend é canônico; os modelos e a validação das respostas no cliente acompanham esse contrato.

## Estado e efeitos

NgRx Store/Effects/Selectors foi adotado para atender ao requisito explícito do enunciado. Facades oferecem operações para os componentes; reducers mantêm estado imutável e effects controlam HTTP/navegação. Componentes cuidam de formulário e apresentação.

switchMap cancela páginas/detalhes superados; exhaustMap evita escritas simultâneas pelo mesmo fluxo. Uma falha mantém os dados editados e permite nova tentativa. Criação volta à primeira página, edição mantém a página e exclusão corrige uma última página vazia. Cancelamento e reset da sessão impedem que respostas antigas repovoem dados após logout/troca de conta.

Não há atualização otimista dos dados persistidos: sucesso da API precede a recarga. Um erro de transporte após envio pode ocorrer depois de uma escrita efetiva; POST não tem chave de idempotência no contrato. Essa limitação não é escondida por uma repetição automática.

## Sessão

Senha passa por comandos RxJS privados, não por actions/Store. Token fica em sessionStorage, fora do NgRx, e Bearer só é enviado à origem/caminho da API protegida. Reload confere exp e /me; expiração/401 encerram a sessão. Uma resposta 401 atrasada de um token antigo não encerra uma sessão nova. Falha temporária em /me permite repetir sem apagar o token.

sessionStorage permite restauração na mesma aba e expõe o token ao JavaScript; não oferece proteção contra XSS. Templates não inserem HTML de tarefas e os títulos são apresentados como texto. Logout local limpa dados; não revoga JWT no servidor. Não há refresh token.

## Formulários, UX e validação

Formulários reativos tipados, limites Unicode compatíveis com a API e confirmação de senha só no cliente. Descrição vazia é normalizada pelo backend. Estados de carregamento/erro/vazio e botões pendentes são explícitos. Exclusão exige diálogo com foco inicial em Cancelar, Escape e restauração de foco.

Material fornece controles; o visual usa SCSS e SVG locais. Layout conferido em desktop/celular, com texto longo e navegação por teclado no E2E. Não foi realizado teste com leitor de tela. O build respeita os limites de erro; dois estilos excedem somente o aviso de 2 kB, documentados na fase 3.

## Testes e integração

Jasmine/Karma testa estado, effects, HTTP, guard/interceptor e formulários. Playwright percorre o fluxo contra API/MySQL/Redis reais e repete tarefas com Redis desligado. Somente os cenários de recuperação injetam falhas HTTP controladas.

O coordenador recebe um diretório explícito ou URL/ref Git do backend. Usa projeto temporário, banco/cache/chaves próprios e configuração de processo que não herda .env.local da origem. E2E_FRONTEND_PROJECT permite um projeto frontend separado. A CI deve apontar a uma referência explícita e compatível da API.
