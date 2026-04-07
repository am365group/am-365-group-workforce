import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, Plus, Trash2, Shield, CheckCircle, Loader2, Edit2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type StaffUser = {
  user_id: string;
  email: string;
  display_name: string;
  role: "admin" | "controller" | "verifier";
  created_at: string;
  last_sign_in_at: string | null;
};

const ROLE_CONFIG: Record<string, { label: string; color: string; permissions: string }> = {
  admin:      { label: "Admin",      color: "default",   permissions: "Full access" },
  controller: { label: "Controller", color: "secondary", permissions: "Payroll, Invoices, Reports" },
  verifier:   { label: "Verifier",   color: "secondary", permissions: "Verification, Documents" },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add user form
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "controller" | "verifier">("verifier");
  const [newPassword, setNewPassword] = useState("");

  // Edit role
  const [editRole, setEditRole] = useState<"admin" | "controller" | "verifier">("verifier");

  const { toast } = useToast();

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_staff_users");
      if (error) throw error;
      setUsers((data as StaffUser[]) || []);
    } catch (err: any) {
      toast({ title: "Error loading users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newEmail || !newPassword || !newRole) return;
    setActionLoading(true);
    try {
      // Create auth user via Edge Function (needs admin API)
      const { data, error } = await supabase.functions.invoke("manage-staff-user", {
        body: { action: "create", email: newEmail, password: newPassword, displayName: newDisplayName || newEmail.split("@")[0], role: newRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "User created", description: `${newEmail} has been added as ${newRole}.` });
      setShowAddDialog(false);
      setNewEmail(""); setNewPassword(""); setNewDisplayName(""); setNewRole("verifier");
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error creating user", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditRole = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("set_staff_role", {
        p_user_id: selectedUser.user_id,
        p_role: editRole,
      });
      if (error) throw error;
      toast({ title: "Role updated", description: `${selectedUser.display_name} is now ${editRole}.` });
      setShowEditDialog(false);
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error updating role", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("remove_staff_role", {
        p_user_id: selectedUser.user_id,
      });
      if (error) throw error;
      toast({ title: "User removed", description: `${selectedUser.display_name} has been removed from staff.` });
      setShowDeleteDialog(false);
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error removing user", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const roleStats = ["admin", "controller", "verifier"].map(role => ({
    role,
    count: users.filter(u => u.role === role).length,
    ...ROLE_CONFIG[role],
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-base text-muted-foreground mt-1">Manage staff accounts, roles, and access permissions</p>
        </div>
        <Button size="lg" onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Staff User
        </Button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-3 gap-5">
        {roleStats.map(s => (
          <Card key={s.role}>
            <CardContent className="p-5 text-center">
              <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold">{s.count}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}s</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserCog className="h-5 w-5 text-primary" /> Staff Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">No staff users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Last Sign-in</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.user_id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {u.display_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{u.display_name}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                        <Shield className="h-3 w-3" />
                        {ROLE_CONFIG[u.role]?.label ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ROLE_CONFIG[u.role]?.permissions ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString("sv-SE")
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("sv-SE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline" size="sm"
                          onClick={() => { setSelectedUser(u); setEditRole(u.role); setShowEditDialog(true); }}
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Role
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setSelectedUser(u); setShowDeleteDialog(true); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff User</DialogTitle>
            <DialogDescription>Create a new AM:365 staff account and assign a role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input
                type="email" placeholder="staff@am365group.se"
                value={newEmail} onChange={e => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input
                placeholder="Full name"
                value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Temporary password</Label>
              <Input
                type="password" placeholder="Min 8 characters"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                  <SelectItem value="controller">Controller — Payroll, Invoices, Reports</SelectItem>
                  <SelectItem value="verifier">Verifier — Verification, Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={actionLoading || !newEmail || !newPassword}>
              {actionLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>{selectedUser?.display_name} · {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>New role</Label>
            <Select value={editRole} onValueChange={v => setEditRole(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — Full access</SelectItem>
                <SelectItem value="controller">Controller — Payroll, Invoices, Reports</SelectItem>
                <SelectItem value="verifier">Verifier — Verification, Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditRole} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Remove Staff Access
            </DialogTitle>
            <DialogDescription>
              This will revoke <strong>{selectedUser?.display_name}</strong>'s staff role and portal access.
              Their auth account remains but they won't be able to log into the admin portal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveUser} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
              Remove Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
