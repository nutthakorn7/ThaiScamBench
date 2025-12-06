"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, ArrowRight, Loader2 } from "lucide-react";
import { setPartnerKey } from "@/lib/partner-api";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Partner Portal</CardTitle>
          <CardDescription>
            เข้าสู่ระบบสำหรับพาร์ทเนอร์ธุรกิจ (B2B)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="sk_live_..."
                  className="pl-9"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Access Portal"}
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>

            <Button 
                variant="outline" 
                type="button" 
                className="w-full"
                onClick={handleDemoLogin}
            >
                Use Demo Key
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
