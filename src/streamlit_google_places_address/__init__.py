from typing import Any
import streamlit as st

_component = st.components.v2.component(
    "streamlit-google-places-address.address_search",
    js="index-*.js",
    css="styles.css",
    html='<div class="react-root"></div>',
)

def address_search(
    api_key: str,
    placeholder: str = "Search for an address",
    value: str = "",
    country: str | None = None,
    key: str | None = None,
    disabled: bool = False,
    theme: str = "auto",
) -> Any:
    result = _component(
        key=key,
        default={"value": None},
        data={
            "apiKey": api_key,
            "placeholder": placeholder,
            "value": value,
            "country": country,
            "disabled": disabled,
            "theme": theme,
        },
        on_value_change=lambda: None,
    )
    return result.value