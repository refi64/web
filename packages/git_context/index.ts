import * as fs from 'fs'
import * as worker from '@bazel/worker'
import * as utils from 'web_next/packages/worker_utils'

type Args = {
  stableStatus: string
  output: string
}

const GIT_TIMESTAMP_KEY = 'STABLE_GIT_LAST_COMMIT'

class GitContextWorker extends utils.WorkerImpl<Args> {
  constructor() {
    super()
  }

  parse(builder: utils.EmptyBuilder<Args>): utils.CompletedBuilder<Args> {
    return builder
      .next('stableStatus', utils.Parsers.nonEmptyString)
      .next('output', utils.Parsers.nonEmptyString)
  }

  async execute(args: Args, _inputs?: utils.WorkerInputs): Promise<void> {
    let status = fs.readFileSync(args.stableStatus, { encoding: 'utf-8' })
    let result = { git: { last_commit_timestamp: null } }

    for (let line of status.split('\n')) {
      worker.debug(`Status line: ${line}`)
      if (line.startsWith(GIT_TIMESTAMP_KEY)) {
        result.git.last_commit_timestamp = line.split(' ')[1]
        break
      }
    }

    if (!result.git.last_commit_timestamp) {
      throw new Error(`Could not find ${GIT_TIMESTAMP_KEY}`)
    }

    fs.writeFileSync(args.output, JSON.stringify(result))
    worker.debug(`Wrote ${args.output}`)
  }
}

utils.runWorker<Args>(new GitContextWorker())
