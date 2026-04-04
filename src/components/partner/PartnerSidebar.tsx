import {
  LayoutDashboard, Calendar, User, FileText, Clock, Receipt,
  FolderOpen, Bell, HelpCircle, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/partner/dashboard", icon: LayoutDashboard },
  { title: "Schedule", url: "/partner/schedule", icon: Calendar },
  { title: "My Profile", url: "/partner/profile", icon: User },
  { title: "Contract", url: "/partner/contract", icon: FileText },
  { title: "Work History", url: "/partner/work-history", icon: Clock },
  { title: "Payslips", url: "/partner/payslips", icon: Receipt },
  { title: "Documents", url: "/partner/documents", icon: FolderOpen },
  { title: "Notifications", url: "/partner/notifications", icon: Bell },
  { title: "Support", url: "/partner/support", icon: HelpCircle },
];

export function PartnerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
            AM
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-sm text-sidebar-foreground">AM:365</p>
              <p className="text-xs text-sidebar-foreground/60">Partner Portal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup defaultOpen>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink
                      to={item.url}
                      end
                      className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/login" className="text-sidebar-foreground/50 hover:text-destructive">
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Sign Out</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
