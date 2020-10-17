import * as fs from 'fs'
import * as sharp from 'sharp'
import * as path from 'path'
import * as worker from '@bazel/worker'
import * as utils from 'web_next/packages/worker_utils'

type Args = {
  input: string
  outputs: string[]
  originalCopy: string
}

class SharpWorker extends utils.WorkerImpl<Args> {
  constructor() {
    super()
  }

  _copyFile(src: string, dest: string): Promise<void> {
    return new Promise<void>((resolve, reject) =>
      fs.copyFile(src, dest, (err) => (err ? reject(err) : resolve()))
    )
  }

  parse(builder: utils.EmptyBuilder<Args>): utils.CompletedBuilder<Args> {
    return builder
      .next('input', utils.Parsers.nonEmptyString)
      .next('outputs', utils.Parsers.list(utils.Parsers.nonEmptyString))
      .next('originalCopy', utils.Parsers.id)
  }

  async execute(args: Args, _inputs?: utils.WorkerInputs): Promise<void> {
    if (args.originalCopy) {
      await this._copyFile(args.input, args.originalCopy)
      worker.debug(`Copied to ${args.originalCopy}`)
    }

    let base = sharp(args.input)

    for (let output of args.outputs) {
      let pipeline = base.clone()
      switch (path.extname(output)) {
        case '.jpg':
        case '.jpeg':
          pipeline = pipeline.jpeg({
            trellisQuantisation: true,
            overshootDeringing: true,
            optimizeScans: true,
          })
          break
        case '.png':
          // Not using progressive: https://stackoverflow.com/a/14124340
          pipeline = pipeline.png({
            adaptiveFiltering: true,
            palette: true,
          })
          break
        case '.webp':
          pipeline = pipeline.webp({
            smartSubsample: true,
          })
          break
        case '.avif':
          // No custom options here.
          break
        default:
          throw new Error(`Unexpected output extension: ${output}`)
      }

      await pipeline.toFile(output)
      worker.debug(`Wrote ${output}`)
    }
  }
}

utils.runWorker<Args>(new SharpWorker())
