"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";
import { setAdminToken } from "@/lib/auth";
import { toast } from "sonner";

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
      // Save token
      setAdminToken(token.trim());
      
      // Test token by making a simple API call
      const response = await fetch('https://api.thaiscam.zcr.ai/admin/stats/summary?days=7', {
        headers: {
          'Authorization': `Bearer ${token.trim()}`
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      toast.success("Login สำเร็จ!", {
        description: "กำลังเข้าสู่ระบบ Admin"
      });

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError("Token ไม่ถูกต้อง กรุณาลองใหม่");
      setAdminToken(""); // Clear invalid token
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <p className="text-sm text-muted-foreground">
            ใส่ Admin Token เพื่อเข้าสู่ระบบ
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Admin Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Bearer token จาก backend"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError("");
                }}
                disabled={loading}
                className="font-mono"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading || !token.trim()}>
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </Button>

            <div className="text-xs text-center text-muted-foreground">
              <p>Token ถูกเก็บไว้ใน browser localStorage</p>
              <p className="mt-1">สำหรับผู้ดูแลระบบเท่านั้น</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
