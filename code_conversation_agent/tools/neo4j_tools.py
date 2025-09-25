import os
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph

load_dotenv()

#Initialize Neo4j Graph Connection
graph = Neo4jGraph(
    url=os.getenv("DB_URI"),
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    enhanced_schema=True,
)

#Get the Schema of the Neo4j DB
def get_neo4j_schema() -> str: 
    schema = graph.schema
    print(f"Graph Schema: {schema}")

    return schema

#Get the Cypher Query Results
def execute_cypher_query(query: str) -> str:
    results = graph.run(query)
    print(f"Query Results: {results}")

    return results



