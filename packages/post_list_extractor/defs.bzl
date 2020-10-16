"""
TODO
"""

load("//packages/asciidoctor_compiler:defs.bzl", "AsciiDoctorMetadataInfo")

def _post_list_metadata_impl(ctx):
    output = ctx.actions.declare_file(ctx.label.name + ".json")

    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    # XXX: Why doesn't this get filtered out elsewhere?
    post_files = [post for post in ctx.files.posts if post.path.endswith(".html")]

    metadata_depsets = []
    metadata_files = []

    for dep in ctx.attr.metadata:
        metadata_depset = dep[AsciiDoctorMetadataInfo].metadata
        metadata_files.extend(metadata_depset.to_list())
        metadata_depsets.append(metadata_depset)

    # XXX: Should have a "post_entry" rule or similar to combine these
    if len(metadata_files) != len(post_files):
        fail("metadata item length (%d) must equal post length (%d)" % (
            len(metadata_files),
            len(post_files),
        ))

    args.add("--metadataFiles=%s" % ";".join([file.path for file in metadata_files]))
    args.add("--postFiles=%s" % ";".join([file.path for file in post_files]))
    args.add("--output=%s" % output.path)

    ctx.actions.run(
        arguments = [args],
        executable = ctx.executable.tool,
        inputs = depset(
            direct = post_files,
            transitive = metadata_depsets,
        ),
        outputs = [output],
        execution_requirements = {"supports-workers": "1"},
        mnemonic = "PostListExtractor",
    )

    return [DefaultInfo(files = depset([output]))]

post_list_metadata = rule(
    implementation = _post_list_metadata_impl,
    attrs = {
        "metadata": attr.label_list(allow_files = False, providers = [AsciiDoctorMetadataInfo]),
        "posts": attr.label_list(allow_files = [".html"]),
        "tool": attr.label(
            default = Label("//packages/post_list_extractor"),
            executable = True,
            cfg = "host",
        ),
    },
)
