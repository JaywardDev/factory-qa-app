export const DEBUG = true; // set false for production builds

export function log(scope: string, ...args: unknown[]) {
  if (!DEBUG) return;
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${time}] [${scope}]`, ...args);
}