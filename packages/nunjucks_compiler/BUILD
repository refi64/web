load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "nunjucks_compiler_lib",
    srcs = ["index.ts"],
    deps = [
        "//packages/worker_utils",
        "@npm//@bazel/worker",
        "@npm//@types/node",
        "@npm//@types/nunjucks",
        "@npm//nunjucks",
    ],
)

nodejs_binary(
    name = "nunjucks_compiler",
    data = [":nunjucks_compiler_lib"],
    entry_point = ":index",
    visibility = ["//visibility:public"],
)
