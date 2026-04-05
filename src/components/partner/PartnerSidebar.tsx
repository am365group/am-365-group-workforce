import {
  LayoutDashboard, Calendar, User, FileText, Clock, Receipt,
  FolderOpen, Bell, HelpCircle, LogOut, Lock, AlertCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";

const navItems = [
  { title: "Dashboard", url: "/partner/dashboard", icon: LayoutDashboard, requiresVerified: false },
  { title: "Schedule", url: "/partner/schedule", icon: Calendar, requiresVerified: true },
  { title: "My Profile", url: "/partner/profile", icon: User, requiresVerified: true },
  { title: "Contract", url: "/partner/contract", icon: FileText, requiresVerified: true },
  { title: "Work History", url: "/partner/work-history", icon: Clock, requiresVerified: true },
  { title: "Payslips", url: "/partner/payslips", icon: Receipt, requiresVerified: true },
  { title: "Documents", url: "/partner/documents", icon: FolderOpen, requiresVerified: false },
  { title: "Notifications", url: "/partner/notifications", icon: Bell, requiresVerified: false },
  { title: "Support", url: "/partner/support", icon: HelpCircle, requiresVerified: false },
];

export function PartnerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppStatus = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          setIsLoading(false);
          return;
        }

        const { data: app, error: appError } = await supabase
          .from("partner_applications")
          .select("status")
          .eq("email", data.user.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!appError && app) {
          setAppStatus(app.status);
        }
      } catch (e) {
        console.error("Error fetching app status:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppStatus();
  }, []);

  const isVerified = appStatus === "email_verified" || appStatus === "under_review" || appStatus === "verified" || appStatus === "contract_sent" || appStatus === "contract_signed" || appStatus === "active";
  const isIncomplete = appStatus === "pending" || appStatus === "email_verified";

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
        {!collapsed && isIncomplete && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              <strong>Onboarding in progress:</strong> Please upload ID and documents to proceed.
            </AlertDescription>
          </Alert>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isDisabled = item.requiresVerified && !isVerified;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      disabled={isDisabled}
                      className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {isDisabled ? (
                        <div className="flex items-center gap-2 text-sidebar-foreground/70 cursor-not-allowed">
                          {isDisabled ? <Lock className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}
                          <span className="text-sm">{item.title}</span>
                        </div>
                      ) : (
                        <NavLink
                          to={item.url}
                          end
                          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
