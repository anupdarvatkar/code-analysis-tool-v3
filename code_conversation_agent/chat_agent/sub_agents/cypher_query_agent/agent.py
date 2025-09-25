from google.adk.agents import LlmAgent
from . import prompt
# In code_conversation_agent/chat_agent/sub_agents/cypher_query_agent/agent.py
from chat_agent.tools.neo4j_tools import get_neo4j_schema, execute_cypher_query

cypher_query_agent = LlmAgent(
    name="cypher_query_agent",
    model="gemini-2.5-pro",
    description="Agent to convert natural language queries into Cypher queries for Neo4j and execute them",
    instruction=prompt.CYHER_QUERY_AGENT_PROMPT,
    tools=[get_neo4j_schema, execute_cypher_query],
)
