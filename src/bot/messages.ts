// Static, user-facing messages (bilingual EN / UZ).

export const MESSAGES = {
  help: [
    '🗺️ Map Link Converter',
    '',
    'Send a Google, Yandex, Apple Maps or 2GIS link — or share a 📍 location — and I’ll convert it to all of them.',
    '',
    '🇺🇿 Google, Yandex, Apple Maps yoki 2GIS havolasini yuboring — yoki 📍 joylashuv ulashing — barchasiga aylantiraman.',
  ].join('\n'),
  notFound:
    'No map link found. Send a Google, Yandex, Apple Maps or 2GIS link.\n' +
    '🇺🇿 Xarita havolasi topilmadi. Google, Yandex, Apple Maps yoki 2GIS havolasini yuboring.',
  error: 'Something went wrong.\n🇺🇿 Xatolik yuz berdi.',
  inlineDescription:
    'Send converted map links / Konvertatsiya havolalarini yuborish',
  inlineNoResult: 'Open bot to convert a link / Havola uchun botni oching',
} as const;
