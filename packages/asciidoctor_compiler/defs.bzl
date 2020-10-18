"""
Docstring goes here
"""

load("//packages/nunjucks_compiler:defs.bzl", "NjkContextInfo", "NjkInfo")

AsciiDoctorMetadataInfo = provider()
AsciiDoctorNjkTemplatesInfo = provider()

_TEMPLATES = [
    "document",
    "embedded",
    "outline",
    "section",
    "admonition",
    "audio",
    "colist",
    "dlist",
    "example",
    "floating-title",
    "image",
    "listing",
    "literal",
    "stem",
    "olist",
    "open",
    "page_break",
    "paragraph",
    "preamble",
    "quote",
    "thematic_break",
    "sidebar",
    "table",
    "toc",
    "ulist",
    "verse",
    "video",
    "inline_anchor",
    "inline_break",
    "inline_button",
    "inline_callout",
    "inline_footnote",
    "inline_image",
    "inline_indexterm",
    "inline_kbd",
    "inline_menu",
    "inline_quoted",
]

def _asciidoctor_njk_templates_impl(ctx):
    output = ctx.actions.declare_directory(ctx.label.name)

    templates = {}
    direct = [output]
    transitive = []

    for template in _TEMPLATES:
        file = getattr(ctx.file, template.replace("-", "_"))
        if not file:
            continue

        templates[template] = struct(file = file, source = None)
        direct.append(file)

    for dep in ctx.attr.deps:
        info = dep[AsciiDoctorNjkTemplatesInfo]
        for template, file in dep.templates.items():
            if template in templates:
                conflict = templates[template]
                if conflict.source:
                    fail("%s from %s conflicts with %s" % (template, dep, conflict.source))
                else:
                    fail("%s conflicts with %s" % (template, dep))

            templates[template] = struct(file = file, source = dep)

        transitive.append(info.transitive)

    commands = ["rm -rf \"$1\"", "mkdir \"$1\""]

    # $1 is the dir, so we start copying at $2.
    for i, (template, data) in enumerate(templates.items(), start = 2):
        commands.append("cp --reflink=auto \"$%d\" \"$1/%s\".njk" % (i, template))

    # Posix-only!
    ctx.actions.run_shell(
        inputs = direct[1:],
        outputs = [output],
        command = " && ".join(commands),
        arguments = [output.path] + [data.file.path for data in templates.values()],
        use_default_shell_env = True,
        mnemonic = "AsciiDoctorTemplates",
    )

    return [
        DefaultInfo(files = depset([output])),
        AsciiDoctorNjkTemplatesInfo(
            templates = templates,
            transitive = depset(direct = [output], transitive = transitive),
        ),
    ]

asciidoctor_njk_templates = rule(
    implementation = _asciidoctor_njk_templates_impl,
    attrs = dict({
        template.replace("-", "_"): attr.label(allow_single_file = True)
        for template in _TEMPLATES
    }, deps = attr.label_list(allow_files = False, providers = [AsciiDoctorNjkTemplatesInfo])),
)

def _asciidoctor_njk_impl(ctx):
    output = ctx.actions.declare_file(ctx.label.name + ".njk")

    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    args.add("--adoc=%s" % ctx.file.adoc.path)
    args.add("--output=%s" % output.path)
    args.add("--block=%s" % ctx.attr.block)

    metadata = None
    outputs = [output]
    metadata = None

    if ctx.attr.metadata:
        metadata = ctx.actions.declare_file(ctx.label.name + ".meta.json")
        args.add("--metadataFile=%s" % metadata.path)
        outputs.append(metadata)
    else:
        args.add("--metadataFile=")

    extends_info = None

    # XXX: This stuff should be de-duped with nunjucks_compiler/defs.bzl
    # Most of this should probably rely on nunjucks_library
    if ctx.attr.extends:
        extends_info = ctx.attr.extends[NjkInfo]
        if not extends_info.primary:
            fail("extends value must have a primary template")

    args.add("--extends=%s" % (extends_info.primary.path if extends_info else ""))

    template_inputs = []
    template_dirs = []
    if ctx.attr.templates:
        templates_info = ctx.attr.templates[AsciiDoctorNjkTemplatesInfo]
        template_inputs = [templates_info.transitive]
        template_dirs = [input.path for input in template_inputs[0].to_list() if input.is_directory]

    args.add("--templateDirs=%s" % (";".join(template_dirs)))

    ctx.actions.run(
        arguments = [args],
        executable = ctx.executable.tool,
        inputs = depset(direct = [ctx.file.adoc], transitive = template_inputs),
        outputs = outputs,
        # XXX: This breaks nunjucks's default caching
        # execution_requirements = {"supports-workers": "1"},
        mnemonic = "AsciiDoctorNjk",
    )

    providers = [
        DefaultInfo(files = depset(outputs)),
        NjkInfo(
            primary = output,
            transitive = depset(transitive = [
                depset([extends_info.primary]),
                extends_info.transitive,
            ]) if extends_info else depset(),
        ),
    ]

    if metadata:
        providers.append(AsciiDoctorMetadataInfo(metadata = depset([metadata])))

    if metadata or ctx.attr.extends:
        providers.append(NjkContextInfo(context_files = depset(
            direct = [metadata] if metadata else [],
            transitive = [
                ctx.attr.extends[NjkContextInfo].context_files,
            ] if NjkContextInfo in ctx.attr.extends else [],
        )))

    return providers

asciidoctor_njk = rule(
    implementation = _asciidoctor_njk_impl,
    attrs = {
        "adoc": attr.label(allow_single_file = True),
        # XXX: This can probably be handled with a document template
        "extends": attr.label(allow_files = False, providers = [NjkInfo]),
        "block": attr.string(),
        "metadata": attr.bool(),
        "templates": attr.label(allow_files = False, providers = [AsciiDoctorNjkTemplatesInfo]),
        "tool": attr.label(
            default = Label("//packages/asciidoctor_compiler"),
            executable = True,
            cfg = "host",
        ),
    },
)
