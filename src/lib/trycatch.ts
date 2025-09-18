export async function tryCatch<T extends Promise<unknown>>(param: T) {
  try {
    return [null, await param] as const;
  } catch (e) {
    return [true, e as Error] as const;
  }
}
