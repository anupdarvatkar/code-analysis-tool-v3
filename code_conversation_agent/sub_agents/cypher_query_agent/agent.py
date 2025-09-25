from google.adk.agents.llm_agent import Agent
from . import prompt

from ...tools import get_neo4j_schema, execute_cypher_query

cypher_query_agent = Agent(
    name="cypher_query_agent",
    model="gemini-2.5-pro",
    description="Agent to convert natural language queries into Cypher queries for Neo4j and execute them",
    instruction=prompt.CYHER_QUERY_AGENT_PROMPT,
    tools=[get_neo4j_schema, execute_cypher_query],  # Add any specific tools if needed
)
