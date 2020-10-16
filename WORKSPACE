workspace(
    name = "web_next",
    managed_directories = {"@npm": ["node_modules"]},
)

# XXX: local_repository won't work for these because there's no WORKSPACE

new_local_repository(
    name = "build_bazel_rules_nodejs",
    build_file = "third_party/rules_nodejs/BUILD.bazel",
    path = "third_party/rules_nodejs",
)

local_repository(
    name = "io_bazel_rules_sass",
    path = "third_party/rules_sass",
)

load("@build_bazel_rules_nodejs//:index.bzl", "yarn_install")

yarn_install(
    name = "npm",
    package_json = "//:package.json",
    yarn_lock = "//:yarn.lock",
)

load("@npm//:install_bazel_dependencies.bzl", "install_bazel_dependencies")

install_bazel_dependencies()

load("@npm_bazel_typescript//:index.bzl", "ts_setup_workspace")

ts_setup_workspace()

load("@io_bazel_rules_sass//:package.bzl", "rules_sass_dependencies")

rules_sass_dependencies()

load("@io_bazel_rules_sass//:defs.bzl", "sass_repositories")

sass_repositories()
