from neo4j import GraphDatabase
import os
from dotenv import load_dotenv
from model.CodeMetadata import CodeMetadata

class Neo4jConnector:

    def __init__(self):
        load_dotenv()
        uri = os.getenv('DB_URI')
        user = os.getenv('DB_USER')
        password = os.getenv('DB_PASSWORD')
        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self._driver.close()

    def _delete_all(self, tx):
        tx.run("""
            MATCH (n) DETACH DELETE n
        """)
        print("All nodes deleted")

    def _create_class_node(self, tx, metadata: CodeMetadata):
        
        #Delete all
        #tx.run("""
        #    MATCH (n) DETACH DELETE n
        #""")

        # Create Class and link to Package
        tx.run("""
            MERGE (c:Class {name: $class_name})
            SET c.file_name = $file_name,
                c.type = $class_type,
                c.functionalitySummary = $summary,
                c.layer = $layer
            WITH c
            MERGE (p1:Package {name: $package_name})
            MERGE (c)-[:BELONGS_TO_PACKAGE]->(p1)
            MERGE (f:File {name: $file_name})
            MERGE (f)-[:DEFINES_CLASS]->(c)
        """,
        class_name=metadata.class_name, file_name=metadata.file_name,
        package_name=metadata.package, class_type="Class",
        summary=metadata.functionality_summary, layer=metadata.architecture_layer
        )

        print("Class Created")

        #Add Class Annotations
        for anno_name in metadata.class_annotations:
            tx.run("""
                MATCH (c:Class {name: $class_name})
                MERGE (a:Annotation {name: $anno_name})
                MERGE (c)-[:HAS_ANNOTATION]->(a)
            """, class_name=metadata.class_name, anno_name=anno_name)

        print("Annotations Added")

        #Add Internal Dependencies
        internal_dependency_classes = []
        for internal_dependency in metadata.internal_dependencies:

            if '.' not in internal_dependency:
                #DONT add package
                internal_dependency_classes.append(internal_dependency)
                tx.run("""
                    MATCH (c1:Class {name: $class_name})
                    MERGE(c2:Class {name: $dep_class_name})
                    MERGE (c1)-[:HAS_INTERNAL_DEPENDENCY_ON]->(c2)
                """, class_name=metadata.class_name, dep_class_name=internal_dependency)
                # MERGE (c1)-[:HAS_DEPENDENCY_ON {type:'INTERNAL'}]->(c2)
            else:
                last_dot_index = internal_dependency.rfind('.')
                dep_package = internal_dependency[:last_dot_index]
                dep_class_name = internal_dependency[last_dot_index + 1:]

                #print(f"------------------\n")
                #print(f"internal_dependency: {internal_dependency}, dep_package: {dep_package}, dep_class_name: {dep_class_name}")

                #Use this to cross check method level dependency
                internal_dependency_classes.append(dep_class_name)

                tx.run("""
                    MATCH (c1:Class {name: $class_name})
                    MERGE(c2:Class {name: $dep_class_name})
                    MERGE (c1)-[:HAS_INTERNAL_DEPENDENCY_ON]->(c2)
                    MERGE (p2: Package {name: $dep_package})
                    MERGE (c2)-[:BELONGS_TO_PACKAGE]->(p2)
                """, class_name=metadata.class_name, dep_class_name=dep_class_name, dep_package=dep_package)

        print("Internal dependencies added")

        #Add External Dependencies
        for external_dependency in metadata.external_dependencies:

            if '.' not in external_dependency:
                tx.run("""
                    MATCH (c1:Class {name: $class_name})
                    MERGE(c2:Class {name: $dep_class_name})
                    MERGE (c1)-[:HAS_EXTERNAL_DEPENDENCY_ON]->(c2)
                """, class_name=metadata.class_name, dep_class_name=external_dependency)
                #MERGE (c1)-[:HAS_DEPENDENCY_ON {type:'EXTERNAL'}]->(c2)

            else:
                last_dot_index = external_dependency.rfind('.')
                dep_package = external_dependency[:last_dot_index]
                dep_class_name = external_dependency[last_dot_index + 1:]

                #print(f"------------------\n")
                #print(f"external_dependency: {external_dependency}, dep_package: {dep_package}, dep_class_name: {dep_class_name}")


                tx.run("""
                    MATCH (c1:Class {name: $class_name})
                    MERGE(c2:Class {name: $dep_class_name})
                    MERGE (c1)-[:HAS_EXTERNAL_DEPENDENCY_ON]->(c2)
                    MERGE (p3: Package {name: $dep_package})
                    MERGE (c2)-[:BELONGS_TO_PACKAGE]->(p3)
            """, class_name=metadata.class_name, dep_class_name=dep_class_name, dep_package=dep_package)

        print("External dependencies added")

        #Add Fields / Attributes
        for field in metadata.fields:
            tx.run("""
                MATCH (c:Class {name: $class_name})
                MERGE (f:Field {name: $field_name, type: $field_type})
                SET f.isPrimaryKey = $is_primary_key, f.isPublic = $is_public, f.isStatic = $is_static
                MERGE (c)-[:HAS_FIELD]->(f)
            """, class_name=metadata.class_name, field_name=field.name,
            field_type=field.type, is_primary_key=field.is_primary, is_public=field.is_public, is_static=field.is_static)
            for anno_name in field.annotations:
                 tx.run("""
                    MATCH (f:Field {name: $field_name, type: $field_type})
                    MERGE (a:Annotation {name: $anno_name})
                    MERGE (f)-[:HAS_ANNOTATION]->(a)
                """, field_name=field.name, field_type=field.type, anno_name=anno_name)        

        print("Fields added")

        #Add Methods, Parameters and Method Annotations
        for method in metadata.methods:
            
            local_pseudo_code = method.pseudo_code
            if local_pseudo_code is None:
                #print(f"Didnt get Pseudo code for {method.name}. Setting Blank")
                local_pseudo_code = "NA"

            local_description = method.description
            if local_description is None:
                local_description = "NA"
            
            tx.run("""
                MATCH (c:Class {name: $class_name})
                MERGE (m:Method {name: $method_name, returnType: $return_type, description: $description, pseudoCode: $pseudo_code})
                MERGE (c)-[:HAS_METHOD]->(m)
            """, class_name=metadata.class_name, method_name=method.name,
            return_type=method.return_type, description=local_description, pseudo_code=local_pseudo_code)

            #Parameters
            for param in method.parameters:
                tx.run("""
                    MATCH (m:Method {name: $method_name})
                    MERGE (pa:Parameter {name: $param_name, type: $param_type})
                    MERGE (m)-[:HAS_PARAMETER]->(pa)
                """, method_name=method.name, param_name=param.name, param_type=param.type)

            #Annotations
            for anno_name in method.annotations:
                tx.run("""
                    MATCH (m:Method {name: $method_name})
                    MERGE (a:Annotation {name: $anno_name})
                    MERGE (m)-[:HAS_ANNOTATION]->(a)
                """, method_name=method.name, anno_name=anno_name)  

            #Exceptions
            for excep_name in method.throws_exceptions:
                tx.run("""
                    MATCH (m:Method {name: $method_name})
                    MERGE (e:Exception {name: $excep_name})
                    MERGE (m)-[:THROWS_EXCEPTION]->(e)
                """, method_name=method.name, excep_name=excep_name)

            #Dependencies      
            for dependency_name in method.internal_dependencies:
                if (dependency_name in internal_dependency_classes):
                    tx.run(""" 
                        MATCH (m:Method {name: $method_name})
                        MERGE(c:Class {name: $class_name})
                        MERGE (m)-[:HAS_DEPENDENCY_ON]->(c)            
                    """, method_name=method.name, class_name=dependency_name)
        
        print("Methods added")

        #Add Interfaces


    def save_code_metadata_collection(self, metadata_collection):

        with self._driver.session() as session:
            session.execute_write(self._delete_all)


        print(f"Saving Metadata to Neo4j DB. Collection Size: {len(metadata_collection)}")
        with self._driver.session() as session:
            for metadata in metadata_collection:
                #self.save_code_metadata(metadata=metadata)
                session.execute_write(self._create_class_node, metadata)
        