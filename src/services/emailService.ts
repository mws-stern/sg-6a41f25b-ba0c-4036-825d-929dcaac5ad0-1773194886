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
    if (!customer.email) {
      return { success: false, message: "Customer has no email address" };
    }

    try {
      const subject = `Order Confirmation #${order.orderNumber} - Satmar Montreal Matzos`;
      const html = generateOrderEmailTemplate(order, customer);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: customer.email,
          subject,
          html,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Email API error:", result);
        return {
          success: false,
          message: result.error || "Failed to send email",
        };
      }

      return {
        success: true,
        message: `Confirmation email sent to ${customer.email}`,
      };
    } catch (error) {
      console.error("Email service error:", error);
      return {
        success: false,
        message: "Failed to send email",
      };
    }
  },

  /**
   * Send invoice email
   */
  async sendInvoice(order: Order, customer: Customer): Promise<EmailResult> {
    if (!customer.email) {
      return { success: false, message: "Customer has no email address" };
    }

    try {
      const subject = `Invoice for Order #${order.orderNumber} - Satmar Montreal Matzos`;
      const html = generateInvoiceEmailTemplate(order, customer);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: customer.email,
          subject,
          html,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Email API error:", result);
        return {
          success: false,
          message: result.error || "Failed to send email",
        };
      }

      return {
        success: true,
        message: `Invoice sent to ${customer.email}`,
      };
    } catch (error) {
      console.error("Email service error:", error);
      return {
        success: false,
        message: "Failed to send email",
      };
    }
  },
};

// Helper to generate HTML email template for order confirmation
function generateOrderEmailTemplate(order: Order, customer: Customer): string {
  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity} lbs</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.pricePerLb.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.finalPrice ?? item.totalPrice).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const discountRow =
    order.discount && order.discount > 0
      ? `<tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Discount:</td>
            <td style="padding: 10px; color: #16a34a;">-$${order.discount.toFixed(2)}</td>
          </tr>`
      : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px;">Order Confirmation</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${customer.name},</p>
            <p style="margin: 0 0 20px 0; font-size: 16px;">Thank you for your order! We have received your request for the following items:</p>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #d97706;">
              <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
              <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p style="margin: 0;"><strong>Status:</strong> <span style="color: #d97706; text-transform: uppercase;">${order.status}</span></p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Qty</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Price/lb</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot style="border-top: 2px solid #d97706;">
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                  <td style="padding: 10px; font-weight: 600;">$${order.subtotal.toFixed(2)}</td>
                </tr>
                ${discountRow}
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tax:</td>
                  <td style="padding: 10px; font-weight: 600;">$${order.tax.toFixed(2)}</td>
                </tr>
                <tr style="background-color: #fef3c7;">
                  <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
                  <td style="padding: 12px; font-weight: bold; font-size: 18px; color: #d97706;">$${order.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            ${
              order.deliveryDate
                ? `<p style="margin: 20px 0; padding: 15px; background-color: #eff6ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
                <strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toLocaleDateString()}
              </p>`
                : ""
            }

            ${
              order.notes
                ? `<div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
                <p style="margin: 0 0 8px 0; font-weight: 600;">Order Notes:</p>
                <p style="margin: 0; color: #6b7280;">${order.notes}</p>
              </div>`
                : ""
            }

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">If you have any questions about your order, please contact us:</p>
              <p style="margin: 0; font-size: 14px;"><strong>Email:</strong> sales@satmarmatzosmtl.ca</p>
            </div>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Thank you for your business!<br>
              <strong>Satmar Montreal Matzos</strong>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper to generate HTML email template for invoice
function generateInvoiceEmailTemplate(order: Order, customer: Customer): string {
  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity} lbs</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.pricePerLb.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.finalPrice ?? item.totalPrice).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const discountRow =
    order.discount && order.discount > 0
      ? `<tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Discount:</td>
            <td style="padding: 10px; color: #16a34a;">-$${order.discount.toFixed(2)}</td>
          </tr>`
      : "";

  const paidAmount = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balance = order.total - paidAmount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px;">Invoice</h1>
          </div>
          
          <div style="padding: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
              <div>
                <p style="margin: 0 0 8px 0;"><strong>Bill To:</strong></p>
                <p style="margin: 0; color: #6b7280;">${customer.name}</p>
                ${customer.email ? `<p style="margin: 0; color: #6b7280;">${customer.email}</p>` : ""}
                ${customer.phone ? `<p style="margin: 0; color: #6b7280;">${customer.phone}</p>` : ""}
              </div>
              <div style="text-align: right;">
                <p style="margin: 0 0 8px 0;"><strong>Invoice #:</strong> ${order.orderNumber}</p>
                <p style="margin: 0 0 8px 0; color: #6b7280;">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                ${order.deliveryDate ? `<p style="margin: 0; color: #6b7280;">Delivery: ${new Date(order.deliveryDate).toLocaleDateString()}</p>` : ""}
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Qty</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Price/lb</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot style="border-top: 2px solid #3b82f6;">
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                  <td style="padding: 10px; font-weight: 600;">$${order.subtotal.toFixed(2)}</td>
                </tr>
                ${discountRow}
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tax:</td>
                  <td style="padding: 10px; font-weight: 600;">$${order.tax.toFixed(2)}</td>
                </tr>
                <tr style="background-color: #dbeafe;">
                  <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total Due:</td>
                  <td style="padding: 12px; font-weight: bold; font-size: 18px; color: #1e40af;">$${order.total.toFixed(2)}</td>
                </tr>
                ${
                  paidAmount > 0
                    ? `<tr>
                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Amount Paid:</td>
                    <td style="padding: 10px; font-weight: 600; color: #16a34a;">$${paidAmount.toFixed(2)}</td>
                  </tr>
                  <tr style="background-color: ${balance > 0 ? "#fee2e2" : "#dcfce7"};">
                    <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 16px;">Balance Due:</td>
                    <td style="padding: 12px; font-weight: bold; font-size: 16px; color: ${balance > 0 ? "#dc2626" : "#16a34a"};">$${balance.toFixed(2)}</td>
                  </tr>`
                    : ""
                }
              </tfoot>
            </table>

            ${
              order.notes
                ? `<div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
                <p style="margin: 0 0 8px 0; font-weight: 600;">Notes:</p>
                <p style="margin: 0; color: #6b7280;">${order.notes}</p>
              </div>`
                : ""
            }

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Payment inquiries:</p>
              <p style="margin: 0; font-size: 14px;"><strong>Email:</strong> sales@satmarmatzosmtl.ca</p>
            </div>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Satmar Montreal Matzos</strong><br>
              Thank you for your business!
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}