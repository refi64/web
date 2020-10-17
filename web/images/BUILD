load("//packages/sharp_compressor:defs.bzl", "sharp_compression")

IMAGES = glob([
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.png",
])

sharp_compression(
    name = "compressed",
    # XXX: Re-enable if we can add a high-res viewing option to Tobii
    # copy_original = True,
    images = IMAGES,
)

filegroup(
    name = "images",
    srcs = [":compressed"] + IMAGES,
    visibility = ["//visibility:public"],
)
