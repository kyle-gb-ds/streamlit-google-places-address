import streamlit as st
from streamlit_google_places_address import address_search

st.set_page_config(page_title="Address Search Demo")

st.title("Address Search")

# Load API key from Streamlit secrets
api_key = st.secrets.get("GOOGLE_MAPS_API_KEY")

if not api_key:
    st.error("API key not configured.")
    st.info("Create `.streamlit/secrets.toml` and add GOOGLE_MAPS_API_KEY.")
    st.stop()


country = st.text_input("Country Code (optional)", value="za")

st.write("Start typing an address below:")

result = address_search(
    api_key=api_key,
    placeholder="Start typing an address...",
    country=country or None,
    theme="auto",
    key="address_search_demo",
)

st.subheader("Selected Address")

if result:
    st.json(result)
else:
    st.write("No address selected yet.")