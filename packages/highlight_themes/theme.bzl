"""
Docstring
"""

load("@io_bazel_rules_sass//:defs.bzl", "sass_library")

def highlight_js_theme(name):
    sass_library(
        name = name,
        srcs = ["@npm//:node_modules/highlight.js/scss/%s.scss" % name],
    )
