import os
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph

load_dotenv()

_graph = None

def _get_graph() -> Neo4jGraph:
    global _graph
    if _graph is None:
        _graph = Neo4jGraph(
            url=os.getenv("DB_URI"),
            username=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            enhanced_schema=True,
        )
    return _graph

#Get the Schema of the Neo4j DB
def get_neo4j_schema() -> str: 
    graph = _get_graph()
    schema = graph.schema
    print(f"Graph Schema: {schema}")

    return schema

#Get the Cypher Query Results
def execute_cypher_query(query: str) -> str:
    graph = _get_graph()
    results = graph.run(query)
    print(f"Query Results: {results}")

    return results



