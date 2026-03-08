import type { Order, Customer } from "@/types";
import { supabase } from "@/integrations/supabase/client";

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
        
        // Log failed email
        await this.logEmail({
          orderId: order.id,
          customerId: order.customerId,
          customerEmail: customer.email,
          customerName: customer.name,
          emailType: "order_confirmation",
          subject,
          status: "failed",
          errorMessage: result.error || "Failed to send email"
        });
        
        return {
          success: false,
          message: result.error || "Failed to send email",
        };
      }

      // Log successful email
      await this.logEmail({
        orderId: order.id,
        customerId: order.customerId,
        customerEmail: customer.email,
        customerName: customer.name,
        emailType: "order_confirmation",
        subject,
        status: "sent"
      });

      return {
        success: true,
        message: `Confirmation email sent to ${customer.email}`,
      };
    } catch (error) {
      console.error("Email service error:", error);
      
      // Log failed email
      await this.logEmail({
        orderId: order.id,
        customerId: order.customerId,
        customerEmail: customer.email,
        customerName: customer.name,
        emailType: "order_confirmation",
        subject: `Order Confirmation #${order.orderNumber}`,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
      
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
          useBilling: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Email API error:", result);
        
        // Log failed email
        await this.logEmail({
          orderId: order.id,
          customerId: order.customerId,
          customerEmail: customer.email,
          customerName: customer.name,
          emailType: "invoice",
          subject,
          status: "failed",
          errorMessage: result.error || "Failed to send email"
        });
        
        return {
          success: false,
          message: result.error || "Failed to send email",
        };
      }

      // Log successful email
      await this.logEmail({
        orderId: order.id,
        customerId: order.customerId,
        customerEmail: customer.email,
        customerName: customer.name,
        emailType: "invoice",
        subject,
        status: "sent"
      });

      return {
        success: true,
        message: `Invoice sent to ${customer.email}`,
      };
    } catch (error) {
      console.error("Email service error:", error);
      
      // Log failed email
      await this.logEmail({
        orderId: order.id,
        customerId: order.customerId,
        customerEmail: customer.email,
        customerName: customer.name,
        emailType: "invoice",
        subject: `Invoice for Order #${order.orderNumber}`,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });
      
      return {
        success: false,
        message: "Failed to send email",
      };
    }
  },

  /**
   * Log email to database
   */
  async logEmail(data: {
    orderId: string;
    customerId: string;
    customerEmail: string;
    customerName: string;
    emailType: "order_confirmation" | "invoice";
    subject: string;
    status: "sent" | "failed";
    errorMessage?: string;
  }): Promise<void> {
    try {
      await supabase.from("emails").insert({
        order_id: data.orderId,
        customer_id: data.customerId,
        customer_email: data.customerEmail,
        customer_name: data.customerName,
        email_type: data.emailType,
        subject: data.subject,
        status: data.status,
        error_message: data.errorMessage
      });
    } catch (error) {
      console.error("Error logging email:", error);
    }
  }
};

