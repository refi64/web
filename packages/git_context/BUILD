load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "git_context_lib",
    srcs = ["index.ts"],
    deps = [
        "//packages/worker_utils",
        "@npm//@bazel/worker",
        "@npm//@types/node",
    ],
)

nodejs_binary(
    name = "git_context",
    data = [":git_context_lib"],
    entry_point = ":index",
    visibility = ["//visibility:public"],
)
