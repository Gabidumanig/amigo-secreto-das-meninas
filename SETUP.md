# Configuração — Etapas 2 e 3 (+ e-mails)

O site público continua no GitHub Pages. Banco, sorteio e e-mails ficam no **Supabase** (Edge Functions).

## 1. Criar projeto Supabase

1. Em https://supabase.com , crie um projeto (região sugerida: `South America (São Paulo)`).
2. Em **SQL Editor**, rode nesta ordem:
   - conteúdo de `supabase/migrations/20261118120000_init.sql`
   - conteúdo de `supabase/seed.sql`
3. Em **Authentication → Providers**, mantenha e-mail habilitado (magic link da admin).
4. Crie a usuária organizadora em **Authentication → Users → Add user**.
5. Vincule a admin (substitua o UUID):

```sql
insert into public.event_admins (event_id, user_id)
select e.id, '<USER_UUID_DA_ORGANIZADORA>'
from public.events e
where e.public_slug = 'evt_a7f3c91e2b84d0569e1a4c8f27b0d3e5';
```

## 2. Deploy das Edge Functions

Instale a CLI do Supabase e faça login. Depois:

```bash
supabase link --project-ref <PROJECT_REF>
supabase functions deploy register
supabase functions deploy request-edit-link
supabase functions deploy edit-participant
supabase functions deploy admin-api
supabase functions deploy run-draw
```

Secrets (Dashboard → Edge Functions → Secrets, ou CLI):

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set EMAIL_FROM="Amigo Secreto <onboarding@resend.dev>"
supabase secrets set PUBLIC_SITE_URL="https://gabidumanig.github.io/amigo-secreto-das-meninas"
supabase secrets set EMAIL_SIMULATE=true
```

- Com `EMAIL_SIMULATE=true` **nenhum e-mail real** é enviado (apenas registrado).
- Para e-mails reais: configure domínio/remetente no Resend, defina `EMAIL_SIMULATE=false` e `RESEND_API_KEY`.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem no runtime das functions.

## 3. Frontend (GitHub Pages)

Edite `js/config.js`:

```js
window.AMIGO_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY',
  eventSlug: 'evt_a7f3c91e2b84d0569e1a4c8f27b0d3e5',
  functionsBaseUrl: 'https://YOUR_PROJECT.supabase.co/functions/v1',
}
```

Faça commit/push. O link das meninas continua:

https://gabidumanig.github.io/amigo-secreto-das-meninas/

Admin:

https://gabidumanig.github.io/amigo-secreto-das-meninas/admin.html

## 4. Fluxo do sorteio

1. Meninas se cadastram no link público.
2. Organizadora entra em `admin.html` com magic link.
3. **Encerrar inscrições**.
4. **Realizar sorteio** (confirmação obrigatória; uma única vez).
5. Cada uma recebe e-mail individual (ou simulado, se `EMAIL_SIMULATE=true`).
6. Pares **não** aparecem na interface admin.

## 5. Testes locais do algoritmo

```bash
node tests/draw.test.mjs
```

## Segurança

- Não committe `service_role` nem `RESEND_API_KEY`.
- Anon key no frontend só com RLS/RPC restritivos (já no migration).
- Link do evento usa slug longo (`eventSlug`).
