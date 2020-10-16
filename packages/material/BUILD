# TODO: autogenerate this

load(":material.bzl", "material_styles")

package(default_visibility = ["//visibility:public"])

material_styles(
    component = "base",
    named_self = False,
    partials = ["mixins"],
)

material_styles(
    component = "feature-targeting",
    named_self = False,
    partials = [
        "functions",
        "mixins",
        "variables",
    ],
)

material_styles(
    component = "dom",
    named_self = False,
    partials = ["mixins"],
    deps = [":feature-targeting"],
)

material_styles(
    component = "theme",
    partials = [
        "color-palette",
        "custom-properties",
        "gss",
        "mixins",
        "variables",
        "functions",
        "constants",
    ],
    deps = [":feature-targeting"],
)

material_styles(
    component = "animation",
    named_self = False,
    partials = [
        "variables",
        "functions",
    ],
)

material_styles(
    component = "elevation",
    partials = [
        "variables",
        "mixins",
        "functions",
    ],
    deps = [":animation"],
)

material_styles(
    component = "rtl",
    named_self = False,
    partials = [
        "variables",
        "mixins",
    ],
    deps = [":theme"],
)

material_styles(
    component = "ripple",
    partials = [
        "variables",
        "mixins",
        "keyframes",
        "functions",
    ],
    deps = [
        ":animation",
        ":base",
        ":feature-targeting",
        ":theme",
    ],
)

material_styles(
    component = "shape",
    named_self = False,
    partials = [
        "variables",
        "mixins",
        "functions",
    ],
    deps = [
        ":feature-targeting",
        ":rtl",
        ":theme",
    ],
)

material_styles(
    component = "density",
    named_self = False,
    partials = [
        "variables",
        "functions",
    ],
)

material_styles(
    component = "touch-target",
    partials = [
        "variables",
        "mixins",
    ],
    deps = [
        ":base",
        ":feature-targeting",
    ],
)

material_styles(
    component = "typography",
    partials = [
        "variables",
        "mixins",
        "functions",
    ],
    deps = [
        ":feature-targeting",
        ":theme",
    ],
)

material_styles(
    component = "top-app-bar",
    partials = [
        "variables",
        "mixins",
    ],
    deps = [
        ":animation",
        ":elevation",
        ":ripple",
        ":rtl",
        ":shape",
        ":theme",
        ":typography",
    ],
)

material_styles(
    component = "button",
    partials = [
        "variables",
        "mixins",
    ],
    deps = [
        ":density",
        ":elevation",
        ":feature-targeting",
        ":ripple",
        ":rtl",
        ":shape",
        ":theme",
        ":touch-target",
        ":typography",
    ],
)

material_styles(
    component = "icon-button",
    partials = [
        "variables",
        "mixins",
    ],
    deps = [
        ":density",
        ":feature-targeting",
        ":ripple",
        ":rtl",
        ":theme",
    ],
)

material_styles(
    component = "list",
    partials = [
        "variables",
        "mixins",
    ],
    deps = [
        ":density",
        ":dom",
        ":feature-targeting",
        ":ripple",
        ":rtl",
        ":shape",
        ":theme",
        ":typography",
    ],
)

material_styles(
    component = "drawer",
    imports = [
        "common",
        "dismissible/mdc-drawer-dismissible",
        "modal/mdc-drawer-modal",
    ],
    partials = [
        "variables",
        "mixins",
    ],
    deps = [
        ":animation",
        ":elevation",
        ":feature-targeting",
        ":list",
        ":ripple",
        ":rtl",
        ":shape",
        ":theme",
        ":typography",
    ],
)

material_styles(
    component = "checkbox",
    partials = [
        "functions",
        "keyframes",
        "mixins",
        "variables",
    ],
    deps = [
        ":animation",
        ":density",
        ":feature-targeting",
        ":ripple",
        ":theme",
        ":touch-target",
    ],
)

material_styles(
    component = "chips",
    imports = [
        "chip-set/mdc-chip-set",
        "chip/mdc-chip",
        "trailingaction/mdc-chip-trailing-action",
    ],
    partials = [
        "mixins",
        "variables",
        "trailingaction/mixins",
        "trailingaction/variables",
    ],
    deps = [
        ":animation",
        ":checkbox",
        ":density",
        ":elevation",
        ":feature-targeting",
        ":ripple",
        ":rtl",
        ":shape",
        ":theme",
        ":touch-target",
        ":typography",
    ],
)
