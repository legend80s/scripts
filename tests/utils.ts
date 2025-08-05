// tests\utils.ts
export function toUnixPath(filepath: string) {
  return filepath.replace(/\\/g, '/');
}

export class Logger {
  name: string;

  #debugging: boolean;

  constructor(name: string) {
    this.name = name;
    this.#debugging = false;
  }

  set debugging(debugging: boolean) {
    this.#debugging = debugging;
  }

  log = (...args: unknown[]) =>
    this.#debugging && console.log(this.name, ...args);
  error = (...args: unknown[]) =>
    this.#debugging && console.error(this.name, ...args);
}
