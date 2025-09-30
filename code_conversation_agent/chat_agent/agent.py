"""Agent to converse with Neo4j Graph for Code Analysis"""

from google.adk.agents import Agent
from google.adk.tools.agent_tool import AgentTool
import os
from dotenv import load_dotenv

from . import prompt
from .sub_agents.cypher_query_agent.agent import cypher_query_agent
from .sub_agents.diagram_agent.agent import diagram_agent

load_dotenv()
MODEL = os.getenv("MODEL", "gemini-2.5-pro")  # Default if not set

root_agent = Agent(
    name="code_conversation_agent",
    model=MODEL,
    description="Agent to converse with Neo4j Graph for Code Analysis and diagram generation",
    instruction=prompt.ROOT_PROMPT,
    tools=[
        AgentTool(agent=cypher_query_agent),
        AgentTool(agent=diagram_agent),
    ]
)


