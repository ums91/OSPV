export type EditionType = "Fine Art Print" | "Postcard";

export interface Edition {
  id:string; title:string; type:EditionType; price:number;
  edition:string; size:string; image:string; stock:number;
}

export interface OrderLine { id:string; quantity:number; }

export interface PaymentGateway {
  createOrder(lines:OrderLine[]):Promise<{orderId:string}>;
  openCheckout(orderId:string):Promise<void>;
}

/**
 * Server-side payment boundary.
 * Never expose payment secrets or signature verification in GitHub Pages.
 */
export class SecurePaymentAdapter implements PaymentGateway {
  async createOrder(lines:OrderLine[]){
    const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lines})});
    if(!r.ok) throw new Error("Order creation failed");
    return r.json();
  }
  async openCheckout(orderId:string){console.log("Secure checkout:",orderId)}
}
