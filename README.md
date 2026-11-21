# festec

Sistema de gerenciamento de entrada de convidados em eventos — projeto **frontend estático** de portfólio, feito em HTML, CSS e JavaScript puro (sem frameworks, sem build, sem backend).

## Funcionalidades

- **Login simulado** com validação inline, animação de erro, mostrar/ocultar senha e proteção de rota via `sessionStorage`.
- **Painel do evento** com métricas em tempo real (total, presentes, aguardando, VIPs) e barra de ocupação.
- **Lista de convidados** com busca instantânea (nome, e-mail, telefone ou código), filtros por status e tipo de ingresso, e ordenação por nome e check-in.
- **Check-in** por botão ou **check-in rápido por código** (`FST-XXXX` + Enter), com destaque visual da linha confirmada.
- **Adicionar / editar / remover** convidados com modal acessível, máscara de telefone, validação inline e código de ingresso gerado automaticamente.
- **Exportar CSV** da lista filtrada (compatível com Excel pt-BR).
- Toasts de feedback, relógio ao vivo, layout responsivo (a tabela vira cards no mobile).
- Persistência em `localStorage` e botão para restaurar os dados de demonstração.

## Como rodar

Não há dependências para instalar.

1. Abra o arquivo `index.html` direto no navegador, **ou**
2. Use a extensão **Live Server** do VS Code (clique com o botão direito em `index.html` → *Open with Live Server*).

## Build de publicação

O código-fonte roda direto no navegador, mas para publicar existe um build que gera uma cópia protegida em `dist/`:

```bash
npm install      # instala javascript-obfuscator e clean-css (só na primeira vez)
npm run build    # gera a pasta dist/
```

O build copia o projeto para `dist/`, ofusca `js/auth.js`, `js/data.js`, `js/painel.js` e `js/protect.js` e minifica `css/styles.css`. Os arquivos originais não mudam. **Publique só a pasta `dist/`.** Ela é recriada a cada build e, assim como `node_modules/`, fica fora do Git (`.gitignore`).

## Proteção leve

O `js/protect.js` é carregado nas duas páginas e adiciona camadas de **dissuasão**:

- bloqueia o menu de contexto, arrastar imagens e os atalhos F12, Ctrl+U, Ctrl+S e Ctrl+Shift+I/J/C;
- impede selecionar texto na tabela e nos cards (os campos de formulário continuam selecionáveis);
- no painel: desfoque com o aviso "Conteúdo protegido" quando a janela perde o foco e um aviso ao pressionar PrintScreen.

Essas medidas só atrapalham o usuário casual. Não são segurança real: tudo o que chega ao navegador pode ser lido por quem souber como.

## Credenciais da demo

| Campo | Valor |
| ----- | ----- |
| Nome  | qualquer nome (mínimo 2 caracteres) |
| Senha | `1234` |

## Estrutura

```
├── index.html       # Tela de login
├── painel.html      # Gerenciador de convidados
├── assets/img/      # Imagem de fundo do login
├── css/styles.css   # Estilos compartilhados (variáveis CSS)
└── js/
    ├── auth.js      # Login simulado e proteção de rota
    ├── data.js      # Evento e 25 convidados fictícios
    ├── painel.js    # Lógica do gerenciador
    └── protect.js   # Proteção leve (dissuasão)
scripts/build.js     # Build: copia para dist/, ofusca JS e minifica CSS
```

## Acessibilidade

Labels em todos os campos, foco visível, navegação por teclado com foco preso nos modais (ESC fecha), `aria-live` nos toasts, `aria-sort` na tabela e contraste AA. Atalho: `/` foca a busca.

---

Todos os dados são fictícios.
