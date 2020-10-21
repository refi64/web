load("@io_bazel_rules_sass//:defs.bzl", "sass_library")
load("//:build/npm_enabled_sass_binary.bzl", "npm_enabled_sass_binary")

sass_library(
    name = "colors",
    srcs = ["_colors.scss"],
)

npm_enabled_sass_binary(
    name = "core",
    src = "core.scss",
    deps = [
        ":colors",
        "//packages/material:drawer",
        "//packages/material:icon-button",
        "//packages/material:list",
        "//packages/material:shape",
        "//packages/material:theme",
        "//packages/material:top-app-bar",
    ],
)

npm_enabled_sass_binary(
    name = "highlight",
    src = "highlight.scss",
    deps = [
        "//packages/highlight_themes:androidstudio",
        "//packages/highlight_themes:github",
    ],
)

npm_enabled_sass_binary(
    name = "lightbox",
    src = "lightbox.scss",
    deps = [
        "//packages/tobii",
    ],
)

npm_enabled_sass_binary(
    name = "tags",
    src = "tags.scss",
    deps = [
        ":colors",
        "//packages/material:chips",
    ],
)

filegroup(
    name = "styles",
    srcs = [
        ":core",
        ":highlight",
        ":lightbox",
        ":tags",
    ],
    visibility = ["//visibility:public"],
)
