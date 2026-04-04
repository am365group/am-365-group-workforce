import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, Plus, MoreHorizontal, Shield, Mail, Clock, CheckCircle, XCircle } from "lucide-react";

const users = [
  { name: "Admin User", email: "admin@am365group.se", role: "Admin", status: "Active", lastLogin: "Today 14:32", permissions: "Full Access", department: "Management" },
  { name: "Maria Svensson", email: "maria@am365group.se", role: "Controller", status: "Active", lastLogin: "Today 13:15", permissions: "Payroll, Partners, Reports", department: "Finance" },
  { name: "Peter Nilsson", email: "peter@am365group.se", role: "Verifier", status: "Active", lastLogin: "Yesterday", permissions: "Verification, Documents", department: "Compliance" },
  { name: "Eva Karlsson", email: "eva@am365group.se", role: "Controller", status: "Inactive", lastLogin: "Mar 25", permissions: "Payroll, Partners", department: "Finance" },
  { name: "Johan Berg", email: "johan.b@am365group.se", role: "Scheduler", status: "Active", lastLogin: "Today 12:00", permissions: "Scheduling, Partners", department: "Operations" },
  { name: "Sara Ahmed", email: "sara@am365group.se", role: "Verifier", status: "Active", lastLogin: "Today 10:45", permissions: "Verification, Documents", department: "Compliance" },
];

const roleStats = [
  { role: "Admin", count: 1, color: "text-primary" },
  { role: "Controller", count: 2, color: "text-info" },
  { role: "Verifier", count: 2, color: "text-warning" },
  { role: "Scheduler", count: 1, color: "text-muted-foreground" },
];

export default function AdminUsers() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-base text-muted-foreground mt-1">Manage staff accounts, roles, and permissions</p>
        </div>
        <Button size="lg"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {roleStats.map((stat) => (
          <Card key={stat.role}>
            <CardContent className="p-5 text-center">
              <Shield className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
              <p className="text-3xl font-bold">{stat.count}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.role}s</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm">User</TableHead>
                <TableHead className="text-sm">Role</TableHead>
                <TableHead className="text-sm">Department</TableHead>
                <TableHead className="text-sm">Permissions</TableHead>
                <TableHead className="text-sm">Status</TableHead>
                <TableHead className="text-sm">Last Login</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, i) => (
                <TableRow key={i} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {u.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "Admin" ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                      <Shield className="h-3 w-3" />{u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{u.department}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{u.permissions}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === "Active" ? "default" : "destructive"} className="flex items-center gap-1 w-fit">
                      {u.status === "Active" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.lastLogin}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
