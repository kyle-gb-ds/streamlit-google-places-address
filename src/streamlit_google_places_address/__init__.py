from typing import Any, Literal
import streamlit as st

Theme = Literal["auto", "light", "dark"]
LabelVisibility = Literal["visible", "hidden", "collapsed"]

_component = st.components.v2.component(
    "streamlit-google-places-address.address_search",
    js="index-*.js",
    css="styles.css",
    html='<div class="react-root"></div>',
)


def address_search(
    label: str,
    api_key: str,
    placeholder: str = "Search for an address",
    value: str = "",
    country: str | None = None,
    key: str | None = None,
    disabled: bool = False,
    theme: Theme | None = None,
    label_visibility: LabelVisibility = "visible",
    help: str | None = None,
) -> Any:
    valid_label_visibility = {"visible", "hidden", "collapsed"}
    valid_themes = {"auto", "light", "dark"}

    if label_visibility is None:
        raise ValueError("label_visibility cannot be None.")
    label_visibility = label_visibility.lower()
    if label_visibility not in valid_label_visibility:
        raise ValueError(
            f"Invalid label_visibility '{label_visibility}'. "
            f"Expected one of {valid_label_visibility}."
        )

    resolved_theme: str
    if theme is None:
        streamlit_theme = st.get_option("theme.base")
        if streamlit_theme in {"light", "dark"}:
            resolved_theme = streamlit_theme
        else:
            resolved_theme = "auto"
    else:
        theme = theme.lower()
        if theme not in valid_themes:
            raise ValueError(
                f"Invalid theme '{theme}'. Expected one of {valid_themes}."
            )
        resolved_theme = theme

    result = _component(
        key=key,
        default={"value": None},
        data={
            "label": label,
            "labelVisibility": label_visibility,
            "help": help,
            "apiKey": api_key,
            "placeholder": placeholder,
            "value": value,
            "country": country,
            "disabled": disabled,
            "theme": resolved_theme,
        },
        on_value_change=lambda: None,
    )

    return result.value