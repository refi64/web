import * as worker from '@bazel/worker'
import * as utils from 'web_next/packages/worker_utils'
import * as fs from 'fs'
import * as ts from 'typescript'
// @ts-ignore
import * as nodeEval from 'node-eval'

type Args = {
  ts: string
  output: string
}

class TsToJsonWorker extends utils.WorkerImpl<Args> {
  parse(builder: utils.EmptyBuilder<Args>): utils.CompletedBuilder<Args> {
    return builder
      .next('ts', utils.Parsers.nonEmptyString)
      .next('output', utils.Parsers.nonEmptyString)
  }

  async execute(args: Args, _inputs?: utils.WorkerInputs): Promise<void> {
    let transpiled = ts.transpileModule(fs.readFileSync(args.ts, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    })
    let data = nodeEval(transpiled.outputText, args.ts)

    fs.writeFileSync(args.output, JSON.stringify(data))
    worker.log(`Wrote ${args.output}`)
  }
}

utils.runWorker(new TsToJsonWorker())
