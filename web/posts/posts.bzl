"""
TODO
"""

load("//:build/pages.bzl", "page")

POST_PAGES = [
    page(src = "audio-storage.adoc"),
    page(src = "dont-boycott-wayland.adoc"),
    # This was a test page
    # page(src = "test.adoc"),
    page(src = "vuedart-0.4-released.adoc"),
    page(src = "qldv.adoc"),
    page(src = "vuedart-0.3.1-released.adoc"),
    page(src = "vuedart-0.3-released.adoc"),
    page(src = "web-port.adoc"),
    # This page is stupid and all the image links are bad anyway
    # page(src = "hacker-sterotype.adoc"),
    page(src = "when-replacing-a-hard-drive.adoc"),
    page(src = "moving-from-nikola-to-polymer.adoc"),
    page(src = "an-idea-for-concise-checked-error-handling-in-imperative-languages.adoc"),
    page(src = "a-tour-of-the-howl-programming-text-editor.adoc"),
    page(src = "implementing-a-sort-of-generic-sort-of-type-safe-arrayin-c.adoc"),
    page(src = "programming-decisions.adoc"),
    page(src = "the-magic-of-rpython.adoc"),
    # The fact that I once wrote this shit is terrifying
    # page(src = "functional-programming-isnt-the-answer-to-all-problems-and-neither-is-oop.adoc"),
    page(src = "the-top-5-programming-languages-youve-never-heard-of-part-2.adoc"),
    page(src = "the-top-5-programming-languages-youve-never-heard-of.adoc"),
    page(src = "using-appveyor-to-distribute-python-wheels.adoc"),
    page(src = "overloading-functions-with-the-c-preprocessor.adoc"),
    page(src = "welcome.adoc"),
]
