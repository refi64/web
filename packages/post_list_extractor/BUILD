load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "post_list_extractor_lib",
    srcs = ["index.ts"],
    deps = [
        "//packages/worker_utils",
        "@npm//@bazel/worker",
        "@npm//@types/cheerio",
        "@npm//@types/node",
        "@npm//cheerio",
    ],
)

nodejs_binary(
    name = "post_list_extractor",
    data = [":post_list_extractor_lib"],
    entry_point = ":index",
    visibility = ["//visibility:public"],
)
