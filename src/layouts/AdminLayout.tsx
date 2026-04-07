import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Bell, LogOut, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLayout() {
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("Staff");
  const [adminInitials, setAdminInitials] = useState("A");
  const navigate = useNavigate();

  useEffect(() => {
    loadAdminInfo();
  }, []);

  const loadAdminInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/portal/login");
        return;
      }
      // Get display name from email
      const emailName = user.email?.split("@")[0] ?? "Admin";
      const displayName = user.user_metadata?.display_name ?? emailName;
      setAdminName(displayName);
      setAdminInitials(displayName.slice(0, 2).toUpperCase());

      // Get role from user_roles
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleRow?.role) {
        const roleLabel: Record<string, string> = {
          admin: "Administrator",
          controller: "Controller",
          verifier: "Verifier",
        };
        setAdminRole(roleLabel[roleRow.role] ?? roleRow.role);
      } else {
        // Not a staff user — redirect to login
        await supabase.auth.signOut();
        navigate("/portal/login");
      }
    } catch {
      navigate("/portal/login");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/portal/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8 w-64 h-9" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 ml-1 h-9 px-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {adminInitials}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium leading-none">{adminName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{adminRole}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-xs text-muted-foreground font-medium">Signed in as</div>
                  <div className="px-3 pb-2 text-sm font-medium truncate">{adminName}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
