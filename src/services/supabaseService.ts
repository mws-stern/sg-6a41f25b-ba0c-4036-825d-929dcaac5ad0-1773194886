import { supabase } from "@/integrations/supabase/client";
import { Customer, Product, Order, OrderItem, Settings, Invoice, Payment, InventoryEntry } from "@/types";
import { INITIAL_CUSTOMERS_DATA } from "@/lib/initialCustomers";

// Map Database types to App types if needed, or just use App types for now and map manually

export const supabaseService = {
  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    console.log("🔍 Fetching customers from Supabase...");

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) {
        console.error("❌ Error fetching customers (Supabase response error):", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return [];
      }

      if (!data) {
        console.warn("⚠️ Supabase returned no data for customers (data is null/undefined).");
        return [];
      }

      console.log("✅ Successfully fetched customers:", data.length);

      // Map snake_case to camelCase
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        nameHebrew: c.name_hebrew,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        address: c.address,
        city: c.city,
        state: c.state,
        zip: c.zip,
        notes: c.notes,
        createdAt: c.created_at,
      }));
    } catch (err) {
      console.error("🔥 Network or unexpected error while fetching customers:", err);
      // Gracefully degrade instead of crashing the page
      return [];
    }
  },

  async getCustomer(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) {
      console.error('Error fetching customer:', error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      nameHebrew: data.name_hebrew,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      notes: data.notes,
      createdAt: data.created_at
    };
  },

  async addCustomer(customer: Omit<Customer, "id" | "createdAt">): Promise<Customer | null> {
    const customerData = {
      name: customer.name,
      name_hebrew: customer.nameHebrew || null,
      email: customer.email || null,
      phone: customer.phone || null,
      mobile: customer.mobile || null,
      address: customer.address || null,
      city: customer.city || null,
      state: customer.state || null,
      zip: customer.zip || null,
      notes: customer.notes || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Error adding customer:', error);
      return null;
    }

    console.log('Customer added successfully:', data);

    return data ? {
      id: data.id,
      name: data.name,
      nameHebrew: data.name_hebrew,
      phone: data.phone,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      notes: data.notes,
      createdAt: data.created_at,
    } : null;
  },

  async updateCustomer(customer: Customer): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .update({
        name: customer.name,
        name_hebrew: customer.nameHebrew,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        notes: customer.notes
      })
      .eq('id', customer.id);

    if (error) console.error('Error updating customer:', error);
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) console.error('Error deleting customer:', error);
  },

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        nameHebrew: p.name_hebrew,
        pricePerLb: p.price_per_lb,
        category: p.category as Product["category"],
        description: p.description,
        inStock: p.in_stock,
        currentInventory: p.current_inventory
      }));
    } catch (err) {
      console.error("Network error fetching products:", err);
      return [];
    }
  },

  async updateProduct(product: Product): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        name_hebrew: product.nameHebrew,
        price_per_lb: product.pricePerLb,
        category: product.category,
        description: product.description,
        in_stock: product.inStock,
        current_inventory: product.currentInventory
      })
      .eq('id', product.id);

    if (error) console.error('Error updating product:', error);
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error('Error deleting product:', error);
  },

  async addProduct(product: Omit<Product, "id">): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        name_hebrew: product.nameHebrew,
        price_per_lb: product.pricePerLb,
        category: product.category as string,
        description: product.description,
        in_stock: product.inStock,
        current_inventory: product.currentInventory
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      nameHebrew: data.name_hebrew,
      pricePerLb: data.price_per_lb,
      category: data.category as Product["category"],
      description: data.description,
      inStock: data.in_stock,
      currentInventory: data.current_inventory
    };
  },

  // --- Orders ---
  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }

      return data.map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerId: o.customer_id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        items: o.items.map((i: any) => ({
          productId: i.product_id,
          productName: i.product_name,
          productNameHebrew: i.product_name_hebrew,
          quantity: i.quantity,
          pricePerLb: i.price_per_lb,
          totalPrice: i.total_price,
          discount: i.discount,
          discountType: i.discount_type,
          finalPrice: i.final_price
        })),
        subtotal: o.subtotal,
        tax: o.tax,
        total: o.total,
        discount: o.discount,
        discountType: o.discount_type as "percent" | "fixed" | undefined,
        status: o.status as "draft" | "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled",
        paymentStatus: o.payment_status as "unpaid" | "partial" | "paid",
        amountPaid: o.amount_paid,
        amountDue: o.amount_due,
        notes: o.notes,
        deliveryDate: o.delivery_date,
        orderTime: o.order_time,
        inventoryDeducted: o.inventory_deducted,
        createdAt: o.created_at,
        updatedAt: o.updated_at
      }));
    } catch (err) {
      console.error("Network error fetching orders:", err);
      return [];
    }
  },

  async getOrder(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching order:', error);
      return null;
    }

    return {
      id: data.id,
      orderNumber: data.order_number,
      customerId: data.customer_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      items: data.items.map((i: any) => ({
        productId: i.product_id,
        productName: i.product_name,
        productNameHebrew: i.product_name_hebrew,
        quantity: i.quantity,
        pricePerLb: i.price_per_lb,
        totalPrice: i.total_price,
        discount: i.discount,
        discountType: i.discount_type,
        finalPrice: i.final_price
      })),
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      discount: data.discount,
      discountType: data.discount_type as "percent" | "fixed" | undefined,
      status: data.status as "draft" | "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled",
      paymentStatus: data.payment_status as "unpaid" | "partial" | "paid",
      amountPaid: data.amount_paid,
      amountDue: data.amount_due,
      notes: data.notes,
      deliveryDate: data.delivery_date,
      orderTime: data.order_time,
      inventoryDeducted: data.inventory_deducted,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async addOrder(order: Omit<Order, "id" | "createdAt" | "orderNumber" | "paymentStatus" | "amountPaid" | "amountDue" | "updatedAt" | "inventoryDeducted" | "orderTime">): Promise<Order | null> {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    
    // 1. Insert order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: order.customerId,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        discount: order.discount,
        discount_type: order.discountType,
        status: order.status,
        payment_status: "unpaid",
        amount_paid: 0,
        amount_due: order.total,
        notes: order.notes,
        delivery_date: order.deliveryDate,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error adding order:', error);
      return null;
    }

    // 2. Insert items
    if (order.items && order.items.length > 0) {
      const itemsToInsert = order.items.map(item => ({
        order_id: data.id,
        product_id: item.productId,
        product_name: item.productName,
        product_name_hebrew: item.productNameHebrew,
        quantity: item.quantity,
        price_per_lb: item.pricePerLb,
        total_price: item.totalPrice,
        discount: item.discount,
        discount_type: item.discountType,
        final_price: item.finalPrice
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);
        
      if (itemsError) {
        console.error('Error adding order items:', itemsError);
      }
    }

    return this.getOrder(data.id);
  },

  async updateOrder(order: Order): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({
        customer_id: order.customerId,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        discount: order.discount,
        discount_type: order.discountType,
        status: order.status,
        payment_status: order.paymentStatus,
        amount_paid: order.amountPaid,
        amount_due: order.amountDue,
        notes: order.notes,
        delivery_date: order.deliveryDate,
        inventory_deducted: order.inventoryDeducted
      })
      .eq('id', order.id);

    if (error) {
      console.error('Error updating order:', error);
    }

    if (order.items) {
      await supabase.from('order_items').delete().eq('order_id', order.id);
      
      if (order.items.length > 0) {
        const itemsToInsert = order.items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          product_name_hebrew: item.productNameHebrew,
          quantity: item.quantity,
          price_per_lb: item.pricePerLb,
          total_price: item.totalPrice,
          discount: item.discount,
          discount_type: item.discountType,
          final_price: item.finalPrice
        }));

        await supabase.from('order_items').insert(itemsToInsert);
      }
    }
  },

  async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) console.error('Error deleting order:', error);
  },

  // --- Invoices ---
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }

    return data.map((inv: any) => ({
      id: inv.id,
      orderId: inv.order_id,
      invoiceNumber: inv.invoice_number,
      customerId: inv.customer_id,
      customerName: inv.customer_name,
      customerEmail: inv.customer_email,
      items: inv.items_json ? JSON.parse(inv.items_json) : [], // Storing items as JSON for simplicity in invoice
      subtotal: inv.subtotal,
      tax: inv.tax,
      total: inv.total,
      paid: inv.paid,
      paymentStatus: inv.payment_status as "unpaid" | "partial" | "paid",
      amountPaid: inv.amount_paid,
      amountDue: inv.amount_due,
      paidAt: inv.paid_at,
      createdAt: inv.created_at,
      dueDate: inv.due_date
    }));
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching invoice:', error);
      return null;
    }

    return {
      id: data.id,
      orderId: data.order_id,
      invoiceNumber: data.invoice_number,
      customerId: data.customer_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      items: (data as any).items_json ? JSON.parse((data as any).items_json) : [],
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      paid: data.paid,
      paymentStatus: data.payment_status as "unpaid" | "partial" | "paid",
      amountPaid: data.amount_paid,
      amountDue: data.amount_due,
      paidAt: data.paid_at,
      createdAt: data.created_at,
      dueDate: data.due_date
    };
  },

  async createInvoiceFromOrder(order: Order): Promise<Invoice | null> {
    const invoiceNumber = `INV-${Date.now()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        order_id: order.id,
        invoice_number: invoiceNumber,
        customer_id: order.customerId,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        items_json: JSON.stringify(order.items),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        paid: order.paymentStatus === 'paid',
        payment_status: order.paymentStatus,
        amount_paid: order.amountPaid,
        amount_due: order.amountDue,
        due_date: dueDate.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return null;
    }

    return {
      id: data.id,
      orderId: data.order_id,
      invoiceNumber: data.invoice_number,
      customerId: data.customer_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      items: order.items,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      paid: data.paid,
      paymentStatus: data.payment_status as "unpaid" | "partial" | "paid",
      amountPaid: data.amount_paid,
      amountDue: data.amount_due,
      paidAt: data.paid_at,
      createdAt: data.created_at,
      dueDate: data.due_date
    };
  },

  // --- Payments ---
  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
      
    if (error) return [];
    
    return data.map((p: any) => ({
      id: p.id,
      orderId: p.order_id,
      invoiceId: p.invoice_id,
      amount: p.amount,
      paymentMethod: p.payment_method,
      paymentDate: p.payment_date,
      notes: p.notes,
      createdAt: p.created_at,
      creditCardLast4: p.credit_card_last4,
      confirmed: p.confirmed,
      confirmedAt: p.confirmed_at
    }));
  },

  getAllPayments: async (): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) return [];
    
    return data.map((p: any) => ({
      id: p.id,
      orderId: p.order_id,
      invoiceId: p.invoice_id,
      amount: p.amount,
      paymentMethod: p.payment_method,
      paymentDate: p.payment_date,
      notes: p.notes,
      createdAt: p.created_at,
      creditCardLast4: p.credit_card_last4,
      confirmed: p.confirmed,
      confirmedAt: p.confirmed_at
    }));
  },

  async addPayment(payment: Omit<Payment, "id" | "createdAt">): Promise<Payment | null> {
    // 1. Insert Payment
    const { data: payData, error: payError } = await supabase
      .from('payments')
      .insert({
        order_id: payment.orderId,
        invoice_id: payment.invoiceId,
        amount: payment.amount,
        payment_method: payment.paymentMethod,
        payment_date: payment.paymentDate,
        notes: payment.notes,
        credit_card_last4: payment.creditCardNumber ? payment.creditCardNumber.slice(-4) : undefined,
        confirmed: payment.confirmed || false,
        confirmed_at: payment.confirmed ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (payError) {
      console.error('Error adding payment:', payError);
      return null;
    }

    // 2. Update Order Totals
    // Fetch current order first to get accurate totals
    const currentOrder = await this.getOrder(payment.orderId);
    if (currentOrder) {
      const newAmountPaid = (currentOrder.amountPaid || 0) + payment.amount;
      const newAmountDue = currentOrder.total - newAmountPaid;
      let newStatus = currentOrder.paymentStatus;
      
      if (newAmountPaid >= currentOrder.total) newStatus = "paid";
      else if (newAmountPaid > 0) newStatus = "partial";

      await supabase
        .from('orders')
        .update({
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          payment_status: newStatus
        })
        .eq('id', payment.orderId);
    }
    
    return {
      ...payment,
      id: payData.id,
      createdAt: payData.created_at,
      creditCardLast4: payData.credit_card_last4,
      confirmed: payData.confirmed,
      confirmedAt: payData.confirmed_at
    };
  },

  async updatePayment(payment: Payment): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .update({
        confirmed: payment.confirmed,
        confirmed_at: payment.confirmedAt
      })
      .eq('id', payment.id);

    if (error) {
      console.error('Error updating payment:', error);
    }
  },

  // --- Inventory ---
  async getInventory(): Promise<InventoryEntry[]> {
    const { data, error } = await supabase
      .from('inventory_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    
    return data.map((e: any) => ({
      id: e.id,
      productId: e.product_id,
      productName: e.product_name,
      amount: e.amount,
      date: e.date,
      notes: e.notes,
      createdAt: e.created_at
    }));
  },

  async addInventoryEntry(entry: Omit<InventoryEntry, "id" | "createdAt">): Promise<InventoryEntry | null> {
    const { data, error } = await supabase
      .from('inventory_entries')
      .insert({
        product_id: entry.productId,
        product_name: entry.productName,
        amount: entry.amount,
        date: entry.date,
        notes: entry.notes
      })
      .select()
      .single();

    if (error) return null;

    // Update product stock
    const { data: product } = await supabase
      .from('products')
      .select('current_inventory')
      .eq('id', entry.productId)
      .single();
      
    if (product) {
      const newStock = (product.current_inventory || 0) + entry.amount;
      await supabase
        .from('products')
        .update({ current_inventory: newStock })
        .eq('id', entry.productId);
    }

    return {
      id: data.id,
      productId: data.product_id,
      productName: data.product_name,
      amount: data.amount,
      date: data.date,
      notes: data.notes,
      createdAt: data.created_at
    };
  },

  // --- Settings ---
  async getSettings(): Promise<Settings> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.log('No settings found, returning defaults');
      // Return defaults if not found
      return {
        companyName: "Satmar Montreal Matzos",
        companyNameHebrew: "סאטמאר מאנטרעאל מצות",
        email: "sales@satmarmatzosmtl.ca",
        phone: "(514) 000-0000",
        address: "Montreal, QC, Canada",
        taxRate: 0.14975,
        currency: "CAD",
      };
    }

    return {
      companyName: data.company_name,
      companyNameHebrew: data.company_name_hebrew,
      email: data.email,
      phone: data.phone,
      address: data.address,
      taxRate: data.tax_rate,
      currency: data.currency
    };
  },

  async saveSettings(settings: Settings): Promise<void> {
    // Upsert settings (assuming id=1 or single row)
    // We'll check if exists, if not insert, if yes update
    // Actually, let's just use upsert if we had a fixed ID. 
    // Since we don't know the ID, we'll try to update first, if no match insert.
    // Or just fetch first.
    
    const { data } = await supabase.from('settings').select('id').limit(1).single();
    
    const settingsData = {
      company_name: settings.companyName,
      company_name_hebrew: settings.companyNameHebrew,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      tax_rate: settings.taxRate,
      currency: settings.currency
    };

    if (data) {
       await supabase.from('settings').update(settingsData).eq('id', data.id);
    } else {
       await supabase.from('settings').insert(settingsData);
    }
  },

  // --- Seeding ---
  async seedInitialDataIfNeeded() {
    // Check if products exist
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    
    if (productCount === 0) {
      console.log('Seeding products...');
      const products = [
        { name: "Rashi Matzoh", name_hebrew: "מצה רש\"י", price_per_lb: 0, category: "rashi" as const, description: "Traditional Rashi style matzoh", in_stock: true, current_inventory: 0 },
        { name: "Regular Matzoh", name_hebrew: "מצה רעגולער", price_per_lb: 0, category: "regular" as const, description: "Standard matzoh", in_stock: true, current_inventory: 0 },
        { name: "Spelt Matzoh", name_hebrew: "מצה ספעלט", price_per_lb: 0, category: "spelt" as const, description: "Made with spelt flour", in_stock: true, current_inventory: 0 },
        { name: "Whole Wheat Matzoh", name_hebrew: "מצה האל וויט", price_per_lb: 0, category: "wholewheat" as const, description: "Whole wheat matzoh", in_stock: true, current_inventory: 0 },
        { name: "Matzoh Flour", name_hebrew: "מצה מעהל", price_per_lb: 0, category: "flour" as const, description: "Fine matzoh flour", in_stock: true, current_inventory: 0 },
        { name: "Shvurim Matzoh", name_hebrew: "מצה שברים", price_per_lb: 0, category: "shvurim" as const, description: "Broken matzoh pieces", in_stock: true, current_inventory: 0 },
      ];
      await supabase.from('products').insert(products);
    }

    // Check if customers exist
    const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    
    if (customerCount === 0) {
      console.log('Seeding customers...');
      // Map INITIAL_CUSTOMERS_DATA to DB format
      const customersToInsert = INITIAL_CUSTOMERS_DATA.map(c => ({
        name: c.name,
        name_hebrew: c.nameHebrew || null,
        email: c.email || null,
        phone: c.phone || null,
        mobile: c.mobile || null,
        address: c.address || null,
        city: c.city || null,
        state: c.state || null,
        zip: c.zip || null,
        notes: c.notes || null
      }));
      
      // Insert all at once to prevent multiple network requests failing
      const { error } = await supabase.from('customers').insert(customersToInsert);
      
      if (error) {
        console.error("Error seeding customers:", error);
      } else {
        console.log(`Successfully seeded ${customersToInsert.length} customers.`);
      }
    }
  }
};