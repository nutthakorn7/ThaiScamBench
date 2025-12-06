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
        <Card className="w-full max-w-4xl shadow-2xl bg-card/95 backdrop-blur-xl border-2 border-border">          <CardHeader className="text-center space-y-4 pb-5 pt-6">
            {/* Icon Container - Smaller */}
            <div className="mx-auto bg-blue-600/10 dark:bg-blue-600/20 p-3 rounded-xl w-fit mb-1 ring-2 ring-blue-600/20">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              {/* HUGE Heading */}
              <CardTitle className="text-5xl md:text-6xl font-black mb-3 text-slate-900 dark:text-white">
                Partner Portal
              </CardTitle>
              <CardDescription className="mt-2 text-xl md:text-2xl text-muted-foreground">
                ระบบจัดการสำหรับพาร์ทเนอร์และหน่วยงาน
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-10 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <label className="text-lg font-semibold">API Key Access</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="pk_live_xxxxxxxxxxxxx"
                    className="h-16 pl-12 pr-4 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 focus-visible:ring-4 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 transition-all"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    type="password"
                    aria-label="API Key สำหรับเข้าสู่ระบบ"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full h-16 text-xl font-bold rounded-2xl bg-blue-700 hover:bg-blue-800 text-white shadow-2xl hover:scale-105 transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-6 w-6 mr-2" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-6 w-6" />
                      เข้าสู่ระบบ
                    </>
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
