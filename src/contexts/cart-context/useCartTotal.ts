import { useCartContext } from './CartContextProvider';
import { ICartProduct } from 'models';

// Bulk discount: 10% off the whole cart once 5 or more items are in it.
const BULK_DISCOUNT_MIN_QUANTITY = 5;
const BULK_DISCOUNT_RATE = 0.1;

// Avoids floating-point artifacts (e.g. 90.08999999999999) in currency math.
const roundToCents = (amount: number): number => Math.round(amount * 100) / 100;

const useCartTotal = () => {
  const { total, setTotal } = useCartContext();

  const updateCartTotal = (products: ICartProduct[]) => {
    const productQuantity = products.reduce(
      (sum: number, product: ICartProduct) => {
        sum += product.quantity;
        return sum;
      },
      0
    );

    const rawTotalPrice = products.reduce(
      (sum: number, product: ICartProduct) => {
        sum += product.price * product.quantity;
        return sum;
      },
      0
    );

    const discount = roundToCents(
      productQuantity >= BULK_DISCOUNT_MIN_QUANTITY
        ? rawTotalPrice * BULK_DISCOUNT_RATE
        : 0
    );

    const totalPrice = roundToCents(rawTotalPrice - discount);

    const installments = products.reduce(
      (greater: number, product: ICartProduct) => {
        greater =
          product.installments > greater ? product.installments : greater;
        return greater;
      },
      0
    );

    const total = {
      productQuantity,
      installments,
      totalPrice,
      discount,
      currencyId: 'USD',
      currencyFormat: '$',
    };

    setTotal(total);
  };

  return {
    total,
    updateCartTotal,
  };
};

export default useCartTotal;
