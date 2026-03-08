import type { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit";
import { Order, Customer } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { order, customer } = req.body as { order: Order; customer: Customer };

  if (!order || !customer) {
    return res.status(400).json({ error: "Missing order or customer data" });
  }

  try {
    // Create a document
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });

    // Buffer to store PDF
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      const pdfBase64 = pdfBuffer.toString("base64");
      res.status(200).json({ pdf: pdfBase64 });
    });

    // Company header with orange gradient background
    doc.rect(0, 0, doc.page.width, 120).fill("#f59e0b");

    doc
      .fillColor("#ffffff")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("INVOICE", 50, 40);

    doc
      .fillColor("#ffffff")
      .fontSize(12)
      .font("Helvetica")
      .text("Satmar Montreal Matzos", 50, 75)
      .text("2765 Chemin Bates, Montreal, QC", 50, 90)
      .text("sales@satmarmatzosmtl.ca", 50, 105);

    // Invoice number and date (right aligned)
    doc
      .fillColor("#ffffff")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Invoice #${order.orderNumber}`, 400, 75, { align: "right" })
      .font("Helvetica")
      .text(
        `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
        400,
        90,
        { align: "right" }
      );

    // Bill To section
    let yPos = 150;
    doc
      .fillColor("#92400e")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("BILL TO:", 50, yPos);

    yPos += 20;
    doc
      .fillColor("#111827")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(customer.name, 50, yPos);

    yPos += 18;
    doc.fillColor("#4b5563").fontSize(11).font("Helvetica");

    if (customer.email) {
      doc.text(`Email: ${customer.email}`, 50, yPos);
      yPos += 15;
    }
    if (customer.phone) {
      doc.text(`Phone: ${customer.phone}`, 50, yPos);
      yPos += 15;
    }
    if (customer.address) {
      doc.text(customer.address, 50, yPos);
      yPos += 15;
    }

    // Payment status badge
    yPos += 10;
    const paymentStatus = order.paymentStatus || "unpaid";
    const statusColors: Record<string, { bg: string; text: string }> = {
      paid: { bg: "#d1fae5", text: "#065f46" },
      partial: { bg: "#fef3c7", text: "#92400e" },
      unpaid: { bg: "#fee2e2", text: "#991b1b" },
    };
    const statusColor = statusColors[paymentStatus] || statusColors.unpaid;

    doc
      .rect(50, yPos, 100, 20)
      .fill(statusColor.bg)
      .fillColor(statusColor.text)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(
        paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1),
        50,
        yPos + 5,
        { width: 100, align: "center" }
      );

    // Items table
    yPos += 50;
    doc
      .fillColor("#111827")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Items", 50, yPos);

    yPos += 25;

    // Table header with gradient background
    doc.rect(50, yPos, doc.page.width - 100, 25).fill("#f9fafb");

    doc
      .fillColor("#6b7280")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("PRODUCT", 60, yPos + 8)
      .text("QTY", 280, yPos + 8, { width: 50, align: "center" })
      .text("PRICE", 340, yPos + 8, { width: 70, align: "right" })
      .text("DISCOUNT", 420, yPos + 8, { width: 70, align: "right" })
      .text("TOTAL", 500, yPos + 8, { width: 70, align: "right" });

    yPos += 25;

    // Table rows
    doc.fillColor("#111827").fontSize(10).font("Helvetica");

    order.items.forEach((item, index) => {
      // Add new page if needed
      if (yPos > doc.page.height - 150) {
        doc.addPage();
        yPos = 50;
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(50, yPos, doc.page.width - 100, 30).fill("#ffffff");
      } else {
        doc.rect(50, yPos, doc.page.width - 100, 30).fill("#f9fafb");
      }

      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text(item.productName, 60, yPos + 8, { width: 200 });

      if ((item as any).notes) {
        doc
          .fillColor("#6b7280")
          .fontSize(9)
          .font("Helvetica")
          .text((item as any).notes, 60, yPos + 20, { width: 200 });
      }

      doc
        .fillColor("#111827")
        .fontSize(10)
        .font("Helvetica")
        .text(`${item.quantity || 0} lbs`, 280, yPos + 8, {
          width: 50,
          align: "center",
        })
        .text(`$${(item.pricePerLb || 0).toFixed(2)}/lb`, 340, yPos + 8, {
          width: 70,
          align: "right",
        });

      if (item.discount) {
        doc
          .fillColor("#dc2626")
          .text(`-$${(item.discount || 0).toFixed(2)}`, 420, yPos + 8, {
            width: 70,
            align: "right",
          });
      }

      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .text(`$${(item.finalPrice || 0).toFixed(2)}`, 500, yPos + 8, {
          width: 70,
          align: "right",
        });

      yPos += 30;
    });

    // Draw bottom border for table
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .moveTo(50, yPos)
      .lineTo(doc.page.width - 50, yPos)
      .stroke();

    // Totals section
    yPos += 30;

    // Add new page if needed for totals
    if (yPos > doc.page.height - 200) {
      doc.addPage();
      yPos = 50;
    }

    // Background box for totals
    doc.rect(doc.page.width - 250, yPos, 200, 120).fill("#f9fafb");

    yPos += 15;
    const totalsX = doc.page.width - 230;

    doc
      .fillColor("#6b7280")
      .fontSize(11)
      .font("Helvetica")
      .text("Subtotal:", totalsX, yPos)
      .fillColor("#111827")
      .text(`$${(order.subtotal || 0).toFixed(2)}`, totalsX + 100, yPos, {
        width: 80,
        align: "right",
      });

    yPos += 20;

    if (order.discount) {
      doc
        .fillColor("#dc2626")
        .text("Discount:", totalsX, yPos)
        .text(`-$${(order.discount || 0).toFixed(2)}`, totalsX + 100, yPos, {
          width: 80,
          align: "right",
        });
      yPos += 20;
    }

    // Total line
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(2)
      .moveTo(totalsX, yPos)
      .lineTo(totalsX + 180, yPos)
      .stroke();

    yPos += 15;

    doc
      .fillColor("#111827")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Total:", totalsX, yPos)
      .fillColor("#f59e0b")
      .text(`$${(order.total || 0).toFixed(2)}`, totalsX + 100, yPos, {
        width: 80,
        align: "right",
      });

    yPos += 25;

    doc
      .fillColor("#6b7280")
      .fontSize(11)
      .font("Helvetica")
      .text("Amount Paid:", totalsX, yPos)
      .fillColor("#059669")
      .text(`$${(order.amountPaid || 0).toFixed(2)}`, totalsX + 100, yPos, {
        width: 80,
        align: "right",
      });

    yPos += 20;

    // Balance Due line
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(2)
      .moveTo(totalsX, yPos)
      .lineTo(totalsX + 180, yPos)
      .stroke();

    yPos += 15;

    const balanceDue = (order.total || 0) - (order.amountPaid || 0);

    doc
      .fillColor("#111827")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Balance Due:", totalsX, yPos)
      .fillColor(balanceDue > 0 ? "#dc2626" : "#059669")
      .text(`$${balanceDue.toFixed(2)}`, totalsX + 100, yPos, {
        width: 80,
        align: "right",
      });

    // Footer
    const footerY = doc.page.height - 80;
    doc
      .fillColor("#9ca3af")
      .fontSize(10)
      .font("Helvetica")
      .text(
        "Questions about this invoice? Contact us at sales@satmarmatzosmtl.ca",
        50,
        footerY,
        { align: "center", width: doc.page.width - 100 }
      )
      .fontSize(9)
      .text(
        `© ${new Date().getFullYear()} Satmar Montreal Matzos. All rights reserved.`,
        50,
        footerY + 20,
        { align: "center", width: doc.page.width - 100 }
      );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}