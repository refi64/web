load("//:build/pages.bzl", "build_pages")
load(":posts.bzl", "POST_PAGES")
load("//packages/nunjucks_compiler:defs.bzl", "nunjucks_context")
load("//packages/post_list_extractor:defs.bzl", "post_list_metadata")

post_list_metadata(
    name = "post_list_metadata",
    metadata = [":%s-njk" % post.basename for post in POST_PAGES],
    posts = [":%s-html" % post.basename for post in POST_PAGES],
)

nunjucks_context(
    name = "post_list_context",
    src = ":post_list_metadata",
    visibility = ["//visibility:public"],
)

build_pages(
    block = "post_content",
    default_extends = "//web/template:post",
    default_templates = "//web/template/asciidoctor",
    pages = POST_PAGES,
)

filegroup(
    name = "posts",
    srcs = [":%s-html" % post.basename for post in POST_PAGES],
    visibility = ["//visibility:public"],
)
