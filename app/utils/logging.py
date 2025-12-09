"""
Structured Logging Utilities

Provides consistent, structured logging across the application
with contextual information and performance tracking.
"""
import logging
import time
import functools
from typing import Any, Dict, Optional, Callable
from datetime import datetime, UTC
import json


class StructuredLogger:
    """
    Structured logger with context and performance tracking
    
    Logs are output in JSON format for easy parsing and analysis.
    """
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.context: Dict[str, Any] = {}
    
    def set_context(self, **kwargs):
        """Set context that will be included in all log messages"""
        self.context.update(kwargs)
    
    def clear_context(self):
        """Clear current context"""
        self.context = {}
    
    def _format_message(self, level: str, message: str, **extra) -> Dict[str, Any]:
        """Format log message as structured JSON"""
        log_data = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": level,
            "message": message,
            "logger": self.logger.name,
            **self.context,
            **extra
        }
        return log_data
    
    def debug(self, message: str, **extra):
        """Log debug message"""
        log_data = self._format_message("DEBUG", message, **extra)
        self.logger.debug(json.dumps(log_data, ensure_ascii=False))
    
    def info(self, message: str, **extra):
        """Log info message"""
        log_data = self._format_message("INFO", message, **extra)
        self.logger.info(json.dumps(log_data, ensure_ascii=False))
    
    def warning(self, message: str, **extra):
        """Log warning message"""
        log_data = self._format_message("WARNING", message, **extra)
        self.logger.warning(json.dumps(log_data, ensure_ascii=False))
    
    def error(self, message: str, **extra):
        """Log error message"""
        log_data = self._format_message("ERROR", message, **extra)
        self.logger.error(json.dumps(log_data, ensure_ascii=False))
    
    def critical(self, message: str, **extra):
        """Log critical message"""
        log_data = self._format_message("CRITICAL", message, **extra)
        self.logger.critical(json.dumps(log_data, ensure_ascii=False))


def log_execution_time(logger: Optional[StructuredLogger] = None):
    """
    Decorator to log function execution time
    
    Usage:
        @log_execution_time(logger)
        def my_function():
            ...
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start
                
                if logger:
                    logger.info(
                        f"Function {func.__name__} completed",
                        duration_ms=round(duration * 1000, 2),
                        function=func.__name__
                    )
                
                return result
            except Exception as e:
                duration = time.time() - start
                
                if logger:
                    logger.error(
                        f"Function {func.__name__} failed",
                        duration_ms=round(duration * 1000, 2),
                        function=func.__name__,
                        error=str(e)
                    )
                
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start
                
                if logger:
                    logger.info(
                        f"Function {func.__name__} completed",
                        duration_ms=round(duration * 1000, 2),
                        function=func.__name__
                    )
                
                return result
            except Exception as e:
                duration = time.time() - start
                
                if logger:
                    logger.error(
                        f"Function {func.__name__} failed",
                        duration_ms=round(duration * 1000, 2),
                        function=func.__name__,
                        error=str(e)
                    )
                
                raise
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


# Global logger instances
def get_logger(name: str) -> StructuredLogger:
    """Get or create a structured logger"""
    return StructuredLogger(name)


# Example usage
if __name__ == "__main__":
    # Configure basic logging
    logging.basicConfig(level=logging.INFO)
    
    # Create logger
    logger = get_logger("test")
    
    # Log with context
    logger.set_context(user_id="123", request_id="abc")
    logger.info("User action", action="login", success=True)
    
    # Use decorator
    @log_execution_time(logger)
    def slow_function():
        time.sleep(0.1)
        return "done"
    
    slow_function()
