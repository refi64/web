"""
TODO
"""

load("@io_bazel_rules_sass//:defs.bzl", "sass_binary")

def npm_enabled_sass_binary(**kw):
    kw["include_paths"] = kw.get("include_paths", []) + ["external/npm/node_modules"]
    sass_binary(**kw)
