load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "ts_to_json_lib",
    srcs = ["index.ts"],
    deps = [
        "//packages/worker_utils",
        "@npm//@bazel/worker",
        "@npm//@types/node",
        "@npm//node-eval",
        "@npm//typescript",
    ],
)

nodejs_binary(
    name = "ts_to_json",
    data = [":ts_to_json_lib"],
    entry_point = ":index",
    visibility = ["//visibility:public"],
)
