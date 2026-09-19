import { renderHook } from '@testing-library/react-hooks';
import { ICartTotal } from 'models';
import React, { ReactNode } from 'react';
import { CartProvider } from '..';
import useCartTotal from '../useCartTotal';

import { mockCartTotal, mockCartProducts } from 'utils/test/mocks';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('[contexts] - cart-context', () => {
  describe('useCartTotal', () => {
    let total: ICartTotal | {};
    const originalUseContext = React.useContext;

    const setupMockUseContext = (initialTotal: ICartTotal | {} = {}) => {
      total = initialTotal;
      const mockSetTotal = jest.fn().mockImplementation((updatedTotal) => {
        total = updatedTotal;
        return total;
      });
      const mockUseContext = jest.fn().mockImplementation(() => ({
        total: initialTotal,
        setTotal: mockSetTotal,
      }));
      React.useContext = mockUseContext;
    };

    const resetMocks = () => {
      React.useContext = originalUseContext;
    };

    describe('updateCartTotal', () => {
      afterEach(() => {
        resetMocks();
      });

      test('should update cart total', () => {
        setupMockUseContext(mockCartTotal);
        const { result } = renderHook(() => useCartTotal(), { wrapper });

        expect(total).toEqual({
          productQuantity: 1,
          installments: 1,
          totalPrice: 10.9,
          discount: 0,
          currencyId: 'USD',
          currencyFormat: '$',
        });

        result.current.updateCartTotal(mockCartProducts);

        expect(total).toEqual({
          productQuantity: 3,
          installments: 12,
          totalPrice: 50.05,
          discount: 0,
          currencyId: 'USD',
          currencyFormat: '$',
        });
      });

      test('should apply a 10% bulk discount once the cart holds 5 or more items', () => {
        setupMockUseContext(mockCartTotal);
        const { result } = renderHook(() => useCartTotal(), { wrapper });

        const bulkProducts = mockCartProducts.map((product) => ({
          ...product,
          quantity: 2,
        }));
        // 3 products x 2 = 6 items, clears the 5-item threshold.
        // Raw total: (10.9 + 13.25 + 25.9) x 2 = 100.1; 10% off = 90.09.
        result.current.updateCartTotal(bulkProducts);

        expect(total).toEqual({
          productQuantity: 6,
          installments: 12,
          totalPrice: 90.09,
          discount: 10.01,
          currencyId: 'USD',
          currencyFormat: '$',
        });
      });

      test('should not apply a discount when the cart holds fewer than 5 items', () => {
        setupMockUseContext(mockCartTotal);
        const { result } = renderHook(() => useCartTotal(), { wrapper });

        const justBelowThreshold = mockCartProducts.map((product, index) => ({
          ...product,
          // 1 + 1 + 2 = 4 items, one short of the 5-item threshold.
          quantity: index === 2 ? 2 : 1,
        }));

        result.current.updateCartTotal(justBelowThreshold);

        expect(total).toEqual({
          productQuantity: 4,
          installments: 12,
          totalPrice: 75.95,
          discount: 0,
          currencyId: 'USD',
          currencyFormat: '$',
        });
      });
    });
  });
});
