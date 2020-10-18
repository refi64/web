"""
TODO
"""

load("//packages/asciidoctor_compiler:defs.bzl", "asciidoctor_njk")
load("//packages/nunjucks_compiler:defs.bzl", "nunjucks_binary", "nunjucks_library")

def page(src, extends = None, templates = None):
    basename, ext = src.rsplit(".", 1)

    if ext not in ["adoc", "njk"]:
        fail("Unexpected page file extension for %s" % src)

    return struct(
        src = src,
        basename = basename,
        ext = ext,
        extends = extends,
        templates = templates,
    )

def build_pages(pages, default_extends = None, default_templates = None, block = "content"):
    """
    TODO

    Args:
        pages:
        default_extends:
        default_templates:
        block:
    """

    for page in pages:
        if not page.extends and not default_extends:
            fail("Page %s is missing an extends" % page.extends)

        if page.ext == "adoc":
            asciidoctor_njk(
                name = "%s_njk" % page.basename,
                adoc = "%s.adoc" % page.basename,
                block = block,
                extends = page.extends or default_extends,
                templates = page.templates or default_templates,
                metadata = True,
                visibility = ["//visibility:public"],
            )
        else:
            nunjucks_library(
                name = "%s_njk" % page.basename,
                primary = "%s.njk" % page.basename,
            )

        nunjucks_binary(
            name = "%s_html" % page.basename,
            template = ":%s_njk" % page.basename,
            output = page.basename + ".html",
            visibility = ["//visibility:public"],
            deps = [":%s_njk" % page.basename],
        )
