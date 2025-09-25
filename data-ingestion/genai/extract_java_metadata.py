from google import genai
from model.CodeMetadata import CodeMetadata

import os
from dotenv import load_dotenv

load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv('GOOGLE_API_KEY')

client = genai.Client()

system_instructions = """
    You are a highly skilled Java code analysis and data extraction assistant. Your task is to analyze the provided Java code snippet and extract specific metadata. 
    The output must be a JSON object that strictly conforms to the given Pydantic class schema.
    **Instructions:**
    1.  **Strictly** adhere to the provided Pydantic class schema.
    2.  Extract the value for each field in the schema from the Java code.
    3.  Do not include any additional information, explanations, or text outside of the JSON object.
    4.  If a field's value is not found in the code, use a default or `null` value as specified by the schema.
"""



def extract_java_metadata(java_file_content: str):
    
    inputs = f"Java File: {java_file_content}" 

    response = client.models.generate_content(
        #model="gemini-2.5-flash",
        model="gemini-2.5-pro",
        contents=inputs,

        config = {
            "response_mime_type": "application/json",
            "response_schema": CodeMetadata,
            "system_instruction": system_instructions 
        }
    )

    print(f"Extracted data: \n {response.text}")

    return response.parsed