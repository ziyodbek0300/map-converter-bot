# 🗺️ Map Link Converter Bot

> **Try it now:** [@mapconvertbot](https://t.me/mapconvertbot)
>
> **Hoziroq sinab koʻring:** [@mapconvertbot](https://t.me/mapconvertbot)

A Telegram bot that converts a map link from one provider into the equivalent
links for the others — **Google Maps, Yandex Maps, Apple Maps, and 2GIS**.

*(Oʻzbekcha tavsif uchun pastga qarang — [Oʻzbekcha](#-oʻzbekcha).)*

---

## 🇬🇧 English

### Features

- Send any **Google / Yandex / Apple Maps / 2GIS** link → get the other three
  back as tappable buttons.
- **Short links work** (`maps.app.goo.gl`, Yandex `/maps/-/…`, `go.2gis.com`, …)
  — they are expanded automatically.
- Picks the **exact pin**, not just the map center.
- **Inline mode** — type `@mapconvertbot <link>` in any chat to share the
  converted result (with buttons) without leaving the conversation. ✅ Working.
- Bilingual replies (English / Oʻzbekcha).

### How to use

1. Open [@mapconvertbot](https://t.me/mapconvertbot) and press **Start**.
2. Paste a map link (e.g. a Google Maps share link).
3. Tap a button to open the place in another app, or **📤 Share** to forward it.

### How it works

1. Extracts the first URL from your message.
2. Expands short links by following the redirect.
3. Detects the provider and parses the coordinates, preferring the real pin
   over the map center.
4. Builds links for every other provider and replies with buttons.

Coordinate order differs by provider — Google/Apple use `lat,lon`, while
Yandex/2GIS use `lon,lat`. The bot handles this for each.

### Run it yourself

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

### Deploy on a server (PM2)

Run the bot 24/7 with [PM2](https://pm2.keymetrics.io/), which restarts it on
crashes and on server reboot.

```bash
# 1. On the server: clone, install, build
git clone <your-repo-url> && cd map-converter
npm ci
npm run build

# 2. Create .env with your token
cp .env.example .env
nano .env            # set BOT_TOKEN=...

# 3. Install PM2 and start via the included config
npm install -g pm2
pm2 start ecosystem.config.js

# 4. Survive reboots: save the process list and enable the startup hook
pm2 save
pm2 startup          # then run the command it prints (once, as root/sudo)
```

Useful PM2 commands:

```bash
pm2 logs map-converter      # tail logs
pm2 restart map-converter   # restart (e.g. after `git pull && npm run build`)
pm2 stop map-converter      # stop
pm2 status                  # overview
```

> **Node version:** the config uses `--env-file-if-exists`, which needs
> **Node ≥ 20.18 / 22.9**. On older Node, either upgrade, or change
> `node_args` in `ecosystem.config.js` to `--env-file=.env` (plain), or drop it
> and export `BOT_TOKEN` in the PM2 `env` block instead.

### Project structure

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

**Adding a provider:** add one entry to `domain/providers.ts` — the type, host
detection, parsing, building, and target list all derive from the registry
automatically.

### Notes

- Uses **long polling** — no public URL/webhook needed.
- Links with only a place **name/address** (no coordinates) can't be
  converted — there's no geocoding step.

---

## 🇺🇿 Oʻzbekcha

Telegram boti bo‘lib, bitta xarita havolasini boshqa xizmatlarning havolalariga
aylantiradi — **Google Maps, Yandex Maps, Apple Maps va 2GIS**.

### Imkoniyatlar

- Istalgan **Google / Yandex / Apple Maps / 2GIS** havolasini yuboring →
  qolgan uchtasini bosiladigan tugmalar ko‘rinishida olasiz.
- **Qisqa havolalar ishlaydi** (`maps.app.goo.gl`, Yandex `/maps/-/…`,
  `go.2gis.com`, …) — ular avtomatik ochiladi.
- Xaritaning markazini emas, **aniq nuqtani** tanlaydi.
- **Inline rejim** — istalgan chatda `@mapconvertbot <havola>` deb yozib,
  natijani (tugmalari bilan) chatdan chiqmasdan ulashing. ✅ Ishlaydi.
- Ikki tilli javoblar (Inglizcha / Oʻzbekcha).

### Qanday foydalaniladi

1. [@mapconvertbot](https://t.me/mapconvertbot) ni oching va **Start** bosing.
2. Xarita havolasini yuboring (masalan, Google Maps havolasi).
3. Joyni boshqa ilovada ochish uchun tugmani bosing yoki **📤 Share** orqali
   ulashing.

### Ishlash tartibi

1. Xabardan birinchi havolani ajratib oladi.
2. Qisqa havolalarni yo‘naltirish orqali to‘liq havolaga ochadi.
3. Xizmatni aniqlaydi va koordinatalarni o‘qiydi — markazni emas, aniq nuqtani
   afzal ko‘radi.
4. Qolgan barcha xizmatlar uchun havola yasaydi va tugmalar bilan javob beradi.

Koordinatalar tartibi xizmatga qarab farq qiladi — Google/Apple `lat,lon`,
Yandex/2GIS esa `lon,lat` ishlatadi. Bot har birini to‘g‘ri qayta ishlaydi.

### Mustaqil ishga tushirish

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

### Loyiha tuzilmasi

```
src/
  index.ts            Kirish nuqtasi — konfiguratsiya, bot yaratish, ishga tushirish.
  config.ts           Muhit / token yuklash.
  domain/             Sof xarita mantigʻi — Telegramsiz (qisqa havola fetch'idan tashqari).
    types.ts          Place, Provider, Conversion, ProviderDef.
    coords.ts         Koordinata regex, tekshirish, tartibli ajratish.
    providers.ts      Xizmatlar reyestri — har bir xizmat bitta yozuv.
    converter.ts      Aylantirish jarayoni: aniqlash → ochish → o‘qish → yasash.
    index.ts          Domain barrel (umumiy interfeys).
  bot/                Telegram qatlami.
    bot.ts            Bot fabrikasi.
    handlers.ts       Yangilanish ishlovchilari (matn, inline so‘rov).
    presenter.ts      Conversion → sarlavha + inline tugmalar.
    messages.ts       Ikki tilli (EN/UZ) matnlar.
```

**Yangi xizmat qo‘shish:** `domain/providers.ts` ga bitta yozuv qo‘shing —
tur, xizmatni aniqlash, o‘qish, yasash va ro‘yxat reyestrdan avtomatik
keltirib chiqariladi. Boshqa fayllarni o‘zgartirish shart emas.

### Eslatmalar

- **Long polling** ishlatadi — ochiq URL/webhook kerak emas.
- Faqat **nom/manzil** bo‘lgan havolalar (koordinatasiz) aylantirilmaydi —
  geokodlash bosqichi yo‘q.
