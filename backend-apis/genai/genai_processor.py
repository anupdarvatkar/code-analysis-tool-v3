import os
import json
from typing import Dict, Any, Optional
from functools import lru_cache

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
    
    def __init__(self, model_name: Optional[str] = None, **kwargs: Any):
        """
        Initializes the LLM model instance (ChatGoogleGenerativeAI).

        Parameters:
            model_name (str): The name of the Gemini model to use.
                              If not provided, reads from environment variable GEMINI_MODEL_NAME,
                              defaults to 'gemini-2.5-flash'.
            **kwargs: Additional parameters passed to the ChatGoogleGenerativeAI constructor.
        """
        # Read model name from environment if not provided
        if model_name is None:
            model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")
        print(f"Initializing ChatGoogleGenerativeAI with model: {model_name}...")
        try:
            self.llm = ChatGoogleGenerativeAI(model=model_name, **kwargs)
            print("Model initialized successfully.")
        except Exception as e:
            print(f"Error during LLM initialization: {e}")
            self.llm = None
            raise RuntimeError("Failed to initialize ChatGoogleGenerativeAI. Check your GEMINI_API_KEY and GEMINI_MODEL_NAME environment variables.")

    @staticmethod
    @lru_cache(maxsize=128)
    def _cached_description(class_name: str, neo4j_description: str, language: str) -> str:
        """
        Internal static method for caching LLM results.
        """
        # This method will be called by get_class_description
        # The actual LLM call should be done in the instance method, so we just return a placeholder here.
        # This is a stub, actual caching logic is in get_class_description.
        return ""

    def get_class_description(
        self,
        class_name: str,
        neo4j_description: str,
        language: str = "english"
    ) -> str:
        """
        Processes raw Neo4j output describing a class and generates a natural
        language description using the LLM, with caching.

        Parameters:
            class_name (str): The name of the class (e.g., 'Movie', 'Person').
            neo4j_description (str): The raw output from a Neo4j query.
            language (str): The target language for the output (default: 'english').

        Returns:
            str: The generated class description or a default error message.
        """
        if not self.llm:
            return "Error: LLM was not initialized correctly."

        # Step 1: Always generate and cache the English description
        english_cache_key = (class_name, "english")
        if not hasattr(self, "_desc_cache"):
            self._desc_cache = {}

        if english_cache_key in self._desc_cache:
            english_content = self._desc_cache[english_cache_key]
            print(f"Returning cached English description for {class_name}")
        else:
            # System prompt for English synthesis
            system_prompt_en = (
               "You are an expert documentation assistant. Your task is to analyze the "
                "provided raw database output describing a class/node structure and rewrite "
                "it into a clear, concise, and natural language description suitable for "
                f"business analyst in English."
                "Focus on the functional description, business rules, and avoid technical jargon."
            )
            user_query_en = (
                f"Class Name: {class_name}\n\n"
                f"Raw Database Data:\n---\n{neo4j_description}\n---\n\n"
                "Based on the data above, generate the final, detailed description in English."
            )
            messages_en = [
                SystemMessage(content=system_prompt_en),
                HumanMessage(content=user_query_en),
            ]
            print(f"\n--- Invoking LLM for '{class_name}' description in English ---")
            try:
                response_en = self.llm.invoke(messages_en)
                print("LLM call successful (English).")
                print(f"LLM raw response: {response_en}")
                print(f"LLM response text: {response_en.content}")
                english_content = response_en.content
                self._desc_cache[english_cache_key] = english_content
            except (Exception, OutputParserException) as e:
                error_message = (
                    f"An error occurred during LLM generation for class '{class_name}' (English): {type(e).__name__}. "
                    "Returning a default description. "
                    "Default: This is a placeholder description for the class "
                    f"'{class_name}' due to a processing error. The raw data provided "
                    "was:\n"
                    f"{neo4j_description}"
                )
                print(error_message)
                print(f"Exception details: {e}")
                return error_message

        # Step 2: If target language is English, return the cached English content
        if language.lower() == "english":
            return english_content

        # Step 2: Translate the English content to the target language using LLM and cache
        translation_cache_key = (class_name, language)
        if translation_cache_key in self._desc_cache:
            print(f"Returning cached translation for {class_name} in {language}")
            return self._desc_cache[translation_cache_key]

        system_prompt_translate = (
            f"You are a professional translator and business analyst. Translate the following business-oriented class description into {language} for a non-technical stakeholder. "
            "Preserve technical names as references unless there is an industry-standard translation. "
            "Translate all explanatory text with high fluency and precision, maintaining a formal and clear register. "
            "Do not add any introductory or concluding commentary. Only return the translated, structured summary."
        )
        user_query_translate = (
            f"Class Name: {class_name}\n\n"
            f"Business Description (English):\n{english_content}\n\n"
            f"Target Language: {language}\n"
        )
        messages_translate = [
            SystemMessage(content=system_prompt_translate),
            HumanMessage(content=user_query_translate),
        ]
        print(f"\n--- Invoking LLM for '{class_name}' translation to {language} ---")
        try:
            response_translate = self.llm.invoke(messages_translate)
            print("LLM call successful (Translation).")
            print(f"LLM raw response: {response_translate}")
            print(f"LLM response text: {response_translate.content}")
            self._desc_cache[translation_cache_key] = response_translate.content
            return response_translate.content
        except (Exception, OutputParserException) as e:
            error_message = (
                f"An error occurred during LLM translation for class '{class_name}' to {language}: {type(e).__name__}. "
                "Returning the English description as fallback. "
                f"English Description:\n{english_content}"
            )
            print(error_message)
            print(f"Exception details: {e}")
            return english_content
