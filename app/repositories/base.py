"""
Base repository pattern

Provides generic CRUD operations for all repositories.
"""
from typing import Generic, TypeVar, Type, List, Optional, Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import DatabaseError, ResourceNotFoundError

# Type variable for model
ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """
    Base repository with common CRUD operations
    
    Uses Generic type to provide type hints for derived repositories.
    """
    
    def __init__(self, model: Type[ModelType], db: Session):
        """
        Initialize repository
        
        Args:
            model: SQLAlchemy model class
            db: Database session
        """
        self.model = model
        self.db = db
    
    def get(self, id: Any) -> Optional[ModelType]:
        """
        Get single record by ID
        
        Args:
            id: Primary key value
            
        Returns:
            Model instance or None if not found
        """
        try:
            return self.db.query(self.model).filter(self.model.id == id).first()
        except SQLAlchemyError as e:
            raise DatabaseError(f"Failed to get {self.model.__name__}: {str(e)}")
    
    def get_or_404(self, id: Any) -> ModelType:
        """
        Get single record by ID or raise exception
        
        Args:
            id: Primary key value
            
        Returns:
            Model instance
            
        Raises:
            ResourceNotFoundError: If not found
        """
        obj = self.get(id)
        if obj is None:
            raise ResourceNotFoundError(f"{self.model.__name__} with id {id} not found")
        return obj
    
    def list(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filters: Dict[str, Any] = None
    ) -> List[ModelType]:
        """
        List records with pagination
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Optional filter conditions
            
        Returns:
            List of model instances
        """
        try:
            query = self.db.query(self.model)
            
            # Apply filters if provided
            if filters:
                for key, value in filters.items():
                    if hasattr(self.model, key):
                        query = query.filter(getattr(self.model, key) == value)
            
            return query.offset(skip).limit(limit).all()
        except SQLAlchemyError as e:
            raise DatabaseError(f"Failed to list {self.model.__name__}: {str(e)}")
    
    def create(self, **kwargs) -> ModelType:
        """
        Create new record
        
        Args:
            **kwargs: Model fields
            
        Returns:
            Created model instance
        """
        try:
            obj = self.model(**kwargs)
            self.db.add(obj)
            self.db.commit()
            self.db.refresh(obj)
            return obj
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Failed to create {self.model.__name__}: {str(e)}")
    
    def update(self, id: Any, **kwargs) -> ModelType:
        """
        Update record
        
        Args:
            id: Primary key value
            **kwargs: Fields to update
            
        Returns:
            Updated model instance
        """
        try:
            obj = self.get_or_404(id)
            for key, value in kwargs.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)
            self.db.commit()
            self.db.refresh(obj)
            return obj
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Failed to update {self.model.__name__}: {str(e)}")
    
    def delete(self, id: Any) -> bool:
        """
        Delete record
        
        Args:
            id: Primary key value
            
        Returns:
            True if deleted, False if not found
        """
        try:
            obj = self.get(id)
            if obj:
                self.db.delete(obj)
                self.db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Failed to delete {self.model.__name__}: {str(e)}")
    
    def count(self, filters: Dict[str, Any] = None) -> int:
        """
        Count records
        
        Args:
            filters: Optional filter conditions
            
        Returns:
            Number of records
        """
        try:
            query = self.db.query(self.model)
            
            if filters:
                for key, value in filters.items():
                    if hasattr(self.model, key):
                        query = query.filter(getattr(self.model, key) == value)
            
            return query.count()
        except SQLAlchemyError as e:
            raise DatabaseError(f"Failed to count {self.model.__name__}: {str(e)}")
