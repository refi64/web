load(
    "//packages/nunjucks_compiler:defs.bzl",
    "nunjucks_library",
    "nunjucks_literal_context",
    "nunjucks_ts_context",
)
load("//:settings.bzl", "SETTINGS")

package(default_visibility = ["//visibility:public"])

nunjucks_library(
    name = "macros",
    srcs = ["_macros.njk"],
)

nunjucks_literal_context(
    name = "settings_context",
    context = {
        "ga_property_id": SETTINGS.ga_property_id,
        "hyvor_website_id": SETTINGS.hyvor_website_id,
    },
    namespace = "settings",
    visibility = ["//visibility:private"],
)

nunjucks_ts_context(
    name = "sidebar_context",
    src = "sidebar.ts",
    visibility = ["//visibility:private"],
)

nunjucks_library(
    name = "template",
    context_files = [
        ":sidebar_context",
        ":settings_context",
    ],
    primary = "main.njk",
)

nunjucks_library(
    name = "post",
    context_files = [":template"],
    primary = "post.njk",
    deps = [
        ":macros",
        ":template",
    ],
)
