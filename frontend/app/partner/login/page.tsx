"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, ArrowRight, Loader2 } from "lucide-react";
import { setPartnerKey } from "@/lib/partner-api";
import { toast } from "sonner";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";

export default function PartnerLoginPage() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // Simulate API check
        await new Promise(resolve => setTimeout(resolve, 800));

        if (apiKey.length < 5) {
            throw new Error("Invalid API Key format");
        }

        setPartnerKey(apiKey);
        toast.success("เข้าสู่ระบบเรียบร้อย");
        router.push("/partner");
        
    } catch (error) {
        toast.error("API Key ไม่ถูกต้อง");
    } finally {
        setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setApiKey("demo_partner_key");
  };

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4"
      >
        <Card className="w-full max-w-md shadow-xl bg-card/60 backdrop-blur-xl border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-blue-500/10 p-4 rounded-full w-fit mb-2 ring-1 ring-blue-500/20">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Partner Portal
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                ระบบจัดการสำหรับพาร์ทเนอร์และหน่วยงาน
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">API Key Access</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="pk_live_xxxxxxxxxxxxx"
                    className="pl-9 h-11 bg-background/50 border-input/60 focus:bg-background transition-colors"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    type="password"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base shadow-lg shadow-blue-500/20" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Authenticating...
                    </>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <Button 
                    variant="outline" 
                    type="button" 
                    className="w-full h-11 bg-transparent border-dashed border-border/60 hover:bg-accent/50 hover:border-solid hover:border-primary/50 transition-all"
                    onClick={handleDemoLogin}
                >
                    Use Demo Key
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </AuroraBackground>
  );
}
