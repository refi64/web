load("@npm_bazel_jasmine//:index.bzl", "jasmine_node_test")
load("@npm_bazel_typescript//:index.bzl", "ts_library")

ts_library(
    name = "worker_utils",
    srcs = [
        "builder.ts",
        "index.ts",
    ],
    visibility = ["//visibility:public"],
    deps = [
        "@npm//@bazel/worker",
        "@npm//@types/node",
    ],
)

ts_library(
    name = "worker_utils_test_lib",
    srcs = [
        "builder.spec.ts",
    ],
    deps = [
        ":worker_utils",
        "@npm//@types/jasmine",
    ],
)

jasmine_node_test(
    name = "worker_utils_test",
    srcs = [":worker_utils_test_lib"],
    visibility = ["//visibility:public"],
)
