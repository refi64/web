import * as worker from '@bazel/worker'
import * as utils from 'web_next/packages/worker_utils'
import * as fs from 'fs'
import * as path from 'path'
import * as cheerio from 'cheerio'

type Args = {
  metadataFiles: string[]
  postFiles: string[]
  output: string
}

interface Metadata {
  doctitle: string
  created: string
  tags: string
}

function _zipWith<T, U, V>(xs: T[], ys: U[], func: (x: T, y: U) => V): V[] {
  if (xs.length !== ys.length) {
    throw Error(`${xs.length} !== ${ys.length}`)
  }

  return xs.map((x, i) => func(x, ys[i]))
}

class PostListExtractorWorker extends utils.WorkerImpl<Args> {
  parse(builder: utils.EmptyBuilder<Args>): utils.CompletedBuilder<Args> {
    return builder
      .next('metadataFiles', utils.Parsers.list(utils.Parsers.nonEmptyString))
      .next('postFiles', utils.Parsers.list(utils.Parsers.nonEmptyString))
      .next('output', utils.Parsers.nonEmptyString)
  }

  async execute(args: Args, _inputs?: utils.WorkerInputs): Promise<void> {
    if (args.metadataFiles.length !== args.postFiles.length) {
      throw new utils.WorkerError(
        '--metadataFiles length != --postFiles length'
      )
    }

    let posts = _zipWith(
      args.metadataFiles,
      args.postFiles,
      (metadata, post) => ({ metadata, post })
    )

    let result = { posts: [] }

    for (let post of posts) {
      let metadata = JSON.parse(fs.readFileSync(post.metadata, 'utf8'))
      let html = cheerio.load(fs.readFileSync(post.post, 'utf8'))

      let { doctitle: title, created, tags }: Metadata = metadata.metadata
      if (!title || !created || !tags) {
        throw new utils.WorkerError(`${post.post} has missing metadata fields`)
      }

      let teaser = html('#teaser')
      if (!teaser.length) {
        throw new utils.WorkerError(`${post.post} has no teaser`)
      }

      result.posts.push({
        title,
        created,
        tags: tags.split(' '),
        id: path.basename(post.post),
        teaser: teaser.html(),
      })
    }

    fs.writeFileSync(args.output, JSON.stringify(result))
    worker.log(`Wrote ${args.output}`)
  }
}

utils.runWorker(new PostListExtractorWorker())
