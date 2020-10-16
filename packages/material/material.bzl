"""
TODO
"""

load("@io_bazel_rules_sass//:defs.bzl", "sass_library")

def material_styles(component, imports = [], partials = [], deps = [], named_self = True):
    """
    TODO

    Args:
        component:
        imports:
        partials:
        deps:
        named_self:
    """
    srcs = []
    groups = [
        struct(
            prefix = "",
            names = imports + (["mdc-%s" % component] if named_self else []),
        ),
        struct(
            prefix = "_",
            names = partials + ["index"],
        ),
    ]

    for group in groups:
        for name in group.names:
            parts = name.split("/")
            parts[-1] = group.prefix + parts[-1]
            srcs.append("@npm//:node_modules/@material/%s/%s.scss" % (component, "/".join(parts)))

    sass_library(
        name = component,
        srcs = srcs,
        deps = deps,
    )
