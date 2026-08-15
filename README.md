# Project X

Монгол бүтээлчдийн бүтээлийг нээж, хадгалж, баг хамт олон олох зориулалттай Next.js сайт.

## Ажиллуулах

```bash
npm install
npm run dev
```

## Backend: Supabase

Supabase нь PostgreSQL, Auth, Storage-ийг нэг дор өгдөг тул портфолио сүлжээнд тохиромжтой. Одоогийн интерфэйс нь жишээ өгөгдлөөр шууд ажиллана. Production өгөгдөл холбохын тулд:

1. Supabase project үүсгэн `supabase/schema.sql`-ийг SQL Editor дээр ажиллуулна.
2. `.env.example`-ийг `.env.local` болгон хуулж URL болон anon key-гаа оруулна.
3. Auth болон `project-covers` Storage bucket-ийг идэвхжүүлнэ.

Хэзээ бэлэн болно, Supabase project URL болон anon key-г надад өгвөл бодит нэвтрэх, төсөл оруулах, хадгалах API-г холбоно.
