import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, Building2 } from "lucide-react";

export default function PartnerContract() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Contract</h1>
        <p className="text-muted-foreground">Your current employment agreement</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Partner Agreement</CardTitle>
              <p className="text-sm text-muted-foreground">Contract #AM365-2024-0142</p>
            </div>
          </div>
          <Badge>Active</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</p>
              <p className="font-semibold text-sm">January 15, 2024</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date</p>
              <p className="font-semibold text-sm">Ongoing</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> Employer</p>
              <p className="font-semibold text-sm">AM365 Group AB</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-semibold text-sm">EoR – Delivery Partner</p>
            </div>
          </div>
          <div className="p-4 rounded-lg border space-y-2 text-sm">
            <p className="font-medium">Key Terms</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Hourly rate: 180 SEK/hour</li>
              <li>Overtime: 1.5x after 40h/week</li>
              <li>Notice period: 1 month</li>
              <li>Pension contribution: 4.5%</li>
              <li>Insurance: Included via AM365 collective agreement</li>
            </ul>
          </div>
          <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> Download Contract PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
}
