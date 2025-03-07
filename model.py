from dotenv import load_dotenv
import os
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Get API key securely
api_key = "AIzaSyDl7fawitsUcFmdUpzVbnxAfwVF447pPdA"
if not api_key:
    raise ValueError("API Key not found. Set GEMINI_API_KEY in your .env file.")

# Configure Generative AI
genai.configure(api_key=api_key)

def get_gemini_response(question, prompt):
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content([prompt[0], question])
    return response.text  # Return cleaned text response

# Define the prompt
prompt = ["""
        You are an expert in conversation with a patient for any medical help.
        Example: The patient asks for help diagnosing a disease.
        If they mention symptoms like cold, suggest possible related diseases.
        """]

# Manually enter the question here
question = "nose is bleeding after a hit"

# Generate response
if question.strip():  # Ensures the input is not empty
    response = get_gemini_response(question, prompt)
    print("Response:", response)  # Print the response to the console
