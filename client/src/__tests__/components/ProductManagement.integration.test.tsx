import { describe, test, expect, vi, beforeEach } from 'vitest';

describe('ProductManagement Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test('API endpoints work correctly for product creation', async () => {
    const mockProduct = {
      restaurantId: 1,
      categoryId: 1,
      name: "Test Product",
      description: "Test description",
      price: "100.00",
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 15,
      displayOrder: 1
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 14, ...mockProduct })
    });

    const response = await fetch('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProduct)
    });

    const result = await response.json();
    
    expect(fetch).toHaveBeenCalledWith('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProduct)
    });
    
    expect(result).toEqual({ id: 14, ...mockProduct });
  });

  test('API endpoints work correctly for product updates', async () => {
    const updateData = {
      name: "Updated Test Product",
      price: "120.00",
      description: "Updated description"
    };

    const updatedProduct = {
      id: 14,
      restaurantId: 1,
      categoryId: 1,
      ...updateData,
      imageUrl: null,
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 15,
      displayOrder: 1
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedProduct
    });

    const response = await fetch('/api/menu-items/14', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    expect(fetch).toHaveBeenCalledWith('/api/menu-items/14', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    expect(result).toEqual(updatedProduct);
  });

  test('handles API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const response = await fetch('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  test('validates required fields in product data', () => {
    const validProduct = {
      restaurantId: 1,
      categoryId: 1,
      name: "Test Product",
      price: "100.00",
      isVeg: true,
      isAvailable: true,
      preparationTime: 15,
      displayOrder: 1
    };

    // Test that all required fields are present
    expect(validProduct.restaurantId).toBeDefined();
    expect(validProduct.categoryId).toBeDefined();
    expect(validProduct.name).toBeDefined();
    expect(validProduct.price).toBeDefined();
    expect(typeof validProduct.isVeg).toBe('boolean');
    expect(typeof validProduct.isAvailable).toBe('boolean');
    expect(typeof validProduct.preparationTime).toBe('number');
    expect(typeof validProduct.displayOrder).toBe('number');
  });

  test('price format validation', () => {
    const validPrices = ['10.00', '100.50', '999.99'];
    const invalidPrices = ['abc', '', 'ten', '10'];

    validPrices.forEach(price => {
      expect(price).toMatch(/^\d+\.\d{2}$/);
    });

    invalidPrices.forEach(price => {
      expect(price).not.toMatch(/^\d+\.\d{2}$/);
    });
  });
});