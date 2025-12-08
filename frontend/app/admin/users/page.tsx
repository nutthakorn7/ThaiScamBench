"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getUsers, createUser, type User } from "@/lib/admin-api";
import { Search, Loader2, User as UserIcon, Shield, Ban, CheckCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "partner" as "admin" | "partner"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  // Data Loading State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUsers(page, 20);
      setUsers(data.items);
    } catch (error) {
      console.error("Failed to load users", error);
      toast.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await createUser({
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      });
      setCreatedUser(user);
      toast.success("สร้างผู้ใช้งานสำเร็จ!");
      loadData(); // Refresh list background
    } catch (error: any) {
      console.error("Failed to create user", error);
      const msg = error.response?.data?.detail || "เกิดข้อผิดพลาดในการสร้างผู้ใช้";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (createdUser?.generated_password) {
      navigator.clipboard.writeText(createdUser.generated_password);
      setCopied(true);
      toast.success("คัดลอกรหัสผ่านแล้ว");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetDialog = () => {
    setIsAddUserOpen(false);
    setTimeout(() => {
        setCreatedUser(null);
        setNewUser({ email: "", name: "", role: "partner" });
    }, 300);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              จัดการรายชื่อผู้ใช้งานในระบบ
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                  {createdUser ? (
                    // Success View
                    <div className="py-2 space-y-4">
                        <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-6 w-6" />
                            สร้างบัญชีสำเร็จ
                        </DialogTitle>
                        <DialogDescription>
                            บัญชีผู้ใช้งานถูกสร้างเรียบร้อยแล้ว
                        </DialogDescription>
                        </DialogHeader>

                        <div className="bg-muted p-4 rounded-lg space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Email</Label>
                                <div className="font-medium">{createdUser.email}</div>
                            </div>

                            {createdUser.generated_password && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Password (Auto-generated)</Label>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-background px-2 py-1 rounded border font-mono text-lg font-bold flex-1 select-all">
                                            {createdUser.generated_password}
                                        </code>
                                        <Button size="icon" variant="outline" onClick={handleCopyPassword}>
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-2">
                                        ⚠️ โปรดบันทึกรหัสผ่านนี้ทันที ระบบจะไม่แสดงซ้ำอีก
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button className="w-full" onClick={resetDialog}>เสร็จสิ้น</Button>
                        </DialogFooter>
                    </div>
                  ) : (
                    // Form View
                    <>
                    <DialogHeader>
                      <DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle>
                      <DialogDescription>
                        สร้างบัญชีผู้ใช้ใหม่ ระบบจะสร้างรหัสผ่านและส่งทางอีเมลอัตโนมัติ
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddUser} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">ชื่อ-นามสกุล (Optional)</Label>
                    <Input
                      id="name"
                      placeholder="Somchai Jai-dee"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="partner"
                          checked={newUser.role === "partner"}
                          onChange={() => setNewUser({ ...newUser, role: "partner" })}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span>User / Partner</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="admin"
                          checked={newUser.role === "admin"}
                          onChange={() => setNewUser({ ...newUser, role: "admin" })}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span>Administrator</span>
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      สร้างบัญชี
                    </Button>
                  </DialogFooter>
                </form>
                </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Registered Users</CardTitle>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input 
                  placeholder="ค้นหาชื่อ หรือ Email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button size="icon" variant="ghost">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {user.id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">{user.name || "-"}</div>
                      </TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                            <Shield className="h-3 w-3 mr-1" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.status === 'active' ? (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" /> Active
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 text-sm">
                            <Ban className="h-4 w-4 mr-1" /> Banned
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_login ? new Date(user.last_login).toLocaleString('th-TH') : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <div className="text-sm font-medium">Page {page}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
