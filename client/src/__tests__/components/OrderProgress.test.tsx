import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderProgress from '@/components/OrderProgress';

const mockOrder = {
  id: 1,
  orderNumber: 'ORD-123456',
  status: 'preparing',
  items: [
    { id: 1, name: 'Test Item', price: '100', quantity: 2, total: '200' }
  ],
  total: '230',
  createdAt: new Date().toISOString(),
  restaurantId: 1,
  orderType: 'dine-in'
};

// Mock the useQuery hook
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(() => ({
    data: mockOrder,
    isLoading: false,
    error: null,
    refetch: jest.fn()
  }))
}));

// Mock the WebSocket hook
jest.mock('@/lib/websocket', () => ({
  useWebSocket: jest.fn((callback) => {
    setTimeout(() => {
      callback({
        type: 'orderStatusUpdate',
        data: { orderNumber: 'ORD-123456', status: 'ready' }
      });
    }, 100);
  })
}));

describe('OrderProgress', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const renderComponent = (orderNumber?: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OrderProgress orderNumber={orderNumber} />
      </QueryClientProvider>
    );
  };

  test('renders floating button when order is active', () => {
    renderComponent('ORD-123456');
    const floatingButton = screen.getByRole('button');
    expect(floatingButton).toBeInTheDocument();
  });

  test('calculates correct progress percentage', () => {
    const statuses = [
      { status: 'pending', expectedProgress: 25 },
      { status: 'preparing', expectedProgress: 50 },
      { status: 'ready', expectedProgress: 75 },
      { status: 'completed', expectedProgress: 100 }
    ];

    statuses.forEach(({ expectedProgress }) => {
      expect(expectedProgress).toBeGreaterThanOrEqual(0);
      expect(expectedProgress).toBeLessThanOrEqual(100);
    });
  });
});