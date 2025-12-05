"""Pagination models and utilities"""
from pydantic import BaseModel, Field
from typing import Generic, TypeVar, List, Optional
from math import ceil

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination parameters for requests"""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=50, ge=1, le=100, description="Items per page")
    
    @property
    def offset(self) -> int:
        """Calculate offset for database query"""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """Get limit for database query"""
        return self.page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""
    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    page_size: int = Field(description="Items per page")
    total_pages: int = Field(description="Total number of pages")
    data: List[T] = Field(description="Page data")
    
    @classmethod
    def create(
        cls,
        data: List[T],
        total: int,
        page: int,
        page_size: int
    ) -> "PaginatedResponse[T]":
        """
        Create paginated response
        
        Args:
            data: List of items for current page
            total: Total number of items
            page: Current page number
            page_size: Items per page
            
        Returns:
            PaginatedResponse with calculated metadata
        """
        return cls(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if page_size > 0 else 0,
            data=data
        )


def paginate_query(query, pagination: PaginationParams):
    """
    Apply pagination to SQLAlchemy query
    
    Args:
        query: SQLAlchemy query object
        pagination: Pagination parameters
        
    Returns:
        Tuple of (items, total_count)
    """
    total = query.count()
    items = query.offset(pagination.offset).limit(pagination.limit).all()
    return items, total
