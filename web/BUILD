load("//:build/copy_files.bzl", "copy_files")
load("//packages/git_context:defs.bzl", "git_context")
load("//packages/nunjucks_compiler:defs.bzl", "nunjucks_binary")
load("@npm//http-server:index.bzl", "http_server")

git_context(name = "git_context")

nunjucks_binary(
    name = "index",
    template = "index.njk",
    deps = [
        "//web/posts:post_list_context",
        "//web/template",
        "//web/template:macros",
    ],
)

nunjucks_binary(
    name = "404",
    template = "404.njk",
    deps = [
        "//web/template",
        "//web/template:macros",
    ],
)

nunjucks_binary(
    name = "tags",
    template = "tags.njk",
    deps = [
        "//web/posts:post_list_context",
        "//web/template",
        "//web/template:macros",
    ],
)

nunjucks_binary(
    name = "atom",
    output = "atom.xml",
    template = "atom.njk",
    deps = [
        ":git_context",
        "//web/posts:post_list_context",
    ],
)

WEB_OUTPUT = "out"

copy_files(
    name = WEB_OUTPUT,
    srcs = [
        ":404",
        ":atom",
        ":index",
        ":tags",
        "//web/images",
        "//web/js",
        "//web/posts",
        "//web/proj",
        "//web/styles",
    ],
    strip_prefix = "web",
)

http_server(
    name = "server",
    args = ["web/%s" % WEB_OUTPUT],
    data = [":%s" % WEB_OUTPUT],
)
