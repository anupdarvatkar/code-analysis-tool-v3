import os
import json
from typing import Dict, Any, Optional

# LangChain imports for Google Generative AI
# Switched from langchain_google_vertexai to langchain_google_genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.exceptions import OutputParserException # A common exception to catch

"""
    A class to interface with the ChatVertexAI LLM model for processing raw data
    into natural language descriptions.
"""
class GenAIProcessor:
    
    def __init__(self, model_name: str = "gemini-2.5-flash", **kwargs: Any):
        """
        Initializes the LLM model instance (ChatGoogleGenerativeAI).

        Parameters:
            model_name (str): The name of the Gemini model to use (default: gemini-2.5-flash).
            **kwargs: Additional parameters passed to the ChatGoogleGenerativeAI constructor
                      (e.g., temperature, max_output_tokens).
        """
        print(f"Initializing ChatGoogleGenerativeAI with model: {model_name}...")
        try:
            # NOTE: This relies on the GEMINI_API_KEY environment variable being set.
            self.llm = ChatGoogleGenerativeAI(model=model_name, **kwargs)
            print("Model initialized successfully.")
        except Exception as e:
            # Handle potential initialization errors (e.g., missing API key)
            print(f"Error during LLM initialization: {e}")
            self.llm = None
            raise RuntimeError("Failed to initialize ChatGoogleGenerativeAI. Check your GEMINI_API_KEY environment variable and model name.")
        

    def get_class_description(
        self,
        class_name: str,
        neo4j_description: str,
        language: str = "english"
    ) -> str:
        """
        Processes raw Neo4j output describing a class and generates a natural
        language description using the LLM.

        Parameters:
            class_name (str): The name of the class (e.g., 'Movie', 'Person').
            neo4j_description (str): The raw output from a Neo4j query
                                     (e.g., properties, relationships).
            language (str): The target language for the output (default: 'english').

        Returns:
            str: The generated class description or a default error message.
        """
        if not self.llm:
            return "Error: LLM was not initialized correctly."

        # Define the System Instruction (Persona)
        system_prompt = (
            "You are an expert documentation assistant. Your task is to analyze the "
            "provided raw database output describing a class/node structure and rewrite "
            "it into a clear, concise, and natural language description suitable for "
            f"business analyst in {language}."
            "Focus on the functional description, business rules, and avoid technical jargon."
        )

        # Define the User Query
        user_query = (
            f"Class Name: {class_name}\n\n"
            f"Raw Database Data:\n---\n{neo4j_description}\n---\n\n"
            f"Based on the data above, generate the final, detailed description in {language}."
        )

        # Construct the messages list
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_query),
        ]

        print(f"\n--- Invoking LLM for '{class_name}' description in {language} ---")

        try:
            # Invoke the LLM
            response = self.llm.invoke(messages)
            print("LLM call successful.")
            print (f"LLM raw response: {response}")
            print(f"LLM response text: {response.content}")

            # Return the text content
            return response.content

        except (Exception, OutputParserException) as e:
            # Handle common LLM invocation errors (API issues, timeouts, etc.)
            error_message = (
                f"An error occurred during LLM generation for class '{class_name}': {type(e).__name__}. "
                "Returning a default description. "
                "Default: This is a placeholder description for the class "
                f"'{class_name}' due to a processing error. The raw data provided "
                "was:\n"
                f"{neo4j_description}"
            )
            print(error_message)
            return error_message
