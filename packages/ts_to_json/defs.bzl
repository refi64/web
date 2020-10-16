"""
TODO
"""

def _ts_to_json_impl(ctx):
    output = ctx.actions.declare_file(ctx.label.name + ".json")

    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    args.add("--ts=%s" % ctx.file.src.path)
    args.add("--output=%s" % output.path)

    ctx.actions.run(
        arguments = [args],
        executable = ctx.executable.tool,
        inputs = [ctx.file.src],
        outputs = [output],
        execution_requirements = {"supports-workers": "1"},
        mnemonic = "TsToJson",
    )

    return [DefaultInfo(files = depset([output]))]

ts_to_json = rule(
    implementation = _ts_to_json_impl,
    attrs = {
        "src": attr.label(allow_single_file = True),
        "tool": attr.label(
            default = Label("//packages/ts_to_json"),
            executable = True,
            cfg = "host",
        ),
    },
)
