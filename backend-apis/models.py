from pydantic import BaseModel

class ClassDependency(BaseModel):
    """Model for a class, its package, and the number of dependencies it has."""
    package_name: str
    class_name: str
    dependency_count: int

class PackageClassCount(BaseModel):
    """Model for a package and the total number of classes within it."""
    package_name: str
    class_count: int

class LabelCount(BaseModel):
    """Model for a label and the total number of nodes with that label."""
    label: str
    count: int