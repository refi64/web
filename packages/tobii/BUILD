load("@io_bazel_rules_sass//:defs.bzl", "sass_library")

package(default_visibility = ["//visibility:public"])

sass_library(
    name = "tobii",
    srcs = [
        "@npm//:node_modules/tobii/src/scss/_functions.scss",
        "@npm//:node_modules/tobii/src/scss/_variables.scss",
        "@npm//:node_modules/tobii/src/scss/tobii.scss",
    ],
)
