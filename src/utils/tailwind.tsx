export function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}