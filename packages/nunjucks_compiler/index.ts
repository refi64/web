import * as nunjucks from 'nunjucks'
import * as worker from '@bazel/worker'
import * as utils from 'web_next/packages/worker_utils'
import * as fs from 'fs'

type Args = {
  template: string
  contextFiles: string[]
  output: string
}

class NunjucksWorker extends utils.WorkerImpl<Args> {
  env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(null, { noCache: true })
  )

  parse(builder: utils.EmptyBuilder<Args>): utils.CompletedBuilder<Args> {
    return builder
      .next('template', utils.Parsers.nonEmptyString)
      .next('contextFiles', utils.Parsers.list(utils.Parsers.nonEmptyString))
      .next('output', utils.Parsers.nonEmptyString)
  }

  async execute(args: Args, _inputs?: utils.WorkerInputs): Promise<void> {
    let context = {}
    for (let contextFile of args.contextFiles) {
      let contextData = fs.readFileSync(contextFile, 'utf8')
      Object.assign(context, JSON.parse(contextData))
    }

    let result = this.env.render(args.template, context)

    fs.writeFileSync(args.output, result)
    worker.debug(`Wrote ${args.output}`)
  }
}

utils.runWorker<Args>(new NunjucksWorker())
