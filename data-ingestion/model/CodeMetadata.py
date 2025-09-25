from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict, Optional
from enum import Enum

class ParameterMetadata(BaseModel):
    name: str
    type: str

class MethodMetadata(BaseModel):
    name: str
    annotations: List[str]
    parameters: List[ParameterMetadata] = None
    return_type: str
    description: Optional[str] = Field(..., title="Description of the method")
    pseudo_code: Optional[str] = Field(..., title="Pseudo code / Logic of the method. Includes business rules if any")
    throws_exceptions: List[str]
    internal_dependencies: List[str] = Field(..., title="Internal dependencies of the class refered in the method.")
    is_public: bool = Field(default=False, title="Is the method a public method") 
    is_static: bool = Field(default=False, title="Is the method a static method")

class FieldMetadata(BaseModel):
    name: str
    type: str
    annotations: List[str]
    value: Optional[str] = None
    description: Optional[str] = Field(..., title="Description of the field/attribute of the class")
    is_public: bool = Field(default=False, title="Is the field a public field") 
    is_static: bool = Field(default=False, title="Is the field a static field")
    is_primary: bool = Field(default=False, title="Is the field a primary key in case of business object")

class LayerEnum(str, Enum):
    CONTROLLER = 'Controller'
    SERVICE = 'Service'
    REPOSITORY = 'Repository'
    ENTITY = 'Entity'
    DTO = 'Dto'

class CodeMetadata(BaseModel):
    file_name: str
    package: str  = Field(..., title="Package of the class")
    class_name: str  = Field(..., title="Name of the class")
    class_annotations: List[str] = None
    internal_dependencies: List[str] = Field(..., title="Internal dependencies of the class.")
    external_dependencies: List[str] = Field(..., title="External dependencies of the class.")
    interfaces: List[str] = None
    methods: List[MethodMetadata] 
    fields: List[FieldMetadata] 
    functionality_summary: str  = Field(..., title="Brief functional summary of the class")
    architecture_layer: LayerEnum = Field(..., title="Classification of the java class in Architecture Layer")
