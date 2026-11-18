# Amigo Secreto das Meninas

Site: https://gabidumanig.github.io/amigo-secreto-das-meninas/

## Status

| Parte | Situação |
| --- | --- |
| Interface pública | No ar (GitHub Pages) |
| Banco + RLS + cadastro + sorteio + e-mails | Código pronto — **precisa provisionar Supabase/Resend** (ver `SETUP.md`) |

## Links

- Inscrição: `/`  
- Edição (token no e-mail): `/editar.html?token=…`  
- Admin: `/admin.html`

## Desenvolvimento

```bash
node tests/draw.test.mjs
```

Configure `js/config.js` após criar o projeto Supabase. Passo a passo completo em **SETUP.md**.
