import streamlit as st
from streamlit_google_places_address import address_search

st.set_page_config(page_title="Address Search Demo")

st.title("Address Search")

api_key = st.secrets.get("GOOGLE_MAPS_API_KEY")

if not api_key:
    st.error("Missing API key. Set GOOGLE_MAPS_API_KEY in .streamlit/secrets.toml")
    st.stop()

result = address_search(
    label="Address Search",
    api_key=api_key,
    help="Search for and select a suggested address.",
    placeholder="Start typing an address",
    country="za",
    key="address_search_demo",
)

st.subheader("Selected Address")

if result:
    st.json(result)
else:
    st.write("No address selected yet.")