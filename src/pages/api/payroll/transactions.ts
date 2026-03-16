import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("[API] Transactions endpoint called:", {
    method: req.method,
    query: req.query,
    body: req.body,
    env: process.env.NODE_ENV
  });

  // Handle GET requests
  if (req.method === "GET") {
    try {
      const { employee_id } = req.query;

      console.log("[API] Fetching transactions for employee:", employee_id);

      let query = supabase
        .from("payroll_transactions")
        .select("*, employee:employees(name)")
        .order("created_at", { ascending: false });

      if (employee_id) {
        const id = Array.isArray(employee_id) ? employee_id[0] : employee_id;
        query = query.eq("employee_id", id);
      }

      const { data, error } = await query;

      console.log("[API] Supabase query result:", {
        dataCount: data?.length,
        error: error
      });

      if (error) {
        console.error("[API] Supabase error:", error);
        return res.status(500).json({
          error: "Failed to fetch transactions",
          details: error.message,
          code: error.code
        });
      }

      console.log("[API] Successfully returning transactions:", data?.length);
      return res.status(200).json(data || []);
    } catch (error) {
      console.error("[API] Unexpected error in GET:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Handle POST requests
  if (req.method === "POST") {
    try {
      const transactionData = req.body;

      console.log("[API] Creating transaction:", transactionData);

      const { data, error } = await supabase
        .from("payroll_transactions")
        .insert([transactionData])
        .select("*, employee:employees(name)")
        .single();

      if (error) {
        console.error("[API] Supabase error in POST:", error);
        return res.status(500).json({
          error: "Failed to create transaction",
          details: error.message,
          code: error.code
        });
      }

      console.log("[API] Transaction created successfully:", data);
      return res.status(201).json(data);
    } catch (error) {
      console.error("[API] Unexpected error in POST:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Handle PUT requests
  if (req.method === "PUT") {
    try {
      const { id, ...updates } = req.body;

      console.log("[API] Updating transaction:", { id, updates });

      if (!id) {
        return res.status(400).json({ error: "Transaction ID is required" });
      }

      const { data, error } = await supabase
        .from("payroll_transactions")
        .update(updates)
        .eq("id", id)
        .select("*, employee:employees(name)")
        .single();

      if (error) {
        console.error("[API] Supabase error in PUT:", error);
        return res.status(500).json({
          error: "Failed to update transaction",
          details: error.message,
          code: error.code
        });
      }

      console.log("[API] Transaction updated successfully:", data);
      return res.status(200).json(data);
    } catch (error) {
      console.error("[API] Unexpected error in PUT:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Handle DELETE requests
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      console.log("[API] Deleting transaction:", id);

      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Transaction ID is required" });
      }

      const { error } = await supabase
        .from("payroll_transactions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("[API] Supabase error in DELETE:", error);
        return res.status(500).json({
          error: "Failed to delete transaction",
          details: error.message,
          code: error.code
        });
      }

      console.log("[API] Transaction deleted successfully");
      return res.status(204).end();
    } catch (error) {
      console.error("[API] Unexpected error in DELETE:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}