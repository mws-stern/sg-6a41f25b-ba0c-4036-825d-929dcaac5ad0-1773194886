import { Order, Customer } from "@/types";

const BUSINESS_ADDRESS = "2765 Chemin Bates, Montreal, QC";
const BUSINESS_EMAIL = "sales@satmarmatzosmtl.ca";
const BUSINESS_PHONE = "(514) 555-1234"; // Update with actual phone if available

interface EmailResult {
  success: boolean;
  message?: string;
}

export const emailService = {
  async sendOrderConfirmation(
    order: Order,
    customer: Customer
  ): Promise<EmailResult> {
    if (!customer.email) {
      return { success: false, message: "Customer has no email address" };
    }

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${item.productName}</div>
            ${(item as any).notes ? `<div style="font-size: 14px; color: #6b7280;">${(item as any).notes}</div>` : ""}
          </td>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 0} lbs</td>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.pricePerLb || 0).toFixed(2)}/lb</td>
          ${
            item.discount
              ? `<td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">-$${(item.discount || 0).toFixed(2)}</td>`
              : `<td style="padding: 16px; border-bottom: 1px solid #e5e7eb;"></td>`
          }
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${(item.finalPrice || 0).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://3000-6a41f25b-ba0c-4036-825d-929dcaac5ad0.softgen.dev'}/logo.png" alt="Satmar Montreal Matzos" style="max-width: 120px; height: auto; margin-bottom: 20px;" />
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Order Confirmation</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Thank you for your order!</p>
                    </td>
                  </tr>

                  <!-- From Section -->
                  <tr>
                    <td style="background-color: #fffbeb; padding: 24px 30px; border-bottom: 2px solid #fbbf24;">
                      <div style="font-size: 14px; color: #92400e; margin-bottom: 8px; font-weight: 600;">FROM:</div>
                      <div style="font-size: 16px; color: #78350f; font-weight: 700; margin-bottom: 8px;">Satmar Montreal Matzos</div>
                      <div style="font-size: 14px; color: #92400e; line-height: 1.6;">
                        ${BUSINESS_ADDRESS}<br>
                        Email: ${BUSINESS_EMAIL}<br>
                        ${BUSINESS_PHONE ? `Phone: ${BUSINESS_PHONE}<br>` : ""}
                      </div>
                    </td>
                  </tr>

                  <!-- Order Details -->
                  <tr>
                    <td style="padding: 30px;">
                      
                      <div style="margin-bottom: 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600; padding-bottom: 12px; border-bottom: 2px solid #f59e0b;">Order Details</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 14px; width: 140px;">Order Number:</td>
                            <td style="padding: 12px 0; color: #111827; font-weight: 600;">#${order.orderNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Customer:</td>
                            <td style="padding: 12px 0; color: #111827; font-weight: 600;">${customer.name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Delivery Date:</td>
                            <td style="padding: 12px 0; color: #111827; font-weight: 600;">${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not specified"}</td>
                          </tr>
                          ${order.notes ? `
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Notes:</td>
                            <td style="padding: 12px 0; color: #111827;">${order.notes}</td>
                          </tr>
                          ` : ""}
                        </table>
                      </div>

                      <!-- Items Table -->
                      <div style="margin-bottom: 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600; padding-bottom: 12px; border-bottom: 2px solid #f59e0b;">Order Items</h2>
                        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
                          <thead>
                            <tr style="background-color: #f9fafb;">
                              <th style="padding: 14px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Product</th>
                              <th style="padding: 14px 16px; text-align: center; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                              <th style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Price</th>
                              <th style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Discount</th>
                              <th style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${itemsHtml}
                          </tbody>
                        </table>
                      </div>

                      <!-- Totals -->
                      <div style="margin-top: 30px; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                        <table style="width: 100%; max-width: 400px; margin-left: auto;">
                          <tr>
                            <td style="padding: 10px 0; color: #6b7280; font-size: 15px;">Subtotal:</td>
                            <td style="padding: 10px 0; text-align: right; font-size: 15px; color: #111827;">$${(order.subtotal || 0).toFixed(2)}</td>
                          </tr>
                          ${
                            order.discount
                              ? `
                          <tr>
                            <td style="padding: 10px 0; color: #dc2626; font-size: 15px;">Discount:</td>
                            <td style="padding: 10px 0; text-align: right; font-size: 15px; color: #dc2626;">-$${(order.discount || 0).toFixed(2)}</td>
                          </tr>
                          `
                              : ""
                          }
                          <tr style="border-top: 2px solid #e5e7eb;">
                            <td style="padding: 16px 0 0 0; color: #111827; font-size: 18px; font-weight: 700;">Total:</td>
                            <td style="padding: 16px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #f59e0b;">$${(order.total || 0).toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Questions about your order?</p>
                      <p style="margin: 0 0 20px 0; color: #111827; font-size: 15px; font-weight: 600;">Contact us at ${BUSINESS_EMAIL}</p>
                      <p style="margin: 0; color: #9ca3af; font-size: 13px;">© ${new Date().getFullYear()} Satmar Montreal Matzos. All rights reserved.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customer.email,
          subject: `Order Confirmation - #${order.orderNumber}`,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        return { success: false, message: "Failed to send email" };
      }

      return { success: true, message: "Confirmation email sent successfully" };
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      return { success: false, message: "Failed to send email" };
    }
  },

  async sendInvoice(order: Order, customer: Customer): Promise<EmailResult> {
    if (!customer.email) {
      return { success: false, message: "Customer has no email address" };
    }

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${item.productName}</div>
            ${(item as any).notes ? `<div style="font-size: 14px; color: #6b7280;">${(item as any).notes}</div>` : ""}
          </td>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 0} lbs</td>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.pricePerLb || 0).toFixed(2)}/lb</td>
          ${
            item.discount
              ? `<td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">-$${(item.discount || 0).toFixed(2)}</td>`
              : `<td style="padding: 16px; border-bottom: 1px solid #e5e7eb;"></td>`
          }
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${(item.finalPrice || 0).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const balanceDue = (order.total || 0) - (order.amountPaid || 0);

    // Generate PDF and get as base64
    let pdfAttachment = null;
    try {
      const pdfResponse = await fetch("/api/generate-invoice-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, customer }),
      });

      if (pdfResponse.ok) {
        const { pdf } = await pdfResponse.json();
        pdfAttachment = {
          filename: `Invoice-${order.orderNumber}.pdf`,
          content: pdf,
          encoding: "base64",
        };
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Continue without PDF if generation fails
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://3000-6a41f25b-ba0c-4036-825d-929dcaac5ad0.softgen.dev'}/logo.png" alt="Satmar Montreal Matzos" style="max-width: 120px; height: auto; margin-bottom: 20px;" />
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Invoice</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Payment Details</p>
                    </td>
                  </tr>

                  <!-- From Section -->
                  <tr>
                    <td style="background-color: #fffbeb; padding: 24px 30px; border-bottom: 2px solid #fbbf24;">
                      <div style="font-size: 14px; color: #92400e; margin-bottom: 8px; font-weight: 600;">FROM:</div>
                      <div style="font-size: 16px; color: #78350f; font-weight: 700; margin-bottom: 8px;">Satmar Montreal Matzos</div>
                      <div style="font-size: 14px; color: #92400e; line-height: 1.6;">
                        ${BUSINESS_ADDRESS}<br>
                        Email: ${BUSINESS_EMAIL}<br>
                        ${BUSINESS_PHONE ? `Phone: ${BUSINESS_PHONE}<br>` : ""}
                      </div>
                    </td>
                  </tr>

                  <!-- Bill To Section -->
                  <tr>
                    <td style="padding: 30px; background-color: #f9fafb;">
                      <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px; font-weight: 600;">BILL TO:</div>
                      <div style="font-size: 16px; color: #111827; font-weight: 700; margin-bottom: 8px;">${customer.name}</div>
                      <div style="font-size: 14px; color: #4b5563; line-height: 1.6;">
                        ${customer.email ? `Email: ${customer.email}<br>` : ""}
                        ${customer.phone ? `Phone: ${customer.phone}<br>` : ""}
                        ${customer.address ? `${customer.address}<br>` : ""}
                      </div>
                    </td>
                  </tr>

                  <!-- Invoice Details -->
                  <tr>
                    <td style="padding: 30px;">
                      
                      <div style="margin-bottom: 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600; padding-bottom: 12px; border-bottom: 2px solid #f59e0b;">Invoice Details</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 14px; width: 140px;">Invoice Number:</td>
                            <td style="padding: 12px 0; color: #111827; font-weight: 600;">#${order.orderNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Date:</td>
                            <td style="padding: 12px 0; color: #111827; font-weight: 600;">${new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Delivery Date:</td>
                            <td style="padding: 12px 0; color: #111827; font-weight: 600;">${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not specified"}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Payment Status:</td>
                            <td style="padding: 12px 0;">
                              <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; ${
                                order.paymentStatus === "paid"
                                  ? "background-color: #d1fae5; color: #065f46;"
                                  : order.paymentStatus === "partial"
                                  ? "background-color: #fef3c7; color: #92400e;"
                                  : "background-color: #fee2e2; color: #991b1b;"
                              }">
                                ${order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : "Unpaid"}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- Items Table -->
                      <div style="margin-bottom: 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600; padding-bottom: 12px; border-bottom: 2px solid #f59e0b;">Items</h2>
                        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
                          <thead>
                            <tr style="background-color: #f9fafb;">
                              <th style="padding: 14px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Product</th>
                              <th style="padding: 14px 16px; text-align: center; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                              <th style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Price</th>
                              <th style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Discount</th>
                              <th style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${itemsHtml}
                          </tbody>
                        </table>
                      </div>

                      <!-- Totals -->
                      <div style="margin-top: 30px; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                        <table style="width: 100%; max-width: 400px; margin-left: auto;">
                          <tr>
                            <td style="padding: 10px 0; color: #6b7280; font-size: 15px;">Subtotal:</td>
                            <td style="padding: 10px 0; text-align: right; font-size: 15px; color: #111827;">$${(order.subtotal || 0).toFixed(2)}</td>
                          </tr>
                          ${
                            order.discount
                              ? `
                          <tr>
                            <td style="padding: 10px 0; color: #dc2626; font-size: 15px;">Discount:</td>
                            <td style="padding: 10px 0; text-align: right; font-size: 15px; color: #dc2626;">-$${(order.discount || 0).toFixed(2)}</td>
                          </tr>
                          `
                              : ""
                          }
                          <tr style="border-top: 2px solid #e5e7eb;">
                            <td style="padding: 16px 0 0 0; color: #111827; font-size: 18px; font-weight: 700;">Total:</td>
                            <td style="padding: 16px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #f59e0b;">$${(order.total || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; color: #6b7280; font-size: 15px;">Amount Paid:</td>
                            <td style="padding: 10px 0; text-align: right; font-size: 15px; color: #059669;">$${(order.amountPaid || 0).toFixed(2)}</td>
                          </tr>
                          <tr style="border-top: 2px solid #e5e7eb;">
                            <td style="padding: 16px 0 0 0; color: #111827; font-size: 18px; font-weight: 700;">Balance Due:</td>
                            <td style="padding: 16px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: ${balanceDue > 0 ? "#dc2626" : "#059669"};">$${balanceDue.toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>

                      ${pdfAttachment ? `
                      <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <p style="margin: 0; color: #1e40af; font-size: 14px;">
                          <strong>📎 PDF Invoice Attached</strong><br>
                          <span style="color: #3b82f6;">A printable version of this invoice is attached to this email.</span>
                        </p>
                      </div>
                      ` : ""}

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Questions about this invoice?</p>
                      <p style="margin: 0 0 20px 0; color: #111827; font-size: 15px; font-weight: 600;">Contact us at ${BUSINESS_EMAIL}</p>
                      <p style="margin: 0; color: #9ca3af; font-size: 13px;">© ${new Date().getFullYear()} Satmar Montreal Matzos. All rights reserved.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customer.email,
          subject: `Invoice - #${order.orderNumber}`,
          html: emailHtml,
          attachments: pdfAttachment ? [pdfAttachment] : undefined,
        }),
      });

      if (!response.ok) {
        return { success: false, message: "Failed to send invoice" };
      }

      return { success: true, message: "Invoice sent successfully" };
    } catch (error) {
      console.error("Error sending invoice:", error);
      return { success: false, message: "Failed to send invoice" };
    }
  },

  // Preview methods that generate HTML without sending
  generateConfirmationHtml(order: Order, customer: Customer): string {
    const itemsHtml = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 0} lbs</td>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.pricePerLb ?? 0).toFixed(2)}/lb</td>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.discount ?? 0).toFixed(2)}</td>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${(item.finalPrice ?? 0).toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" alt="Satmar Montreal Matzos" style="width: 120px; height: auto; margin-bottom: 20px;" />
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Order Confirmation</h1>
                    </td>
                  </tr>
                  
                  <!-- From Section -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #fffbeb; border-bottom: 2px solid #fbbf24;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
                      <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #78350f;">Satmar Montreal Matzos</h2>
                      <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
                        2765 Chemin Bates<br />
                        Montreal, QC<br />
                        Email: sales@satmarmatzosmtl.ca
                      </p>
                    </td>
                  </tr>

                  <!-- Order Details -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Dear ${customer.name},
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Thank you for your order! Your order has been confirmed and is being processed.
                      </p>

                      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Order Number</p>
                        <p style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: bold;">#${order.orderNumber}</p>
                        
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Order Date</p>
                        <p style="margin: 0 0 16px 0; font-size: 16px; color: #111827;">${new Date(order.createdAt).toLocaleDateString()}</p>
                        
                        ${order.deliveryDate ? `
                          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Delivery Date</p>
                          <p style="margin: 0; font-size: 16px; color: #111827;">${new Date(order.deliveryDate).toLocaleDateString()}</p>
                        ` : ''}
                      </div>

                      <h3 style="color: #111827; font-size: 18px; margin: 0 0 16px 0;">Order Items</h3>
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                          <tr style="background-color: #f9fafb;">
                            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Product</th>
                            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                            <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Price/lb</th>
                            <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Discount</th>
                            <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                      </table>

                      <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
                        <table role="presentation" style="width: 100%; margin-bottom: 10px;">
                          <tr>
                            <td style="padding: 8px 0; font-size: 16px; color: #6b7280;">Subtotal:</td>
                            <td style="padding: 8px 0; font-size: 16px; color: #111827; text-align: right; font-weight: 600;">$${(order.subtotal ?? 0).toFixed(2)}</td>
                          </tr>
                          ${(order.discount ?? 0) > 0 ? `
                          <tr>
                            <td style="padding: 8px 0; font-size: 16px; color: #dc2626;">Discount:</td>
                            <td style="padding: 8px 0; font-size: 16px; color: #dc2626; text-align: right; font-weight: 600;">-$${(order.discount ?? 0).toFixed(2)}</td>
                          </tr>
                          ` : ''}
                          <tr style="border-top: 2px solid #e5e7eb;">
                            <td style="padding: 16px 0 0 0; font-size: 20px; color: #111827; font-weight: bold;">Total:</td>
                            <td style="padding: 16px 0 0 0; font-size: 20px; color: #f59e0b; text-align: right; font-weight: bold;">$${(order.total ?? 0).toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>

                      ${order.notes ? `
                      <div style="margin-top: 30px; padding: 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; font-weight: 600;">Order Notes</p>
                        <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">${order.notes}</p>
                      </div>
                      ` : ''}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Thank you for your order!</p>
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">If you have any questions, please contact us at sales@satmarmatzosmtl.ca</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  },

  generateInvoiceHtml(order: Order, customer: Customer): string {
    const itemsHtml = order.items
      .map(
        (item: any) => `
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
              <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${item.productName}</div>
              ${item.notes ? `<div style="font-size: 12px; color: #6b7280;">${item.notes}</div>` : ''}
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 0} lbs</td>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.pricePerLb ?? 0).toFixed(2)}/lb</td>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.discount ?? 0).toFixed(2)}</td>
            <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${(item.finalPrice ?? 0).toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    const paymentStatus = order.paymentStatus === 'paid' 
      ? '<span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">PAID</span>'
      : order.paymentStatus === 'partial'
      ? '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">PARTIAL</span>'
      : '<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">UNPAID</span>';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" alt="Satmar Montreal Matzos" style="width: 120px; height: auto; margin-bottom: 20px;" />
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Invoice</h1>
                    </td>
                  </tr>
                  
                  <!-- From Section -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #fffbeb; border-bottom: 2px solid #fbbf24;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
                      <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #78350f;">Satmar Montreal Matzos</h2>
                      <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
                        2765 Chemin Bates<br />
                        Montreal, QC<br />
                        Email: sales@satmarmatzosmtl.ca
                      </p>
                    </td>
                  </tr>

                  <!-- Invoice Details -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="width: 50%; vertical-align: top;">
                              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Invoice Number</p>
                              <p style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: bold;">#${order.orderNumber}</p>
                              
                              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Invoice Date</p>
                              <p style="margin: 0; font-size: 16px; color: #111827;">${new Date(order.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td style="width: 50%; vertical-align: top; text-align: right;">
                              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Bill To</p>
                              <p style="margin: 0 0 4px 0; font-size: 16px; color: #111827; font-weight: 600;">${customer.name}</p>
                              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                                ${customer.email || ''}<br />
                                ${customer.phone || ''}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <h3 style="color: #111827; font-size: 18px; margin: 0 0 16px 0;">Invoice Items</h3>
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                          <tr style="background-color: #f9fafb;">
                            <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Product</th>
                            <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                            <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Price/lb</th>
                            <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Discount</th>
                            <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                      </table>

                      <div style="border-top: 2px solid #e5e7eb; padding-top: 20px;">
                        <table role="presentation" style="width: 100%; margin-bottom: 10px;">
                          <tr>
                            <td style="padding: 8px 0; font-size: 16px; color: #6b7280;">Subtotal:</td>
                            <td style="padding: 8px 0; font-size: 16px; color: #111827; text-align: right; font-weight: 600;">$${(order.subtotal ?? 0).toFixed(2)}</td>
                          </tr>
                          ${(order.discount ?? 0) > 0 ? `
                          <tr>
                            <td style="padding: 8px 0; font-size: 16px; color: #dc2626;">Discount:</td>
                            <td style="padding: 8px 0; font-size: 16px; color: #dc2626; text-align: right; font-weight: 600;">-$${(order.discount ?? 0).toFixed(2)}</td>
                          </tr>
                          ` : ''}
                          <tr style="border-top: 2px solid #e5e7eb;">
                            <td style="padding: 16px 0 0 0; font-size: 20px; color: #111827; font-weight: bold;">Total:</td>
                            <td style="padding: 16px 0 0 0; font-size: 20px; color: #f59e0b; text-align: right; font-weight: bold;">$${(order.total ?? 0).toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>

                      <div style="margin-top: 30px; padding: 20px; background-color: #fffbeb; border-radius: 6px;">
                        <p style="margin: 0 0 16px 0; font-size: 16px; color: #78350f; font-weight: 600;">Payment Details</p>
                        <table role="presentation" style="width: 100%;">
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #92400e;">Payment Status:</td>
                            <td style="padding: 8px 0; text-align: right;">${paymentStatus}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #92400e;">Amount Paid:</td>
                            <td style="padding: 8px 0; font-size: 16px; color: #166534; text-align: right; font-weight: 600;">$${(order.amountPaid ?? 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #92400e;">Balance Due:</td>
                            <td style="padding: 8px 0; font-size: 16px; color: #dc2626; text-align: right; font-weight: 600;">$${((order.total ?? 0) - (order.amountPaid ?? 0)).toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Thank you for your business!</p>
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">For questions about this invoice, please contact us at sales@satmarmatzosmtl.ca</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  },
};