import {
  LayoutDashboard, Users, ShieldCheck, Calendar, Building2, Truck,
  DollarSign, FileText, Receipt, BarChart3, Settings, ScrollText,
  UserCog, MessageSquare, Shield, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/portal/dashboard", icon: LayoutDashboard },
  { title: "Partners", url: "/portal/partners", icon: Users },
  { title: "Verification", url: "/portal/verification", icon: ShieldCheck },
  { title: "Scheduling", url: "/portal/scheduling", icon: Calendar },
  { title: "Customers", url: "/portal/customers", icon: Building2 },
  { title: "Delivery Data", url: "/portal/delivery-data", icon: Truck },
];

const financeItems = [
  { title: "Payroll", url: "/portal/payroll", icon: DollarSign },
  { title: "Invoices", url: "/portal/invoices", icon: FileText },
  { title: "Payslips", url: "/portal/payslips", icon: Receipt },
  { title: "Reports", url: "/portal/reports", icon: BarChart3 },
];

const systemItems = [
  { title: "Settings", url: "/portal/settings", icon: Settings },
  { title: "Audit Log", url: "/portal/audit-log", icon: ScrollText },
  { title: "Users", url: "/portal/users", icon: UserCog },
  { title: "Messages", url: "/portal/messages", icon: MessageSquare },
  { title: "Compliance", url: "/portal/compliance", icon: Shield },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup defaultOpen>
      <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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
  );

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
              <p className="text-xs text-sidebar-foreground/60">Control Panel</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Operations", mainItems)}
        {renderGroup("Finance", financeItems)}
        {renderGroup("System", systemItems)}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/portal/login" className="text-sidebar-foreground/50 hover:text-destructive">
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
