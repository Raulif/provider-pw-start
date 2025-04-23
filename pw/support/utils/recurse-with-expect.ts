/**
 * Repeatedly executes a provided asynchronous function until it succeeds or the retry conditions are met.
 *
 * @param fn - An asynchronous function that performs assertions or operations.
 *             If the function throws an error, it will be retried based on the provided options.
 * @param options - Optional configuration for retry behavior.
 * @param options.retries - The maximum number of retry attempts. Defaults to 10.
 * @param options.interval - The delay (in milliseconds) between retry attempts. Defaults to 500ms.
 * @param options.timeout - The maximum time (in milliseconds) to keep retrying before giving up. Defaults to 10000ms.
 *
 * @returns A promise that resolves if the function succeeds within the retry conditions,
 *          or rejects if all attempts fail or the timeout is exceeded.
 *
 * @throws Will throw the last encountered error if all retry attempts fail or the timeout is exceeded.
 */

export async function recurseWithExpect(
  fn: () => Promise<void>,
  options?: { retries: number; interval?: number; timeout?: number }
): Promise<void> {
  const retries = options?.retries ?? 10
  const interval = options?.interval ?? 500 // milliseconds
  const timeout = options?.timeout ?? 10000 // milliseconds

  const endTime = Date.now() + timeout
  let attempt = 0
  while (attempt < retries || Date.now() < endTime) {
    try {
      await fn()
      return // All assertions passed
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.warn(
          `Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${interval}ms...`
        )
      } else {
        console.error(
          `Attempt ${attempt + 1} failed. An unknown error occurred. Retrying in ${interval}ms...`
        )
        throw error
      }
    }
    attempt++

    await new Promise((res) => setTimeout(res, interval))
  }

  // Final attempt
  await fn()
}
