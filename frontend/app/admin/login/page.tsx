"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Lock } from "lucide-react";
import { setAdminToken } from "@/lib/auth";
import { toast } from "sonner";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError("กรุณาใส่ Admin Token");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Simple bypass - check this FIRST
      if (token === "admin123" || token === "thaiscam2024") {
        setAdminToken(token);
        toast.success("Login สำเร็จ!", {
          description: "เข้าสู่ระบบด้วยรหัสสำรอง"
        });
        router.push('/admin');
        return;
      }

      // 2. Normal backend validation
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (response.ok) {
        setAdminToken(token.trim());
        toast.success("Login สำเร็จ!", {
          description: "กำลังเข้าสู่ระบบ Admin"
        });
        router.push('/admin');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Token ไม่ถูกต้อง');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || "Token ไม่ถูกต้อง กรุณาลองใหม่");
      setAdminToken(""); // Clear invalid token
    } finally {
      setLoading(false);
    }
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
            <div className="mx-auto bg-red-500/10 p-4 rounded-full w-fit mb-2 ring-1 ring-red-500/20">
              <Lock className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400">
                Admin Portal
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                ระบบจัดการส่วนกลางสำหรับผู้ดูแลระบบ
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token" className="text-sm font-medium ml-1">Secret Token Access</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="token"
                    type="password"
                    placeholder="Bearer token..."
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    className="pl-9 h-11 bg-background/50 border-input/60 focus:bg-background transition-colors font-mono"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 font-medium rounded-full bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700 hover:shadow-red-600/40 transition-all" 
                disabled={loading || !token.trim()}
              >
                {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ Admin"}
              </Button>

              <div className="text-xs text-center text-muted-foreground pt-2">
                <p>Protected Area • Unauthorized Access Prohibited</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </AuroraBackground>
  );
}
