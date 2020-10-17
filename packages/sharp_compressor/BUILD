load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "sharp_compressor_lib",
    srcs = ["index.ts"],
    deps = [
        "//packages/worker_utils",
        "@npm//@bazel/worker",
        "@npm//@types/node",
        "@npm//@types/sharp",
        "@npm//sharp",
    ],
)

nodejs_binary(
    name = "sharp_compressor",
    data = [":sharp_compressor_lib"],
    entry_point = ":index",
    visibility = ["//visibility:public"],
)
