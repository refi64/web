# load("//packages/asciidoctor_compiler:defs.bzl", "asciidoctor_njk")
load("//packages/nunjucks_compiler:defs.bzl", "nunjucks_binary")
load("@npm//http-server:index.bzl", "http_server")

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
    name = "tags",
    template = "tags.njk",
    deps = [
        "//web/posts:post_list_context",
        "//web/template",
        "//web/template:macros",
    ],
)

http_server(
    name = "server",
    args = ["web"],
    data = [
        ":index",
        ":tags",
        "//web/js",
        "//web/posts",
        "//web/styles",
    ],
)
