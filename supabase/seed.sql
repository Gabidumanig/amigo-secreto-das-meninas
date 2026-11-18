-- Evento inicial. O slug é o identificador privado do link compartilhado.
insert into public.events (
  public_slug,
  name,
  date_label,
  time_label,
  timezone,
  venue,
  address,
  gift_limit_label,
  registration_status,
  draw_status
)
values (
  'evt_a7f3c91e2b84d0569e1a4c8f27b0d3e5',
  'Amigo Secreto das Meninas',
  '17 de dezembro de 2026',
  '18h',
  'America/Sao_Paulo',
  'Casa da Gabi',
  'Av. Açôce, 92, apartamento 152 — Moema',
  'Presente de até R$ 100,00',
  'open',
  'pending'
)
on conflict (public_slug) do nothing;

-- Após criar a conta da organizadora no Auth do Supabase, vincule com:
-- insert into public.event_admins (event_id, user_id)
-- select e.id, '<USER_UUID>'
-- from public.events e
-- where e.public_slug = 'evt_a7f3c91e2b84d0569e1a4c8f27b0d3e5';
