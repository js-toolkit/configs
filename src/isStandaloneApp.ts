export default function isStandaloneApp(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}
