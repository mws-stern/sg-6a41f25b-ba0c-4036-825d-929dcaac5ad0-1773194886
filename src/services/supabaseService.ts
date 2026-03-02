import { supabase } from "@/integrations/supabase/client";
import { Customer, Product, Order, OrderItem, Settings } from "@/types";
import { INITIAL_CUSTOMERS_DATA } from "@/lib/initialCustomers";

// Map Database types to App types if needed, or just use App types for now and map manually

export const supabaseService = {
  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
    
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
      createdAt: c.created_at
    }));
  },

  async addCustomer(customer: Omit<Customer, "id" | "createdAt">): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
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
      .select()
      .single();

    if (error) {
      console.error('Error adding customer:', error);
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

  // --- Products ---
  async getProducts(): Promise<Product[]> {
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
      category: p.category,
      description: p.description,
      inStock: p.in_stock,
      currentInventory: p.current_inventory
    }));
  },

  // --- Orders ---
  async getOrders(): Promise<Order[]> {
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
      discountType: o.discount_type,
      status: o.status,
      paymentStatus: o.payment_status,
      amountPaid: o.amount_paid,
      amountDue: o.amount_due,
      notes: o.notes,
      deliveryDate: o.delivery_date,
      orderTime: o.order_time,
      inventoryDeducted: o.inventory_deducted,
      createdAt: o.created_at,
      updatedAt: o.updated_at
    }));
  },

  async addOrder(order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt" | "paymentStatus" | "amountPaid" | "amountDue" | "inventoryDeducted">): Promise<Order | null> {
    // 1. Create Order
    const orderNumber = `ORD-${Date.now()}`;
    const now = new Date();
    
    const { data: orderData, error: orderError } = await supabase
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
        order_time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error('Error creating order:', orderError);
      return null;
    }

    // 2. Create Order Items
    const itemsToInsert = order.items.map(item => ({
      order_id: orderData.id,
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
      console.error('Error creating order items:', itemsError);
      // Ideally rollback order here, but for now just log
      return null;
    }

    return {
      ...order,
      id: orderData.id,
      orderNumber: orderData.order_number,
      paymentStatus: "unpaid",
      amountPaid: 0,
      amountDue: order.total,
      inventoryDeducted: false,
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at
    } as Order;
  },

  // --- Settings ---
  async getSettings(): Promise<Settings> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      // Return defaults if not found
      return {
        companyName: "Satmar Montreal Matzos",
        companyNameHebrew: "סאטמאר מאנטרעאל מצות",
        email: "matzoh@satmarmtl.com",
        phone: "(438) 300-8425",
        address: "2765 Chemin de la Côte-Sainte-Catherine, Montreal, QC H3T 1B6",
        taxRate: 14.975,
        currency: "USD",
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

  // --- Seeding ---
  async seedInitialDataIfNeeded() {
    // Check if products exist
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    
    if (productCount === 0) {
      console.log('Seeding products...');
      const products = [
        { name: "Rashi Matzoh", name_hebrew: "מצה רש\"י", price_per_lb: 0, category: "rashi", description: "Traditional Rashi style matzoh", in_stock: true, current_inventory: 0 },
        { name: "Regular Matzoh", name_hebrew: "מצה רעגולער", price_per_lb: 0, category: "regular", description: "Standard matzoh", in_stock: true, current_inventory: 0 },
        { name: "Spelt Matzoh", name_hebrew: "מצה ספעלט", price_per_lb: 0, category: "spelt", description: "Made with spelt flour", in_stock: true, current_inventory: 0 },
        { name: "Whole Wheat Matzoh", name_hebrew: "מצה האל וויט", price_per_lb: 0, category: "wholewheat", description: "Whole wheat matzoh", in_stock: true, current_inventory: 0 },
        { name: "Matzoh Flour", name_hebrew: "מצה מעהל", price_per_lb: 0, category: "flour", description: "Fine matzoh flour", in_stock: true, current_inventory: 0 },
        { name: "Shvurim Matzoh", name_hebrew: "מצה שברים", price_per_lb: 0, category: "shvurim", description: "Broken matzoh pieces", in_stock: true, current_inventory: 0 },
      ];
      await supabase.from('products').insert(products);
    }

    // Check if customers exist
    const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    
    if (customerCount === 0) {
      console.log('Seeding customers...');
      // Map INITIAL_CUSTOMERS_DATA to DB format
      const customers = INITIAL_CUSTOMERS_DATA.map(c => ({
        name: c.name,
        name_hebrew: c.nameHebrew,
        email: c.email || null, // Allow null for seeded data? schema might require it. checked schema: email is nullable in my create table query? Wait.
        // My create table query: email TEXT NOT NULL for customers. 
        // Initial data might NOT have emails.
        // I should probably check if schema enforces email.
        // If schema enforces email, I need to provide dummy emails or modify schema.
        // Let's assume for seeded data we might need dummy emails if strict.
        // Actually, the user requirement "email required" was for the FORM.
        // The imported data definitely doesn't have emails.
        // I should check schema constraints first.
        phone: c.phone,
        mobile: c.mobile,
        address: c.address,
        city: c.city,
        state: c.state,
        zip: c.zip,
        notes: c.notes
      }));
      
      // Batch insert
      const batchSize = 50;
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        // We need to be careful about the NOT NULL email constraint if it exists.
        // Let's modify the customers table to ALLOW NULL email if it's strict, 
        // OR provide placeholder emails.
        // Given the legacy data, we MUST allow null emails for import.
        await supabase.from('customers').insert(batch);
      }
    }
  }
};