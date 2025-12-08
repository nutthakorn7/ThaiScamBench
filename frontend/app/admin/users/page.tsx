"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { PremiumTable } from "@/components/admin/PremiumTable";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword, type User } from "../../../lib/admin-api";
import { 
    Users, 
    UserPlus, 
    Shield, 
    Ban, 
    CheckCircle, 
    MoreHorizontal, 
    Trash, 
    Key, 
    Copy, 
    Check, 
    Loader2, 
    Mail 
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UsersPage() {
  // UI State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
      role: "all",
      status: "all",
      search: ""
  });

  const pageSize = 20;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        loadData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [page, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUsers(page, pageSize, filters.search, filters.role, filters.status);
      setUsers(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to load users", error);
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "partner" as "admin" | "partner"
  });

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
      toast.success("User created successfully");
      loadData();
    } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.detail || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setIsAddUserOpen(false);
    setTimeout(() => {
        setCreatedUser(null);
        setNewUser({ email: "", name: "", role: "partner" });
    }, 300);
  };

  const handleCopyPassword = () => {
     if (createdUser?.generated_password) {
       navigator.clipboard.writeText(createdUser.generated_password);
       setCopied(true);
       toast.success("Password copied");
       setTimeout(() => setCopied(false), 2000);
     }
  };

   // Table Columns Definition
   const columns = [
    {
      header: "User",
      cell: (user: User) => (
        <div className="flex items-center gap-3">
             <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                <AvatarFallback>{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
             </Avatar>
             <div className="flex flex-col">
                <span className="font-medium text-sm text-foreground">{user.name || "No Name"}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {user.email}
                </span>
             </div>
        </div>
      ),
    },
    {
      header: "Role",
      accessorKey: "role" as keyof User,
      cell: (user: User) => (
        user.role === 'admin' ? (
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Shield className="h-3 w-3 mr-1" /> Admin
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                Partner
            </Badge>
        )
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active" as keyof User,
      cell: (user: User) => (
        user.is_active ? (
            <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400">
                Active
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20">
                Banned
            </Badge>
        )
      ),
    },
    {
      header: "Last Login",
      accessorKey: "last_login" as keyof User,
      cell: (user: User) => (
        <span className="text-xs text-muted-foreground">
            {user.last_login ? format(new Date(user.last_login), "PP p") : "Never"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (user: User) => (
        <div className="flex justify-end">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => {
                        await updateUser(user.id, { is_active: !user.is_active });
                        toast.success(user.is_active ? "User banned" : "User activated");
                        loadData();
                    }}>
                        {user.is_active ? (
                            <><Ban className="mr-2 h-4 w-4 text-red-500" /> Ban User</>
                        ) : (
                            <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Activate User</>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                         if(confirm("Reset password?")) {
                             await resetUserPassword(user.id);
                             toast.success("Password reset email sent");
                         }
                    }}>
                        <Key className="mr-2 h-4 w-4" /> Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={async () => {
                         if(confirm("Delete user permanently?")) {
                             await deleteUser(user.id);
                             toast.success("User deleted");
                             loadData();
                         }
                    }}>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
        </div>
      ),
    },
   ];

  return (
    <AdminLayout>
      <PageHeader 
        title="User Management" 
        description="Manage system access, roles, and account status."
        icon={Users}
      >
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                    <UserPlus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                {createdUser ? (
                    <div className="space-y-4 pt-4">
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold">Account Created!</h3>
                            <p className="text-muted-foreground text-sm">The user account is ready.</p>
                        </div>
                        
                        <div className="bg-muted p-4 rounded-lg space-y-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Email</Label>
                                <div className="font-medium">{createdUser.email}</div>
                            </div>
                            {createdUser.generated_password && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Generated Password</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="flex-1 bg-background border rounded px-3 py-2 font-mono text-lg font-bold tracking-wider select-all">
                                            {createdUser.generated_password}
                                        </code>
                                        <Button size="icon" variant="outline" onClick={handleCopyPassword}>
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                        <Shield className="h-3 w-3" /> Save this password now. It won't be shown again.
                                    </p>
                                </div>
                            )}
                        </div>
                        <Button className="w-full" onClick={resetDialog}>Done</Button>
                    </div>
                ) : (
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>Add a new administrator or partner account.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                             <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="user@example.com" 
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                />
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="name">Full Name (Optional)</Label>
                                <Input 
                                    id="name" 
                                    placeholder="John Doe" 
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                />
                             </div>
                             <div className="space-y-2">
                                <Label>Role Selection</Label>
                                <div className="grid grid-cols-2 gap-4">
                                     <label className={`
                                        flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
                                        ${newUser.role === 'partner' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}
                                     `}>
                                        <Users className="h-6 w-6 mb-2 text-muted-foreground" />
                                        <span className="font-medium text-sm">Partner</span>
                                        <input type="radio" className="hidden" 
                                            name="role" value="partner" 
                                            checked={newUser.role === 'partner'}
                                            onChange={() => setNewUser({...newUser, role: 'partner'})}
                                        />
                                     </label>
                                     <label className={`
                                        flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
                                        ${newUser.role === 'admin' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}
                                     `}>
                                        <Shield className="h-6 w-6 mb-2 text-muted-foreground" />
                                        <span className="font-medium text-sm">Admin</span>
                                        <input type="radio" className="hidden" 
                                            name="role" value="admin" 
                                            checked={newUser.role === 'admin'}
                                            onChange={() => setNewUser({...newUser, role: 'admin'})}
                                        />
                                     </label>
                                </div>
                             </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
      </PageHeader>

      <PremiumTable 
        data={users}
        columns={columns}
        totalItems={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        loading={loading}
        searchable={true}
        onSearch={(term) => setFilters(prev => ({ ...prev, search: term }))}
        searchPlaceholder="Search by name or email..."
        emptyMessage="No users found matching your criteria."
        filters={
            <div className="flex gap-2">
                 <Select value={filters.role} onValueChange={(val) => setFilters(prev => ({...prev, role: val}))}>
                    <SelectTrigger className="w-[130px] bg-background/50 backdrop-blur-sm">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="partner">Partners</SelectItem>
                    </SelectContent>
                 </Select>
                 <Select value={filters.status} onValueChange={(val) => setFilters(prev => ({...prev, status: val}))}>
                    <SelectTrigger className="w-[130px] bg-background/50 backdrop-blur-sm">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                 </Select>
            </div>
        }
      />
    </AdminLayout>
  );
}
