# Amigo Secreto das Meninas

Aplicação web de amigo secreto (grupo de amigas).

> **Etapa 1 concluída** — interface do evento, formulário, lista de comidas e confirmação.  
> Banco, autenticação, sorteio e e-mails reais **ainda não** estão implementados.

## Análise do ambiente

| Item | Situação |
| --- | --- |
| Pasta aberta antes | `saia-da-zona-3-anos` (outro projeto: quiz/jogos do evento) |
| Projeto amigo secreto | Criado em `C:\Users\GPYZR\amigo-secreto` (local, sem git remoto) |
| Tentativa anterior | Não havia código de amigo secreto no repositório |
| `saia-da-zona-3-anos` | **Não foi modificado** |

## Arquitetura proposta

| Camada | Tecnologia | Papel |
| --- | --- | --- |
| Interface | React + TypeScript + Vite + Tailwind | App estático para GitHub Pages |
| Preview Etapa 1 | `etapa1.html` (HTML + JS) | Testável agora, sem `npm install` |
| Hospedagem UI | GitHub Pages (`gabidumanig/amigo-secreto`) | `base: /amigo-secreto/` no Vite |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) | Cadastro, RLS, sorteio, tokens |
| E-mail | Resend (só no backend) | Confirmação e resultado do sorteio |

Segredos (`service_role`, API keys) nunca vão no frontend.

## Como testar a Etapa 1

Abra o arquivo no navegador:

```text
C:\Users\GPYZR\amigo-secreto\etapa1.html
```

Ou sirva a pasta com qualquer servidor estático e acesse `/etapa1.html`.

O scaffold React em `src/` espelha a mesma interface e será o app principal após `npm install` + `npm run dev` (quando a rede permitir acesso ao registry npm).

Neste ambiente corporativo, `npm install` falhou com `ENOTFOUND registry.npmjs.org` (DNS). Nada foi publicado.

## Real vs demonstrativo

| Funcionalidade | Status |
| --- | --- |
| Informações do evento | Real (conteúdo fixo do briefing) |
| Formulário + validações visuais | Real (frontend) |
| Aviso de comida repetida (normalização) | Real (frontend) |
| Lista de comidas | Demonstrativa (+ inclusão local após confirmar) |
| Persistência / e-mails / sorteio / admin | Não implementados |

## Arquivos da Etapa 1

- `etapa1.html` — interface completa testável
- `src/**` — scaffold React + TS + Tailwind (próximas etapas)
- `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`
- `.env.example`, `.gitignore`, `README.md`

## Pendências (aguardar autorização)

1. **Etapa 2** — banco, migrations, RLS, cadastro real, admin, edição com token  
2. **Etapa 3** — sorteio transacional + testes  
3. **Etapa 4** — e-mails reais (Resend) + fila  
4. **Etapa 5** — GitHub Pages, backend, revisão de segurança, docs finais  

**Não criar repositório no GitHub, commits remotos ou serviços externos sem autorização.**
