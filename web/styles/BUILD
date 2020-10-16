load("//:build/npm_enabled_sass_binary.bzl", "npm_enabled_sass_binary")

npm_enabled_sass_binary(
    name = "styles",
    src = "styles.scss",
    visibility = ["//visibility:public"],
    deps = [
        "//packages/highlight_themes:androidstudio",
        "//packages/highlight_themes:github",
        "//packages/material:chips",
        "//packages/material:drawer",
        "//packages/material:icon-button",
        "//packages/material:list",
        "//packages/material:shape",
        "//packages/material:theme",
        "//packages/material:top-app-bar",
    ],
)
