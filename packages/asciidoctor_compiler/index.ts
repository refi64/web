import * as worker from '@bazel/worker'
import asciidoctor, { Asciidoctor } from 'asciidoctor'
import * as highlightExt from 'asciidoctor-highlight.js'
import * as fs from 'fs'
import * as utils from 'web_next/packages/worker_utils'

type Args = {
  adoc: string
  output: string
  metadataFile: string
  extends: string
  block: string
  templateDirs: string[]
}

class AsciidoctorWorker extends utils.WorkerImpl<Args> {
  asciidoctor = asciidoctor()
  registry = this.asciidoctor.Extensions.create()

  constructor() {
    super()

    highlightExt.register(this.registry)
  }

  parse(builder: utils.EmptyBuilder<Args>): utils.CompletedBuilder<Args> {
    return builder
      .next('adoc', utils.Parsers.nonEmptyString)
      .next('output', utils.Parsers.nonEmptyString)
      .next('metadataFile', utils.Parsers.id)
      .next('extends', utils.Parsers.id)
      .next('block', utils.Parsers.id)
      .next('templateDirs', utils.Parsers.list(utils.Parsers.nonEmptyString))
  }

  async execute(args: Args, _inputs?: utils.WorkerInputs): Promise<void> {
    let doc = this.asciidoctor.loadFile(args.adoc, {
      attributes: { 'source-highlighter': 'highlightjs-ext' },
      extension_registry: this.registry,
      template_dirs: args.templateDirs,
      template_engine_options: {
        nunjucks: { noCache: true },
      },
    })

    let result = doc.convert()
    let meta = doc.getAttributes()

    if (args.extends.length !== 0) {
      // XXX: should properly quote extends here
      result = `
{% extends "${args.extends}" %}
{% block ${args.block || 'content'} %}
${result}
{% endblock %}
`
    }

    fs.writeFileSync(args.output, result)
    worker.debug(`Wrote ${args.output}`)

    if (args.metadataFile.length > 0) {
      fs.writeFileSync(args.metadataFile, JSON.stringify({ metadata: meta }))
      worker.debug(`Write ${args.metadataFile}`)
    }
  }
}

utils.runWorker<Args>(new AsciidoctorWorker())
