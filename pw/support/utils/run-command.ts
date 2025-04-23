import { execSync } from "child_process"

/**
 * Executes a shell command synchronously and returns its output as a string.
 * If the command fails, logs the error message and returns `null`.
 *
 * @param command - The shell command to execute.
 * @returns The output of the command as a string, or `null` if the command fails.
 */
export function runCommand(command: string): string | null {
    try {
      return execSync(command, {encoding: 'utf-8'}) 
    } catch(error) {
        const typedError = error as Error
        console.log(typedError.message)
        return null // Return null to signify failure
    }
}