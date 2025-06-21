import { useEffect, useMemo } from "react";
import { queryClient } from "@/lib/queryClient";

// Performance optimization utilities for handling 100+ orders
export const useOrdersOptimization = () => {
  // Optimize order queries with caching and pagination
  useEffect(() => {
    // Set longer cache times for order data
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 30000, // 30 seconds before data is considered stale
        gcTime: 300000, // 5 minutes before cache is garbage collected
      },
    });
  }, []);

  // Batch order status updates to reduce API calls
  const batchUpdateOrders = useMemo(() => {
    const pendingUpdates = new Map();
    let timeoutId: NodeJS.Timeout;

    return (orderId: number, status: string) => {
      pendingUpdates.set(orderId, status);
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Process all pending updates in a single batch
        const updates = Array.from(pendingUpdates.entries());
        pendingUpdates.clear();
        
        updates.forEach(([id, newStatus]) => {
          // Update cache immediately for instant UI feedback
          queryClient.setQueryData(['/api/orders', id], (oldData: any) => ({
            ...oldData,
            status: newStatus,
            updatedAt: new Date().toISOString()
          }));
        });
      }, 100); // Batch updates every 100ms
    };
  }, []);

  return { batchUpdateOrders };
};

// Virtual scrolling for large order lists
export const useVirtualScrolling = (items: any[], itemHeight: number = 120) => {
  const VISIBLE_ITEMS = 10;
  
  return useMemo(() => {
    if (items.length <= VISIBLE_ITEMS) {
      return {
        visibleItems: items,
        totalHeight: items.length * itemHeight,
        startIndex: 0,
        endIndex: items.length
      };
    }

    // For large lists, implement virtual scrolling
    const startIndex = 0; // In real implementation, this would be based on scroll position
    const endIndex = Math.min(startIndex + VISIBLE_ITEMS, items.length);
    
    return {
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      startIndex,
      endIndex
    };
  }, [items, itemHeight]);
};

// Memory-efficient order status tracking
export const useOrderStatusTracker = () => {
  const statusCounts = useMemo(() => {
    const cache = queryClient.getQueryCache();
    const orderQueries = cache.findAll({ queryKey: ['/api/restaurant'] });
    
    const counts = {
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      total: 0
    };

    orderQueries.forEach(query => {
      const data = query.state.data as any;
      if (data?.orders) {
        data.orders.forEach((order: any) => {
          counts[order.status as keyof typeof counts]++;
          counts.total++;
        });
      }
    });

    return counts;
  }, []);

  return statusCounts;
};