// Helper to generate HTML email template for order confirmation
function generateOrderEmailTemplate(order: Order, customer: Customer): string {
  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6;">${item.productName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: center;">${item.quantity} lbs</td>
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: right;">$${item.pricePerLb.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">$${(item.finalPrice ?? item.totalPrice).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const discountRow =
    order.discount && order.discount > 0
      ? `<tr>
            <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280;">Discount:</td>
            <td style="padding: 12px; text-align: right; font-weight: 600; color: #16a34a;">-$${order.discount.toFixed(2)}</td>
          </tr>`
      : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); min-height: 100vh;">
      <div style="max-width: 650px; margin: 40px auto; padding: 20px;">
        <!-- Header with Logo -->
        <div style="background: white; border-radius: 16px 16px 0 0; padding: 40px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
            <span style="font-size: 40px; color: white;">✓</span>
          </div>
          <h1 style="margin: 0; color: #1f2937; font-size: 32px; font-weight: 700;">Order Confirmed!</h1>
          <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 16px;">Thank you for your order</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">Dear <strong>${customer.name}</strong>,</p>
          <p style="margin: 0 0 32px 0; font-size: 16px; color: #374151; line-height: 1.6;">We've received your order and are preparing your items. Here are the details:</p>
          
          <!-- Order Details Box -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; margin: 0 0 32px 0; border-left: 4px solid #f59e0b;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #6b7280; font-size: 14px;">Order Number</span>
              <strong style="color: #1f2937; font-size: 16px;">#${order.orderNumber}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #6b7280; font-size: 14px;">Date</span>
              <strong style="color: #1f2937;">${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280; font-size: 14px;">Status</span>
              <strong style="color: #f59e0b; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">${order.status}</strong>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 32px 0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                <th style="padding: 16px 12px; text-align: center; font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                <th style="padding: 16px 12px; text-align: right; font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Price/lb</th>
                <th style="padding: 16px 12px; text-align: right; font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280;">Subtotal:</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #1f2937;">$${order.subtotal.toFixed(2)}</td>
              </tr>
              ${discountRow}
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280;">Tax:</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #1f2937;">$${order.tax.toFixed(2)}</td>
              </tr>
              <tr style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
                <td colspan="3" style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 18px; color: #1f2937;">Total:</td>
                <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 20px; color: #f59e0b;">$${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          ${
            order.deliveryDate
              ? `<div style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 0 0 24px 0;">
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 24px; margin-right: 12px;">🚚</span>
                  <div>
                    <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 500;">Delivery Date</p>
                    <p style="margin: 4px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">${new Date(order.deliveryDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>`
              : ""
          }

          ${
            order.notes
              ? `<div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151; font-size: 14px;">Order Notes:</p>
                <p style="margin: 0; color: #6b7280; line-height: 1.6;">${order.notes}</p>
              </div>`
              : ""
          }
        </div>

        <!-- Footer -->
        <div style="background: #1f2937; border-radius: 0 0 16px 16px; padding: 32px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">Questions about your order?</p>
          <p style="margin: 0 0 20px 0; color: white; font-size: 16px; font-weight: 600;">sales@satmarmatzosmtl.ca</p>
          <div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 20px;">
            <p style="margin: 0; color: white; font-size: 18px; font-weight: 700;">Satmar Montreal Matzos</p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px;">Thank you for your business!</p>
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
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6;">${item.productName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: center;">${item.quantity} lbs</td>
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: right;">$${item.pricePerLb.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">$${(item.finalPrice ?? item.totalPrice).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const discountRow =
    order.discount && order.discount > 0
      ? `<tr>
            <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280;">Discount:</td>
            <td style="padding: 12px; text-align: right; font-weight: 600; color: #16a34a;">-$${order.discount.toFixed(2)}</td>
          </tr>`
      : "";

  const paidAmount = (order as any).payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || order.amountPaid || 0;
  const balance = order.total - paidAmount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); min-height: 100vh;">
      <div style="max-width: 650px; margin: 40px auto; padding: 20px;">
        <!-- Header -->
        <div style="background: white; border-radius: 16px 16px 0 0; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px;">
            <div>
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                <span style="font-size: 28px; color: white;">📄</span>
              </div>
              <h1 style="margin: 0; color: #1f2937; font-size: 32px; font-weight: 700;">Invoice</h1>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Invoice Number</p>
              <p style="margin: 0 0 16px 0; font-size: 20px; color: #1f2937; font-weight: 700;">#${order.orderNumber}</p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              ${order.deliveryDate ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Delivery: ${new Date(order.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>` : ""}
            </div>
          </div>

          <!-- Bill To & From -->
          <div style="display: flex; justify-content: space-between; padding: 24px; background: #f9fafb; border-radius: 8px; margin-bottom: 32px;">
            <div>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Bill To</p>
              <p style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600; font-size: 16px;">${customer.name}</p>
              ${customer.email ? `<p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${customer.email}</p>` : ""}
              ${customer.phone ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">${customer.phone}</p>` : ""}
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">From</p>
              <p style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600; font-size: 16px;">Satmar Montreal Matzos</p>
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">billing@satmarmatzosmtl.ca</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">(438) 300-8425</p>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 32px 0;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                <th style="padding: 16px 12px; text-align: center; font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                <th style="padding: 16px 12px; text-align: right; font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Rate</th>
                <th style="padding: 16px 12px; text-align: right; font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #e5e7eb;">
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280;">Subtotal:</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #1f2937;">$${order.subtotal.toFixed(2)}</td>
              </tr>
              ${discountRow}
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280;">Tax:</td>
                <td style="padding: 12px; text-align: right; font-weight: 600; color: #1f2937;">$${order.tax.toFixed(2)}</td>
              </tr>
              <tr style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);">
                <td colspan="3" style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 16px; color: #1f2937;">Total Due:</td>
                <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 20px; color: #1e40af;">$${order.total.toFixed(2)}</td>
              </tr>
              ${
                paidAmount > 0
                  ? `<tr style="border-top: 1px solid #e5e7eb;">
                  <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #6b7280;">Amount Paid:</td>
                  <td style="padding: 12px; text-align: right; font-weight: 600; color: #16a34a;">$${paidAmount.toFixed(2)}</td>
                </tr>
                <tr style="background: ${balance > 0 ? "#fef2f2" : "#f0fdf4"};">
                  <td colspan="3" style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 16px; color: #1f2937;">Balance Due:</td>
                  <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 20px; color: ${balance > 0 ? "#dc2626" : "#16a34a"};">$${balance.toFixed(2)}</td>
                </tr>`
                  : ""
              }
            </tfoot>
          </table>

          ${
            order.notes
              ? `<div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151; font-size: 14px;">Notes:</p>
                <p style="margin: 0; color: #6b7280; line-height: 1.6;">${order.notes}</p>
              </div>`
              : ""
          }

          ${balance > 0 ? `
          <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px;">⚠️ Payment Required</p>
            <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 13px; line-height: 1.5;">Please remit payment at your earliest convenience. Contact us for payment arrangements.</p>
          </div>
          ` : `
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a; text-align: center;">
            <p style="margin: 0; color: #166534; font-weight: 700; font-size: 16px;">✓ Paid in Full</p>
            <p style="margin: 8px 0 0 0; color: #14532d; font-size: 14px;">Thank you for your payment!</p>
          </div>
          `}
        </div>

        <!-- Footer -->
        <div style="background: #1f2937; border-radius: 0 0 16px 16px; padding: 32px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">Payment inquiries</p>
          <p style="margin: 0 0 20px 0; color: white; font-size: 16px; font-weight: 600;">billing@satmarmatzosmtl.ca</p>
          <div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 20px;">
            <p style="margin: 0; color: white; font-size: 18px; font-weight: 700;">Satmar Montreal Matzos</p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px;">2765 Chemin de la Côte-Sainte-Catherine, Montreal, QC H3T 1B6</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}