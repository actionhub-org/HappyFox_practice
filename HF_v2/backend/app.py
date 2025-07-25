import streamlit as st
import requests

st.title("Event Description Parser with Gemini NLP")

API_URL = "http://localhost:5200/api/suggest-date"

st.write(f"Using API endpoint: {API_URL}")

description = st.text_area("Enter your event description:", height=150)

if st.button("Parse Event"):
    if not description.strip():
        st.warning("Please enter an event description.")
    else:
        with st.spinner("Parsing and suggesting date..."):
            try:
                st.write(f"[DEBUG] Posting to: {API_URL}")
                response = requests.post(
                    API_URL,
                    json={"description": description}
                )
                if response.status_code == 200:
                    data = response.json()
                    st.subheader("Parsed Event Data:")
                    st.json(data)
                    if data.get("suggested_start_date"):
                        st.success(f"Suggested Start Date: {data['suggested_start_date']}")
                else:
                    st.error(f"API Error: {response.text}")
            except Exception as e:
                st.error(f"Error connecting to backend: {e}") 