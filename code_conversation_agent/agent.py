"""Agent to converse with Neo4j Graph for Code Analysis"""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

from . import prompt
from .sub_agents import cypher_query_agent


MODEL = "gemini-2.5-pro"

code_conversation_agent = LlmAgent(
    name="code_conversation_agent",
    model=MODEL,
    description="Agent to converse with Neo4j Graph for Code Analysis and diagram generation",
    instruction=prompt.ROOT_PROMPT,
    tools=[
        AgentTool(agent=cypher_query_agent),
    ]
)

root_agent = code_conversation_agent
