import os
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph
import neo4j
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
    
    try:
        print(f"Executing Cypher Query: {query}")
        graph = _get_graph()    
        results = graph.query(query)
        print(f"Query Results: {results}")
    except Exception as e:
        results = f"Error executing query : {str(e)}"

    return results


#Get the outward facing internal dependencies for a given class name 
def get_internal_dependencies(class_name: str, level: int = 4) -> str:
    try:
        print(f"Getting internal dependencies for node: {class_name}")
        graph = _get_graph()    
        query = f"""        
        MATCH (startNode:Class) WHERE startNode.name = '{class_name}'
        MATCH p = (startNode)-[:HAS_INTERNAL_DEPENDENCY_ON*1..'{level}']->(dependencyNode)
        RETURN 
            startNode, 
            relationships(p) AS relationships,
            dependencyNode, 
            length(p) AS dependency_level
        ORDER BY dependency_level ASC
        """
        results = graph.query(query)
        print(f"Internal Dependencies: {results}")
    except Exception as e:
        results = f"Error executing query : {str(e)}"

    return results
