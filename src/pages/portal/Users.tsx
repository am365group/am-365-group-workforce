import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, Plus, MoreHorizontal, Shield } from "lucide-react";

const users = [
  { name: "Admin User", email: "admin@am365group.se", role: "Admin", status: "Active", lastLogin: "Today 14:32" },
  { name: "Maria Svensson", email: "maria@am365group.se", role: "Controller", status: "Active", lastLogin: "Today 13:15" },
  { name: "Peter Nilsson", email: "peter@am365group.se", role: "Verifier", status: "Active", lastLogin: "Yesterday" },
  { name: "Eva Karlsson", email: "eva@am365group.se", role: "Controller", status: "Inactive", lastLogin: "Mar 25" },
];

export default function AdminUsers() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage staff accounts and roles</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Add User</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last Login</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {u.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div><p className="font-medium text-sm">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={u.role === "Admin" ? "default" : "secondary"} className="flex items-center gap-1 w-fit"><Shield className="h-3 w-3" />{u.role}</Badge></TableCell>
                  <TableCell><Badge variant={u.status === "Active" ? "default" : "destructive"}>{u.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.lastLogin}</TableCell>
                  <TableCell><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
