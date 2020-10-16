"""
Docstring goes here
"""

load("//packages/ts_to_json:defs.bzl", "ts_to_json")

NjkInfo = provider(fields = ["primary", "transitive"])
NjkContextInfo = provider(fields = ["context_files"])

def _nunjucks_library_impl(ctx):
    direct = []
    transitive = []

    if ctx.file.primary:
        direct.append(ctx.file.primary)

    direct.extend(ctx.files.srcs)

    for dep in ctx.attr.deps:
        info = dep[NjkInfo]
        if info.primary:
            direct.append(info.primary)

        transitive.append(info.transitive)

        if NjkContextInfo in dep and dep not in ctx.attr.context_files:
            fail("%s is missing from context_files" % dep)

    deps = depset(direct = direct, transitive = transitive)

    providers = [
        DefaultInfo(files = deps),
    ]

    if ctx.file.primary or ctx.files.srcs or ctx.attr.deps:
        providers.append(NjkInfo(primary = ctx.file.primary, transitive = deps))

    if ctx.attr.context_files:
        providers.append(NjkContextInfo(context_files = depset(
            transitive = [dep[NjkContextInfo].context_files for dep in ctx.attr.context_files],
        )))

    return providers

nunjucks_library = rule(
    implementation = _nunjucks_library_impl,
    attrs = {
        "primary": attr.label(allow_single_file = True),
        "srcs": attr.label_list(allow_files = True),
        "context_files": attr.label_list(allow_files = False, providers = [NjkContextInfo]),
        "deps": attr.label_list(allow_files = False, providers = [NjkInfo]),
    },
)

def _nunjucks_binary_impl(ctx):
    output = ctx.actions.declare_file((ctx.attr.output or ctx.label.name) + ".html")

    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    transitive = []

    if NjkInfo in ctx.attr.template:
        info = ctx.attr.template[NjkInfo]
        template = info.primary
        if not template:
            fail("template value does not have a primary output")

        transitive.append(info.transitive)
    else:
        files = ctx.attr.template[DefaultInfo].files.to_list()
        if len(files) != 1:
            fail("template value must contain a single output")

        template = files[0]

    context = {}
    context_files = []
    for dep in ctx.attr.deps:
        had_provider = False

        if NjkInfo in dep:
            transitive.append(dep[NjkInfo].transitive)
            had_provider = True

        if NjkContextInfo in dep:
            context_files.extend(dep[NjkContextInfo].context_files.to_list())
            transitive.append(dep[NjkContextInfo].context_files)
            had_provider = True

        if not had_provider:
            fail("deps value %s did not have NjkInfo or NjkContextInfo" % dep)

    args.add("--template=%s" % template.path)
    args.add("--contextFiles=%s" % ";".join([file.path for file in context_files]))
    args.add("--output=%s" % output.path)

    ctx.actions.run(
        arguments = [args],
        executable = ctx.executable.tool,
        inputs = depset(direct = [template], transitive = transitive),
        outputs = [output],
        execution_requirements = {"supports-workers": "1"},
        mnemonic = "Nunjucks",
    )

    return [DefaultInfo(files = depset(direct = [output], transitive = transitive))]

nunjucks_binary = rule(
    implementation = _nunjucks_binary_impl,
    attrs = {
        "template": attr.label(allow_files = True),
        "deps": attr.label_list(allow_files = False),
        "output": attr.string(),
        "tool": attr.label(
            default = Label("//packages/nunjucks_compiler"),
            executable = True,
            cfg = "host",
        ),
    },
)

def _nunjucks_context_impl(ctx):
    deps = depset([ctx.file.src])

    return [
        DefaultInfo(files = deps),
        NjkContextInfo(context_files = deps),
    ]

nunjucks_context = rule(
    implementation = _nunjucks_context_impl,
    attrs = {
        "src": attr.label(allow_single_file = True),
    },
)

def nunjucks_ts_context(name, src, **kwargs):
    ts_to_json(
        name = "%s_json" % name,
        src = src,
        **kwargs
    )

    nunjucks_context(
        name = name,
        src = "%s_json" % name,
        **kwargs
    )

def _nunjucks_literal_context_impl(ctx):
    output = ctx.actions.declare_file(ctx.label.name + ".json")

    # XXX: Not sure of repr of a dict is considered JSON, so play it safe with struct
    if ctx.attr.namespace:
        context = struct(**{ctx.attr.namespace: ctx.attr.context})
    else:
        context = struct(**ctx.attr.context)

    ctx.actions.write(
        output = output,
        content = context.to_json(),
    )

    return [
        DefaultInfo(files = depset([output])),
        NjkContextInfo(context_files = depset([output])),
    ]

nunjucks_literal_context = rule(
    implementation = _nunjucks_literal_context_impl,
    attrs = {
        "namespace": attr.string(),
        "context": attr.string_dict(allow_empty = False),
    },
)
