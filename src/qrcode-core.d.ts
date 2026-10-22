// Typed entry for qrcode's encoder alone (skips its canvas/SVG/terminal renderers).
declare module 'qrcode/lib/core/qrcode.js' {
  export { create } from 'qrcode'
}
