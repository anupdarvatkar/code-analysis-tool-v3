from neo4j import GraphDatabase, Driver
from typing import List, Dict, Any
from neo4j.exceptions import ServiceUnavailable
from fastapi import HTTPException
from models import ClassDependency, PackageClassCount, LabelCount

class Neo4jController:
    """Handles the connection and session management for Neo4j queries."""
    def __init__(self, uri, user, password):
        """Initializes the Neo4j driver."""
        if GraphDatabase is None:
            raise RuntimeError("Neo4j library is not available. Please install 'neo4j'.")
            
        self.driver: Driver = GraphDatabase.driver(uri, auth=(user, password))
        print("Neo4j Driver initialized.")

    def close(self):
        """Closes the driver connection."""
        self.driver.close()
        print("Neo4j Driver closed.")

    def _run_query(self, query: str, parameters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Executes a Cypher query within a session and returns the results as a list of dictionaries.
        """
        results = []
        try:
            with self.driver.session() as session:
                records = session.run(query, parameters or {})
                for record in records:
                    results.append(dict(record))
            return results
        except ServiceUnavailable as e:
            print(f"Neo4j Service Unavailable: {e}")
            raise HTTPException(status_code=503, detail="Could not connect to Neo4j database.")
        except Exception as e:
            print(f"An error occurred during query execution: {e}")
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

    def get_classes_with_dependencies(self) -> List[ClassDependency]:
        """
        API 1 core logic: Returns table of Package Name, Class Name and Dependency Count.
        """
        cypher_query = """
        MATCH (p:Package)-[]-(c:Class)-[r:HAS_INTERNAL_DEPENDENCY_ON]->(other:Class) 
        RETURN p.name as package_name, c.name AS class_name, count(r) AS dependency_count 
        ORDER BY dependency_count DESC LIMIT 20
        """
        data = self._run_query(cypher_query)
        return [ClassDependency(**item) for item in data]

    def get_number_of_classes_per_package(self) -> List[PackageClassCount]:
        """
        API 2 core logic: Returns list of packages and the count of classes in them.
        """
        cypher_query = """
        MATCH (c:Class)-[:BELONGS_TO_PACKAGE]->(p:Package) 
        RETURN p.name AS package_name, count(c) AS class_count 
        ORDER BY class_count DESC
        """
        data = self._run_query(cypher_query)
        return [PackageClassCount(**item) for item in data]
    

    def get_size_by_type(self) -> List[LabelCount]:
        """
        API 3 core logic: Returns list of node labels and their counts.
        """
        cypher_query = """
            MATCH (n) 
            RETURN labels(n)[0] AS label, COUNT(n) AS count
        """
        data = self._run_query(cypher_query)
        return [LabelCount(**item) for item in data]
    
    def get_total_classes(self) -> int:
        """
        Returns the total number of Class nodes in the database.
        """
        cypher_query = "MATCH (c:Class) RETURN count(c) AS total_classes"
        data = self._run_query(cypher_query)
        return data[0]['total_classes'] if data else 0