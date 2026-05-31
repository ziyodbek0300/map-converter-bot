# 🗺️ Map Link Converter Bot

> **Try it now / Hoziroq sinab ko‘ring:** [@mapconvertbot](https://t.me/mapconvertbot)

A Telegram bot that converts a map link from one provider into the equivalent
links for the others — **Google Maps, Yandex Maps, Apple Maps, and 2GIS**.

Telegram boti bo‘lib, bitta xarita havolasini boshqa xizmatlarning havolalariga
aylantiradi — **Google Maps, Yandex Maps, Apple Maps va 2GIS**.

---

## ✨ Features / Imkoniyatlar

**English**

- Send any **Google / Yandex / Apple Maps / 2GIS** link → get the other three
  back as tappable buttons.
- **Short links work** (`maps.app.goo.gl`, Yandex `/maps/-/…`, `go.2gis.com`, …)
  — they are expanded automatically.
- Picks the **exact pin**, not just the map center.
- **Inline mode** — type `@mapconvertbot <link>` in any chat to share the
  converted result (with buttons) without leaving the conversation. ✅ Working.
- Bilingual replies (English / Oʻzbekcha).

**Oʻzbekcha**

- Istalgan **Google / Yandex / Apple Maps / 2GIS** havolasini yuboring →
  qolgan uchtasini tugmalar ko‘rinishida olasiz.
- **Qisqa havolalar ishlaydi** (`maps.app.goo.gl`, Yandex `/maps/-/…`,
  `go.2gis.com`, …) — ular avtomatik ochiladi.
- Xaritaning markazini emas, **aniq nuqtani** tanlaydi.
- **Inline rejim** — istalgan chatda `@mapconvertbot <havola>` deb yozib,
  natijani (tugmalari bilan) chatdan chiqmasdan ulashing. ✅ Ishlaydi.
- Ikki tilli javoblar (Inglizcha / Oʻzbekcha).

---

## 🚀 How to use / Qanday foydalaniladi

**English**

1. Open [@mapconvertbot](https://t.me/mapconvertbot) and press **Start**.
2. Paste a map link (e.g. a Google Maps share link).
3. Tap a button to open the place in another app, or **📤 Share** to forward it.

**Oʻzbekcha**

1. [@mapconvertbot](https://t.me/mapconvertbot) ni oching va **Start** bosing.
2. Xarita havolasini yuboring (masalan, Google Maps havolasi).
3. Joyni boshqa ilovada ochish uchun tugmani bosing yoki **📤 Share** orqali
   ulashing.

---

## 🔧 How it works / Ishlash tartibi

1. Extracts the first URL from your message. /
   Xabardan birinchi havolani ajratib oladi.
2. Expands short links by following the redirect. /
   Qisqa havolalarni yo‘naltirish orqali to‘liq havolaga ochadi.
3. Detects the provider and parses the coordinates (preferring the real pin
   over the map center). /
   Xizmatni aniqlaydi va koordinatalarni o‘qiydi (markaz emas, aniq nuqtani).
4. Builds links for every other provider and replies with buttons. /
   Qolgan barcha xizmatlar uchun havola yasaydi va tugmalar bilan javob beradi.

Coordinate order differs by provider — Google/Apple use `lat,lon`, while
Yandex/2GIS use `lon,lat`. The bot handles this for each.

---

## 🛠️ Run it yourself / Mustaqil ishga tushirish

**English**

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy the token.
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Add your token — copy `.env.example` to `.env` and set `BOT_TOKEN`:
   ```bash
   cp .env.example .env
   # edit .env → BOT_TOKEN=123456:ABC-your-token
   ```
4. Run it (scripts load `.env` automatically via Node's `--env-file`):
   ```bash
   npm start        # run the built bot
   npm run dev      # rebuild + run
   ```
5. Enable **Inline Mode** in BotFather so the Share button works:
   `/mybots` → your bot → **Bot Settings** → **Inline Mode** → **Turn on**.

**Oʻzbekcha**

1. [@BotFather](https://t.me/BotFather) orqali bot yarating va tokenni nusxalang.
2. Paketlarni o‘rnating va build qiling:
   ```bash
   npm install
   npm run build
   ```
3. Tokenni qo‘shing — `.env.example` ni `.env` ga nusxalang va `BOT_TOKEN` ni
   kiriting:
   ```bash
   cp .env.example .env
   # .env ni tahrirlang → BOT_TOKEN=123456:ABC-tokeningiz
   ```
4. Ishga tushiring (`.env` Node `--env-file` orqali avtomatik o‘qiladi):
   ```bash
   npm start        # tayyor botni ishga tushirish
   npm run dev      # qayta build + ishga tushirish
   ```
5. Share tugmasi ishlashi uchun BotFather'da **Inline Mode** ni yoqing:
   `/mybots` → botingiz → **Bot Settings** → **Inline Mode** → **Turn on**.

---

## 📁 Project structure / Loyiha tuzilmasi

```
src/
  index.ts            Composition root — load config, build bot, launch.
  config.ts           Environment / token loading.
  domain/             Pure map logic — no Telegram, no I/O (except short-link fetch).
    types.ts          Place, Provider, Conversion, ProviderDef.
    coords.ts         Coordinate regex, validation, ordered extraction.
    providers.ts      Provider registry — one self-contained entry per provider.
    converter.ts      Conversion pipeline: detect → expand → parse → build.
    index.ts          Domain barrel (public surface).
  bot/                Telegram layer.
    bot.ts            Bot factory.
    handlers.ts       Update handlers (text message, inline query).
    presenter.ts      Conversion → caption + inline keyboards.
    messages.ts       Static bilingual (EN/UZ) strings.
```

**Adding a provider / Yangi xizmat qo‘shish:** add one entry to
`domain/providers.ts` — the type, host detection, parsing, building, and target
list all derive from the registry automatically. Boshqa fayllarni o‘zgartirish
shart emas.

---

## ℹ️ Notes / Eslatmalar

- Uses **long polling** — no public URL/webhook needed. /
  **Long polling** ishlatadi — ochiq URL/webhook kerak emas.
- Links with only a place **name/address** (no coordinates) can't be
  converted — there's no geocoding step. /
  Faqat **nom/manzil** bo‘lgan havolalar (koordinatasiz) aylantirilmaydi —
  geokodlash bosqichi yo‘q.
