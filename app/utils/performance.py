"""
Performance Monitoring Utilities

Track and report application performance metrics.
"""
import time
import asyncio
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta, UTC
from collections import defaultdict
import statistics

from app.utils.logging import get_logger

logger = get_logger("performance")


@dataclass
class PerformanceMetric:
    """Single performance measurement"""
    name: str
    duration_ms: float
    timestamp: datetime
    tags: Dict[str, str] = field(default_factory=dict)


class PerformanceMonitor:
    """
    Monitor and track performance metrics
    
    Features:
    - Track endpoint performance
    - Calculate aggregated statistics
    - Detect performance degradation
    - Alert on slow requests
    """
    
    def __init__(self, alert_threshold_ms: float = 1000):
        self.metrics: List[PerformanceMetric] = []
        self.alert_threshold_ms = alert_threshold_ms
        self._lock = asyncio.Lock()
    
    async def record(
        self,
        name: str,
        duration_ms: float,
        tags: Optional[Dict[str, str]] = None
    ):
        """Record a performance metric"""
        metric = PerformanceMetric(
            name=name,
            duration_ms=duration_ms,
            timestamp=datetime.now(UTC),
            tags=tags or {}
        )
        
        async with self._lock:
            self.metrics.append(metric)
            
            # Alert if slow
            if duration_ms > self.alert_threshold_ms:
                logger.warning(
                    f"Slow operation detected: {name}",
                    duration_ms=duration_ms,
                    threshold_ms=self.alert_threshold_ms,
                    **tags or {}
                )
    
    async def get_stats(
        self,
        name: Optional[str] = None,
        since: Optional[datetime] = None
    ) -> Dict[str, any]:
        """
        Get performance statistics
        
        Args:
            name: Filter by metric name
            since: Only include metrics since this time
            
        Returns:
            Statistics dictionary
        """
        async with self._lock:
            # Filter metrics
            filtered = self.metrics
            
            if name:
                filtered = [m for m in filtered if m.name == name]
            
            if since:
                filtered = [m for m in filtered if m.timestamp >= since]
            
            if not filtered:
                return {
                    "count": 0,
                    "name": name
                }
            
            # Calculate stats
            durations = [m.duration_ms for m in filtered]
            
            return {
                "count": len(filtered),
                "name": name,
                "min_ms": min(durations),
                "max_ms": max(durations),
                "mean_ms": statistics.mean(durations),
                "median_ms": statistics.median(durations),
                "p95_ms": self._percentile(durations, 95),
                "p99_ms": self._percentile(durations, 99),
            }
    
    async def get_aggregated_stats(
        self,
        since: Optional[datetime] = None
    ) -> Dict[str, Dict]:
        """Get stats aggregated by metric name"""
        async with self._lock:
            # Filter by time
            filtered = self.metrics
            if since:
                filtered = [m for m in filtered if m.timestamp >= since]
            
            # Group by name
            by_name = defaultdict(list)
            for metric in filtered:
                by_name[metric.name].append(metric.duration_ms)
            
            # Calculate stats for each
            stats = {}
            for name, durations in by_name.items():
                stats[name] = {
                    "count": len(durations),
                    "min_ms": min(durations),
                    "max_ms": max(durations),
                    "mean_ms": statistics.mean(durations),
                    "median_ms": statistics.median(durations),
                    "p95_ms": self._percentile(durations, 95),
                    "p99_ms": self._percentile(durations, 99),
                }
            
            return stats
    
    async def cleanup_old_metrics(self, older_than_hours: int = 24):
        """Remove old metrics to prevent memory issues"""
        cutoff = datetime.now(UTC) - timedelta(hours=older_than_hours)
        
        async with self._lock:
            before_count = len(self.metrics)
            self.metrics = [m for m in self.metrics if m.timestamp >= cutoff]
            after_count = len(self.metrics)
            
            if before_count > after_count:
                logger.info(
                    f"Cleaned up {before_count - after_count} old metrics",
                    retained=after_count
                )
    
    @staticmethod
    def _percentile(data: List[float], percentile: float) -> float:
        """Calculate percentile"""
        if not data:
            return 0.0
        
        sorted_data = sorted(data)
        index = int((percentile / 100.0) * len(sorted_data))
        index = min(index, len(sorted_data) - 1)
        
        return sorted_data[index]


# Global performance monitor
_performance_monitor: Optional[PerformanceMonitor] = None


def get_performance_monitor() -> PerformanceMonitor:
    """Get global performance monitor instance"""
    global _performance_monitor
    
    if _performance_monitor is None:
        _performance_monitor = PerformanceMonitor(alert_threshold_ms=1000)
    
    return _performance_monitor


class PerformanceTracker:
    """
    Context manager for tracking performance
    
    Usage:
        async with PerformanceTracker("operation_name"):
            # do work
            pass
    """
    
    def __init__(self, name: str, tags: Optional[Dict[str, str]] = None):
        self.name = name
        self.tags = tags or {}
        self.start_time: Optional[float] = None
        self.monitor = get_performance_monitor()
    
    async def __aenter__(self):
        """Start tracking"""
        self.start_time = time.time()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Stop tracking and record"""
        if self.start_time is not None:
            duration_ms = (time.time() - self.start_time) * 1000
            await self.monitor.record(self.name, duration_ms, self.tags)
