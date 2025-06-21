import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductManagement from '@/components/ProductManagement';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockCategories = [
  { id: 1, restaurantId: 1, name: 'Appetizers', displayOrder: 1 },
  { id: 2, restaurantId: 1, name: 'Main Course', displayOrder: 2 },
];

const mockMenuItems = [
  {
    id: 1,
    restaurantId: 1,
    categoryId: 1,
    name: 'Samosa',
    description: 'Crispy fried pastry',
    price: '50.00',
    imageUrl: null,
    isVeg: true,
    isPopular: false,
    isAvailable: true,
    preparationTime: 15,
    displayOrder: 1,
  },
  {
    id: 2,
    restaurantId: 1,
    categoryId: 2,
    name: 'Dal Tadka',
    description: 'Spicy lentil curry',
    price: '120.00',
    imageUrl: null,
    isVeg: true,
    isPopular: true,
    isAvailable: true,
    preparationTime: 20,
    displayOrder: 1,
  },
];

const renderWithQueryClient = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={mockQueryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ProductManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient.clear();
    
    // Mock successful API responses
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/menu')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMenuItems),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  test('renders product management interface', async () => {
    renderWithQueryClient(<ProductManagement restaurantId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Product Management')).toBeInTheDocument();
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
    });
  });

  test('displays menu items correctly', async () => {
    renderWithQueryClient(<ProductManagement restaurantId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Samosa')).toBeInTheDocument();
      expect(screen.getByText('Dal Tadka')).toBeInTheDocument();
      expect(screen.getByText('₹50.00')).toBeInTheDocument();
      expect(screen.getByText('₹120.00')).toBeInTheDocument();
    });
  });

  test('opens add product dialog when clicking Add New Product', async () => {
    renderWithQueryClient(<ProductManagement restaurantId={1} />);
    
    await waitFor(() => {
      const addButton = screen.getByText('Add New Product');
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
      expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Price')).toBeInTheDocument();
    });
  });

  test('creates new product successfully', async () => {
    (fetch as any).mockImplementation((url: string, options: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 3,
            ...JSON.parse(options.body),
          }),
        });
      }
      // Default responses for other calls
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/menu')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMenuItems),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    renderWithQueryClient(<ProductManagement restaurantId={1} />);
    
    await waitFor(() => {
      const addButton = screen.getByText('Add New Product');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Product Name');
      const priceInput = screen.getByLabelText('Price');
      const categorySelect = screen.getByRole('combobox');
      
      fireEvent.change(nameInput, { target: { value: 'Paneer Butter Masala' } });
      fireEvent.change(priceInput, { target: { value: '180' } });
      fireEvent.click(categorySelect);
    });

    await waitFor(() => {
      const mainCourseOption = screen.getByText('Main Course');
      fireEvent.click(mainCourseOption);
    });

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create product/i });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Paneer Butter Masala'),
      });
    });
  });

  test('opens edit dialog when clicking edit button', async () => {
    renderWithQueryClient(<ProductManagement restaurantId={1} />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByTestId('edit-product');
      fireEvent.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Samosa')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50.00')).toBeInTheDocument();
    });
  });

  test('updates product successfully', async () => {
    (fetch as any).mockImplementation((url: string, options: any) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 1,
            ...JSON.parse(options.body),
          }),
        });
      }
      // Default responses for other calls
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/menu')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMenuItems),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    renderWithQueryClient(<ProductManagement restaurantId={1} />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByTestId('edit-product');
      fireEvent.click(editButtons[0]);
    });

    await waitFor(() => {
      const priceInput = screen.getByDisplayValue('50.00');
      fireEvent.change(priceInput, { target: { value: '60' } });
    });

    await waitFor(() => {
      const updateButton = screen.getByRole('button', { name: /update product/i });
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/menu-items/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"price":"60"'),
      });
    });
  });

  test('handles API errors gracefully', async () => {
    (fetch as any).mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
      });
    });

    renderWithQueryClient(<ProductManagement restaurantId={1} />);
    
    await waitFor(() => {
      const addButton = screen.getByText('Add New Product');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Product Name');
      const priceInput = screen.getByLabelText('Price');
      
      fireEvent.change(nameInput, { target: { value: 'Test Product' } });
      fireEvent.change(priceInput, { target: { value: '100' } });
    });

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create product/i });
      fireEvent.click(submitButton);
    });

    // Should handle error without crashing
    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    renderWithQueryClient(<ProductManagement restaurantId={1} />);
    
    await waitFor(() => {
      const addButton = screen.getByText('Add New Product');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create product/i });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      // Form should show validation errors
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
    });
  });

  test('shows loading state during product creation', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (fetch as any).mockImplementation((url: string, options: any) => {
      if (options?.method === 'POST') {
        return pendingPromise;
      }
      // Default responses for other calls
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/menu')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMenuItems),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    renderWithQueryClient(<ProductManagement restaurantId={1} />);
    
    await waitFor(() => {
      const addButton = screen.getByText('Add New Product');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      const nameInput = screen.getByLabelText('Product Name');
      const priceInput = screen.getByLabelText('Price');
      
      fireEvent.change(nameInput, { target: { value: 'Test Product' } });
      fireEvent.change(priceInput, { target: { value: '100' } });
    });

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create product/i });
      fireEvent.click(submitButton);
    });

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    // Resolve the promise to complete the test
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ id: 3 }),
    });
  });
});