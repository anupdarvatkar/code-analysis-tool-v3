from google.adk.agents import LlmAgent
from . import prompt

from chat_agent.tools.neo4j_tools import get_neo4j_schema, execute_cypher_query, get_internal_dependencies
from chat_agent.sub_agents.cypher_query_agent.agent import cypher_query_agent
from chat_agent.tools.diagram_tools import convert_mermaid_to_bytes

#MODEL = "gemini-2.5-pro"
MODEL = "gemini-2.5-flash"
AGENT_NAME = "diagram_agent"

diagram_agent = LlmAgent(
    model=MODEL,
    name=AGENT_NAME,
    description="Agent to convert natural language queries into Code diagrams e.g., Class Diagrams",
    instruction=prompt.DIAGRAM_AGENT_PROMPT,
    tools=[get_neo4j_schema, execute_cypher_query, get_internal_dependencies, convert_mermaid_to_bytes],
    sub_agents=[cypher_query_agent],
)
