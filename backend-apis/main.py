import os
from dotenv import load_dotenv
import uvicorn
from database.neo4j_controller import Neo4jController
from genai.genai_processor import GenAIProcessor
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from models import ClassDependency, PackageClassCount, LabelCount
from typing import List

load_dotenv()
NEO4J_URI = os.getenv("DB_URI")
NEO4J_USER = os.getenv("DB_USER")
NEO4J_PASSWORD = os.getenv("DB_PASSWORD")

os.environ["GOOGLE_API_KEY"] = os.getenv('GOOGLE_API_KEY')

# Global variable initialization
neo4j_controller = None
genai_processor = None

# Use FastAPI lifespan event instead of deprecated startup/shutdown events
async def lifespan(app):
    global neo4j_controller
    global genai_processor
 
    # Startup logic
    try:
        genai_processor = GenAIProcessor(model_name="gemini-2.5-flash", temperature=0.2)
    except Exception as e:
        print(f"FATAL: GenAIProcessor failed to initialize: {e}")
        raise Exception("Cannot start without LLM connection")  

    try:
        neo4j_controller = Neo4jController(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    except Exception as e:
        print(f"FATAL: Neo4jController failed to initialize: {e}")
        raise Exception("Cannot start without DB connection")
    yield
    # Shutdown logic
    if neo4j_controller:
        neo4j_controller.close()

app = FastAPI(
    title="Modular Neo4j Code Dependency API",
    description="APIs for querying code structure and dependencies from a Neo4j graph.",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000"],  # Or ["*"] for all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check remains in main app
@app.get("/", summary="Health Check")
async def root():
    """Simple health check endpoint."""
    db_status = "Connected" if neo4j_controller else "Failed to connect/initialize"
    return {"message": "Modular Neo4j FastAPI Service is running.", "database_status": db_status}

# A simple dependency function to ensure the controller is initialized before use
def get_neo4j_controller():
    """Provides the globally initialized Neo4j controller instance."""
    if not neo4j_controller:
        # This error is raised if the global initialization failed
        raise HTTPException(status_code=500, detail="Database connection failed to initialize.")
    return neo4j_controller

@app.get(
    "/classes/dependencies",
    response_model=List[ClassDependency],
    summary="Get classes and their dependency counts"
)
async def get_classes_with_dependencies_endpoint():
    """
    Retrieves all classes, their parent package, and a count of how many other 
    classes they directly depend on (outgoing relationships).
    """
    return neo4j_controller.get_classes_with_dependencies()

@app.get(
    "/packages/class-counts",
    response_model=List[PackageClassCount],
    summary="Get the total number of classes per package"
)
async def get_number_of_classes_per_package_endpoint():
    """
    Calculates and returns the total number of classes contained within each package.
    """
    return neo4j_controller.get_number_of_classes_per_package()

@app.get(
    "/nodes/count-of-nodes",
    response_model=List[LabelCount],
    summary="Get the count of nodes by their labels"
)
async def get_size_by_type_endpoint():
    """
    Returns a count of nodes grouped by their primary label.
    """
    return neo4j_controller.get_size_by_type()

@app.get(
    "/nodes/count-of-classes",
    response_model=int,
    summary="Get the total number of Class nodes"
)
async def get_total_classes_endpoint():
    """
    Returns the total number of Class nodes in the database.
    """
    return neo4j_controller.get_total_classes()

@app.get(
    "/classes/functional-specification",
    summary="Get functional specification for a given class"
)
async def get_functional_specification(class_name: str = Query(..., description="Name of the class")):
    """
    Retrieves the functional specification for a given class.
    For now, returns a dummy functional specification.
    """
    # Dummy specification
    #spec = {
    #    "class_name": class_name,
    #   "functional_specification": f"This is a dummy functional specification for the class '{class_name}'."
    #}

    #Get the data from the database
    class_details = neo4j_controller.get_class_details(class_name)

    # Get the data formatted as a string using LLM
    spec = genai_processor.get_class_description(class_name=class_name, neo4j_description=class_details, language="english")
    
    return spec