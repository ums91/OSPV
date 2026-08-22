export interface Edition {
  id: string;
  title: string;
  type: "Postcard" | "Fine Art Print";
  category: string;
  price: number;
  currency: "INR";
  edition: string;
  image: string;
  description: string;
  dimensions: string;
  stock: number;
}

export interface CartLine {
  id: string;
  qty: number;
}

export interface CheckoutAdapter {
  createOrder(lines: CartLine[]): Promise<{ orderId: string }>;
  openPayment(orderId: string): Promise<void>;
}

/**
 * Production integration boundary.
 * A future backend should implement this interface using a payment provider
 * such as Razorpay/Cashfree/another PCI-compliant provider. Never put
 * secret API keys in GitHub Pages client-side code.
 */
export class PaymentGateway implements CheckoutAdapter {
  async createOrder(lines: CartLine[]) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines })
    });
    if (!response.ok) throw new Error("Order creation failed");
    return response.json();
  }

  async openPayment(orderId: string) {
    // Replace with provider SDK / hosted checkout after backend integration.
    console.log("Open secure checkout for order:", orderId);
  }
}
