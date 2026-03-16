import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Plus, Trash2, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useBrokerConnections } from "@/hooks/use-broker-connections";

const BROKERS = [
  { name: "Binance", type: "exchange" },
  { name: "Bybit", type: "exchange" },
  { name: "MetaTrader 5", type: "metatrader" },
];

const BrokerConnectionPanel = () => {
  const { connections, loading, connectBroker, disconnectBroker, testConnection } = useBrokerConnections();
  const [showForm, setShowForm] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(BROKERS[0]);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [isTestnet, setIsTestnet] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!apiKey || !apiSecret) return;
    setSubmitting(true);
    try {
      await connectBroker({
        broker_name: selectedBroker.name,
        broker_type: selectedBroker.type,
        api_key: apiKey,
        api_secret: apiSecret,
        passphrase: passphrase || undefined,
        is_testnet: isTestnet,
        permissions: ["read", "trade"],
      });
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      setShowForm(false);
    } catch (e) {
      console.error("Connect failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await testConnection(id);
    } catch (e) {
      console.error("Test failed:", e);
    } finally {
      setTesting(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card gold-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Broker Connections</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(!showForm)}
          className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center"
        >
          <Plus className="w-4 h-4 text-primary" />
        </motion.button>
      </div>

      {/* Existing connections */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : connections.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No brokers connected</p>
      ) : (
        <div className="space-y-2 mb-3">
          {connections.map((conn) => (
            <div key={conn.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                {conn.is_active ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                )}
                <div>
                  <span className="text-xs text-foreground font-medium">{conn.broker_name}</span>
                  <span className="text-[9px] text-muted-foreground ml-2">
                    {conn.is_testnet ? "Testnet" : "Live"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleTest(conn.id)}
                  className="text-[10px] text-primary px-2 py-1 rounded bg-primary/10"
                >
                  {testing === conn.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Test"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => disconnectBroker(conn.id)}
                  className="p-1 rounded bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-3 border-t border-border">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Broker</label>
                <div className="flex gap-2">
                  {BROKERS.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => setSelectedBroker(b)}
                      className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all ${
                        selectedBroker.name === b.name
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary/50"
                  placeholder="Enter API key..."
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase mb-1 block">API Secret</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 pr-8 text-xs font-mono text-foreground outline-none focus:border-primary/50"
                    placeholder="Enter API secret..."
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {selectedBroker.name === "Bybit" && (
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase mb-1 block">Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary/50"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTestnet(!isTestnet)}
                  className={`w-8 h-4 rounded-full transition-all ${isTestnet ? "bg-primary" : "bg-secondary"}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-primary-foreground transition-transform ${isTestnet ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="text-[10px] text-muted-foreground">Testnet Mode</span>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleConnect}
                disabled={!apiKey || !apiSecret || submitting}
                className="w-full py-2.5 rounded-xl gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Connect Broker"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BrokerConnectionPanel;
