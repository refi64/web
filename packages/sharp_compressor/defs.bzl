"""
TODO
"""

def _sharp_compression_impl(ctx):
    all_outputs = []

    for image in ctx.files.images:
        if not image.short_path.startswith(ctx.label.package):
            fail("%s must be relative to %s" % (image, ctx.label.package))

        relative_path = image.short_path[len(ctx.label.package) + 1:]
        relative_path_without_ext = relative_path[:-(1 + len(image.extension))]

        output_names = []
        output_names.append("%s.compressed.%s" % (relative_path_without_ext, image.extension))
        output_names.append("%s.compressed.webp" % relative_path_without_ext)
        output_names.append("%s.compressed.avif" % relative_path_without_ext)

        outputs = [ctx.actions.declare_file(output) for output in output_names]

        args = ctx.actions.args()
        args.use_param_file("@%s", use_always = True)
        args.set_param_file_format("multiline")

        args.add("--input=%s" % image.path)
        args.add("--outputs=%s" % ";".join([output.path for output in outputs]))

        if ctx.attr.copy_original:
            original_copy = ctx.actions.declare_file(relative_path)
            args.add("--originalCopy=%s" % original_copy.path)
            outputs.append(original_copy)
        else:
            args.add("--originalCopy=")

        ctx.actions.run(
            arguments = [args],
            executable = ctx.executable.tool,
            inputs = depset([image]),
            outputs = outputs,
            execution_requirements = {"supports-workers": "1"},
            mnemonic = "SharpCompressor",
        )

        all_outputs.extend(outputs)

    return [DefaultInfo(files = depset(all_outputs))]

sharp_compression = rule(
    implementation = _sharp_compression_impl,
    attrs = {
        "images": attr.label_list(allow_files = [".jpg", ".jpeg", ".png"]),
        "copy_original": attr.bool(),
        "tool": attr.label(
            default = Label("//packages/sharp_compressor"),
            executable = True,
            cfg = "host",
        ),
    },
)
