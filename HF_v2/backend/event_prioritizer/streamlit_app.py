import streamlit as st
import requests

st.title('Event Prioritization Demo')

if st.button('Prioritize Events (from MongoDB)'):
    response = requests.get('http://localhost:5000/api/prioritize-mongo-events')
    if response.status_code == 200:
        prioritized = response.json()
        st.subheader('Prioritized Events (from MongoDB)')
        for e in prioritized:
            st.markdown(f"### {e.get('title', 'Untitled')} ({e.get('priority', 'Unknown')}, Score: {e.get('score', '-')})")
            st.write('**Event Type:**', e.get('eventType', ''))
            st.write('**Venue:**', e.get('venue', ''))
            st.write('**Expected Count:**', e.get('expected_count', ''))
            st.write('**Approvers:**', len(e.get('approvers', [])))
            st.write('**Date:**', e.get('date', ''))
            st.write('**Created At:**', e.get('createdAt', ''))
            # Reasoning breakdown (simulate, since API does not return details)
            reasons = []
            if e.get('eventType', '').lower() == 'academic':
                reasons.append('Academic event (+2 rule score)')
            if 'auditorium' in e.get('venue', '').lower():
                reasons.append('Venue is auditorium (+1 rule score)')
            if e.get('expected_count', 0) > 100:
                reasons.append('Large expected attendance (+2 rule score)')
            st.write('**Rule-based reasons:**')
            for r in reasons:
                st.markdown(f'- {r}')
            st.write('**ML-based reasoning:**')
            if e.get('priority', '') == 'High':
                st.markdown('- ML predicts high urgency due to academic type and/or large attendance')
            elif e.get('priority', '') == 'Medium':
                st.markdown('- ML predicts medium urgency based on moderate attendance or other features')
            else:
                st.markdown('- ML predicts low urgency (likely non-academic, low attendance)')
            st.markdown('---')
    else:
        st.error('API call failed!') 