import os
import logging
from typing import Any
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph

load_dotenv()

logger = logging.getLogger(__name__)
if not logging.getLogger().handlers:  # only set a basic config if none exists
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")

_graph = None  # cached Neo4jGraph

def _get_graph() -> Neo4jGraph:
    """Lazily create and cache the Neo4jGraph (same behavior as original)."""
    global _graph
    if _graph is None:
        logger.info("_get_graph: initializing Neo4jGraph")
        _graph = Neo4jGraph(
            url=os.getenv("DB_URI"),
            username=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            enhanced_schema=True,
        )
    return _graph

# Get the Schema of the Neo4j DB (logic unchanged, just logging added)
def get_neo4j_schema() -> str:
    logger.info("get_neo4j_schema: start")
    graph = _get_graph()
    schema = graph.schema
    logger.info(
        "get_neo4j_schema: retrieved schema (type=%s, preview=%s)",
        type(schema),
        _preview(schema),
    )
    return schema

# Get the Cypher Query Results (logic unchanged)
def execute_cypher_query(query: str) -> str:
    logger.info("execute_cypher_query: executing query=%s", query)
    try:
        graph = _get_graph()
        results = graph.query(query)
        logger.info(
            "execute_cypher_query: success (type=%s, preview=%s)",
            type(results),
            _preview(results),
        )
    except Exception as e:  # keep same error string format
        logger.exception("execute_cypher_query: error")
        results = f"Error executing query : {str(e)}"
    return results

# Get the outward facing internal dependencies for a given class name (logic unchanged)
def get_internal_dependencies(class_name: str, level: int = 4) -> str:
    logger.info("get_internal_dependencies: class=%s level=%s", class_name, level)
    try:
        graph = _get_graph()
        query = f"""
        MATCH (startNode:Class) WHERE startNode.name = '{class_name}'
        MATCH p = (startNode)-[:HAS_INTERNAL_DEPENDENCY_ON*1..{level}]->(dependencyNode)
        RETURN 
            startNode, 
            relationships(p) AS relationships,
            dependencyNode, 
            length(p) AS dependency_level
        ORDER BY dependency_level ASC
        """
        results = graph.query(query)
        logger.info(
            "get_internal_dependencies: success (type=%s, preview=%s)",
            type(results),
            _preview(results),
        )
    except Exception as e:
        logger.exception("get_internal_dependencies: error")
        results = f"Error executing query : {str(e)}"
    return results


def _preview(obj: Any, limit: int = 120) -> str:
    """Return a safe truncated single-line preview of an object for logging."""
    try:
        text = str(obj).replace("\n", " ")
        if len(text) > limit:
            return text[:limit] + "…"
        return text
    except Exception:
        return "<unrepr>"
