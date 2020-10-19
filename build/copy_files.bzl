"""
TODO
"""

def _copy_files_impl(ctx):
    all_outputs = []

    for file in ctx.files.srcs:
        if not file.short_path.startswith(ctx.attr.strip_prefix):
            fail("Filename %s does not begin with prefix %s" % (
                file,
                ctx.attr.strip_prefix,
            ))

        output_path = file.short_path[len(ctx.attr.strip_prefix):]
        if output_path.startswith("/"):
            output_path = output_path[1:]

        output = ctx.actions.declare_file("%s/%s" % (
            ctx.label.name,
            output_path,
        ))

        ctx.actions.run(
            arguments = ["-D", file.path, output.path],
            executable = "install",
            inputs = depset([file]),
            outputs = [output],
        )

        all_outputs.append(output)

    return [DefaultInfo(files = depset(all_outputs))]

copy_files = rule(
    implementation = _copy_files_impl,
    attrs = {
        "strip_prefix": attr.string(),
        "srcs": attr.label_list(allow_files = True),
    },
)
