load("//:build/pages.bzl", "build_pages")
load(":projects.bzl", "PROJECT_PAGES")

build_pages(
    block = "proj_content",
    default_extends = "//web/template:proj",
    default_templates = "//web/template/asciidoctor",
    pages = PROJECT_PAGES,
)

filegroup(
    name = "proj",
    srcs = [":%s_html" % page.basename for page in PROJECT_PAGES],
    visibility = ["//visibility:public"],
)
