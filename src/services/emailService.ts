import type { Order, Customer } from "@/types";

interface EmailResult {
  success: boolean;
  message: string;
}

export const emailService = {
  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order: Order, customer: Customer): Promise<EmailResult> {
    // Generate email content
    const subject = `Order Confirmation #${order.orderNumber} - Satmar Montreal Matzos`;
    const body = generateOrderEmailTemplate(order, customer);
    
    // In a real app, this would call an API route (e.g., /api/send-email)
    // For now, we simulate the sending process
    console.log("---------------------------------------------------");
    console.log(`📧 SENDING EMAIL TO: ${customer.email}`);
    console.log(`SUBJECT: ${subject}`);
    console.log("---------------------------------------------------");
    console.log(body);
    console.log("---------------------------------------------------");

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if customer has email
    if (!customer.email) {
      return { success: false, message: "Customer has no email address" };
    }

    return { success: true, message: `Confirmation email sent to ${customer.email}` };
  },

  /**
   * Send invoice email
   */
  async sendInvoice(order: Order, customer: Customer): Promise<EmailResult> {
    const subject = `Invoice for Order #${order.orderNumber} - Satmar Montreal Matzos`;
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!customer.email) {
      return { success: false, message: "Customer has no email address" };
    }

    return { success: true, message: `Invoice sent to ${customer.email}` };
  }
};

// Helper to generate HTML email template
function generateOrderEmailTemplate(order: Order, customer: Customer): string {
  const itemsList = order.items.map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity} lbs</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.pricePerLb.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.totalPrice.toFixed(2)}</td>
    </tr>`
  ).join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #d97706;">Order Confirmation</h1>
      <p>Dear ${customer.name},</p>
      <p>Thank you for your order! We have received your request for the following items:</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Order Number:</strong> #${order.orderNumber}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: left;">Qty</th>
            <th style="padding: 10px; text-align: left;">Price</th>
            <th style="padding: 10px; text-align: left;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
            <td style="padding: 10px;">$${order.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tax:</td>
            <td style="padding: 10px;">$${order.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; font-size: 1.1em;">Total:</td>
            <td style="padding: 10px; font-weight: bold; font-size: 1.1em;">$${order.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p>If you have any questions, please contact us.</p>
      <p>Sincerely,<br>Satmar Montreal Matzos Team</p>
    </div>
  `;
}