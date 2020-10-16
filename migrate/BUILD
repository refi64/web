load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "migrate_lib",
    srcs = ["index.ts"],
    deps = [
        "@npm//@types/cheerio",
        "@npm//@types/node",
        "@npm//cheerio",
    ],
)

nodejs_binary(
    name = "migrate",
    data = [":migrate_lib"],
    entry_point = ":index",
    visibility = ["//visibility:public"],
)
