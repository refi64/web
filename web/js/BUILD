load("@npm_bazel_rollup//:index.bzl", "rollup_bundle")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "dom_lib",
    srcs = [
        "dom.ts",
        "navigate.ts",
    ],
    deps = [
        "@npm//@material/base",
        "@npm//nanomorph",
    ],
)

ts_library(
    name = "core_lib",
    srcs = ["core.ts"],
    deps = [
        ":dom_lib",
        "@npm//@material/drawer",
        "@npm//@material/list",
        "@npm//@material/ripple",
        "@npm//@material/top-app-bar",
    ],
)

rollup_bundle(
    name = "bundle.core",
    config_file = "rollup.config.js",
    entry_point = "core.ts",
    format = "iife",
    deps = [
        ":core_lib",
        "@npm//@rollup/plugin-commonjs",
        "@npm//@rollup/plugin-node-resolve",
        "@npm//rollup-plugin-terser",
    ],
)

ts_library(
    name = "tags_lib",
    srcs = ["tags.ts"],
    deps = [
        ":dom_lib",
        "@npm//@material/chips",
    ],
)

rollup_bundle(
    name = "bundle.tags",
    config_file = "rollup.config.js",
    entry_point = "tags.ts",
    format = "iife",
    deps = [
        ":tags_lib",
        "@npm//@rollup/plugin-commonjs",
        "@npm//@rollup/plugin-node-resolve",
        "@npm//rollup-plugin-terser",
    ],
)

filegroup(
    name = "js",
    srcs = [
        ":bundle.core",
        ":bundle.tags",
    ],
    visibility = ["//visibility:public"],
)
