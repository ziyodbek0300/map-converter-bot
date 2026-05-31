// Static, user-facing messages (bilingual EN / UZ).

export const MESSAGES = {
  help: [
    '🗺️ Map Link Converter',
    '',
    'Send a Google, Yandex, Apple Maps or 2GIS link — I’ll convert it to the others.',
    '',
    '🇺🇿 Google, Yandex, Apple Maps yoki 2GIS havolasini yuboring — qolganlariga aylantiraman.',
  ].join('\n'),
  notFound:
    'No map link found. Send a Google, Yandex, Apple Maps or 2GIS link.\n' +
    '🇺🇿 Xarita havolasi topilmadi. Google, Yandex, Apple Maps yoki 2GIS havolasini yuboring.',
  error: 'Something went wrong.\n🇺🇿 Xatolik yuz berdi.',
  inlineDescription:
    'Send converted map links / Konvertatsiya havolalarini yuborish',
  inlineNoResult: 'Open bot to convert a link / Havola uchun botni oching',
} as const;
