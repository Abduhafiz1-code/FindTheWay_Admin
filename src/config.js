// To'rtala loyihaning manzillari bir joyda.
// .env faylga o'zgartirib yozsangiz bo'ladi:
//   VITE_DESKTOP_URL=http://localhost:5173
//   VITE_BIZNES_URL=http://localhost:5174
//   VITE_APP_URL=http://localhost:5175
export const DESKTOP_URL = import.meta.env.VITE_DESKTOP_URL || 'http://localhost:5173'
export const BIZNES_URL = import.meta.env.VITE_BIZNES_URL || 'http://localhost:5174'
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5175'

function go(base, path = '/') {
  window.location.href = base.replace(/\/$/, '') + path
}

export function goToDesktop(path = '/') {
  go(DESKTOP_URL, path)
}

export function goToBiznes(path = '/') {
  go(BIZNES_URL, path)
}

export function goToApp(path = '/') {
  go(APP_URL, path)
}
