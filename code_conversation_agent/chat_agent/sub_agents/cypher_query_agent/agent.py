from google.adk.agents import LlmAgent
from . import prompt

from chat_agent.tools.neo4j_tools import get_neo4j_schema, execute_cypher_query, get_internal_dependencies


#MODEL = "gemini-2.5-pro"
MODEL = "gemini-2.5-flash"
AGENT_NAME = "cypher_query_agent"

cypher_query_agent = LlmAgent(
    model=MODEL,
    name=AGENT_NAME,
    description="Agent to convert natural language queries into Cypher queries for Neo4j and execute them",
    instruction=prompt.CYHER_QUERY_AGENT_PROMPT,
    tools=[get_neo4j_schema, execute_cypher_query, get_internal_dependencies]
)
