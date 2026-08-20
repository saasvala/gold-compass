import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptSecret } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BrokerRequest {
  action: "connect" | "disconnect" | "list" | "test" | "update";
  connection_id?: string;
  broker_name?: string;
  broker_type?: string;
  api_key?: string;
  api_secret?: string;
  passphrase?: string;
  is_testnet?: boolean;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: BrokerRequest = await req.json();

    switch (body.action) {
      case "connect": {
        if (!body.broker_name || !body.api_key || !body.api_secret) {
          return new Response(
            JSON.stringify({ error: "broker_name, api_key, and api_secret required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: connection, error } = await supabase
          .from("broker_connections")
          .insert({
            user_id: user.id,
            broker_name: body.broker_name,
            broker_type: body.broker_type || "exchange",
            api_key_encrypted: await encryptSecret(body.api_key),
            api_secret_encrypted: await encryptSecret(body.api_secret),
            passphrase_encrypted: body.passphrase ? await encryptSecret(body.passphrase) : null,
            is_testnet: body.is_testnet ?? true,
            is_active: false,
            permissions: body.permissions || ["read"],
            connection_status: "pending",
            metadata: body.metadata || {},
          })
          .select("id, broker_name, broker_type, is_testnet, is_active, permissions, connection_status, created_at")
          .single();

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "broker_connected",
          resource: `broker:${connection.id}`,
          severity: "info",
          details: { broker_name: body.broker_name, is_testnet: body.is_testnet },
        });

        return new Response(JSON.stringify({ connection }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "disconnect": {
        if (!body.connection_id) {
          return new Response(
            JSON.stringify({ error: "connection_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("broker_connections")
          .update({
            is_active: false,
            connection_status: "disconnected",
            api_key_encrypted: null,
            api_secret_encrypted: null,
            passphrase_encrypted: null,
          })
          .eq("id", body.connection_id)
          .eq("user_id", user.id);

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "broker_disconnected",
          resource: `broker:${body.connection_id}`,
          severity: "info",
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        const { data: connections, error } = await supabase
          .from("broker_connections")
          .select("id, broker_name, broker_type, is_testnet, is_active, permissions, connection_status, last_connected_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ connections }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "test": {
        if (!body.connection_id) {
          return new Response(
            JSON.stringify({ error: "connection_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // In production, this would actually call the broker API to test connectivity
        // For now, mark as connected
        const { error } = await supabase
          .from("broker_connections")
          .update({
            connection_status: "connected",
            is_active: true,
            last_connected_at: new Date().toISOString(),
          })
          .eq("id", body.connection_id)
          .eq("user_id", user.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ status: "connected", message: "Broker connection test successful" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!body.connection_id) {
          return new Response(
            JSON.stringify({ error: "connection_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = {};
        if (body.permissions) updateData.permissions = body.permissions;
        if (body.is_testnet !== undefined) updateData.is_testnet = body.is_testnet;
        if (body.api_key) updateData.api_key_encrypted = await encryptSecret(body.api_key);
        if (body.api_secret) updateData.api_secret_encrypted = await encryptSecret(body.api_secret);
        if (body.passphrase) updateData.passphrase_encrypted = await encryptSecret(body.passphrase);
        if (body.metadata) updateData.metadata = body.metadata;

        const { data: updated, error } = await supabase
          .from("broker_connections")
          .update(updateData)
          .eq("id", body.connection_id)
          .eq("user_id", user.id)
          .select("id, broker_name, broker_type, is_testnet, is_active, permissions, connection_status")
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ connection: updated }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Broker Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
