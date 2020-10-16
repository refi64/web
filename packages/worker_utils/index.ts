import * as worker from '@bazel/worker'
import * as fs from 'fs'
import { build, EmptyBuilder, CompletedBuilder } from './builder'

export * from './builder'

export type WorkerInputs = { [path: string]: string }

export abstract class WorkerImpl<Args extends object> {
  abstract parse(builder: EmptyBuilder<Args>): CompletedBuilder<Args>
  abstract async execute(args: Args, inputs?: WorkerInputs): Promise<void>
}

export class WorkerError extends Error {
  constructor(message: string) {
    super(message)
  }
}

async function runWorkerWithParsedArgs<Args extends object>(
  workerImpl: WorkerImpl<Args>,
  args: string[],
  inputs?: WorkerInputs
): Promise<boolean> {
  let builder = build<Args>(args)
  let parsed: Args

  try {
    parsed = workerImpl.parse(builder).finish()
  } catch (e) {
    worker.log(`Failed to parse arguments: ${e}`)
    return false
  }

  try {
    await workerImpl.execute(parsed, inputs)
  } catch (e) {
    if (e instanceof WorkerError) {
      worker.log(`Failed to run worker: ${e}`)
    } else {
      worker.log(`Internal error running worker: ${e}: ${e.stack}`)
    }

    return false
  }

  return true
}

export async function runWorker<Args extends object>(
  workerImpl: WorkerImpl<Args>
) {
  try {
    if (worker.runAsWorker(process.argv)) {
      await worker.runWorkerLoop(runWorkerWithParsedArgs.bind(null, workerImpl))
    } else {
      if (process.argv.length !== 3) {
        worker.log('Invalid # of arguments')
        process.exit(1)
      } else if (!process.argv[2].startsWith('@')) {
        worker.log('Expected an arguments file')
        process.exit(1)
      }

      let argsFile = process.argv[2].substring(1)
      let argsLines = fs.readFileSync(argsFile, 'utf8').trim()
      await runWorkerWithParsedArgs(workerImpl, argsLines.split('\n'))
    }
  } catch (e) {
    worker.log(`Internal error: ${e.message}: ${e.stack}`)
    process.exit(1)
  }
}
