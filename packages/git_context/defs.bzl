"""
TODO
"""

load("//packages/nunjucks_compiler:defs.bzl", "NjkContextInfo")

def _git_context_impl(ctx):
    output = ctx.actions.declare_file(ctx.label.name + ".json")

    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    args.add("--stableStatus=%s" % ctx.info_file.path)
    args.add("--output=%s" % output.path)

    ctx.actions.run(
        arguments = [args],
        executable = ctx.executable.tool,
        inputs = depset([ctx.info_file]),
        outputs = [output],
        execution_requirements = {"supports-workers": "1"},
        mnemonic = "GitContext",
    )

    return [
        DefaultInfo(files = depset([output])),
        NjkContextInfo(context_files = depset([output])),
    ]

git_context = rule(
    implementation = _git_context_impl,
    attrs = {
        "tool": attr.label(
            default = Label("//packages/git_context"),
            executable = True,
            cfg = "host",
        ),
    },
)
