export type ContractTemplate = {
  id: string;
  name: string;
  description: string;
  generate: (app: {
    first_name: string;
    last_name: string;
    personal_number?: string;
    email: string;
    phone: string;
    street_address: string;
    apartment?: string | null;
    post_code: string;
    city: string;
    transport: string;
    hourly_rate?: number | null;
    delivery_bonus?: number | null;
  }) => string;
};

const fmt = (n?: number | null, fallback = "[RATE]") =>
  n ? `${n.toFixed(2)} SEK` : fallback;

export const contractTemplates: ContractTemplate[] = [
  {
    id: "standard_eor",
    name: "Standard EoR Agreement",
    description: "Full employment contract for Wolt delivery partners",
    generate: (app) => `<h1>EMPLOYMENT CONTRACT</h1>
<p><strong>AM:365 GROUP AB</strong> — Employer of Record Agreement</p>
<hr/>

<h2>PARTIES</h2>
<p><strong>Employer:</strong> AM365 Group AB, Stockholm, Sweden (Org. Nr: 559292-4798)</p>
<p><strong>Employee:</strong> ${app.first_name} ${app.last_name}</p>
<p><strong>Address:</strong> ${app.street_address}${app.apartment ? `, ${app.apartment}` : ""}, ${app.post_code} ${app.city}</p>
<p><strong>Email:</strong> ${app.email}</p>
<p><strong>Phone:</strong> ${app.phone}</p>
<p><strong>Transport Mode:</strong> ${app.transport.charAt(0).toUpperCase() + app.transport.slice(1)}</p>

<hr/>

<h2>1. POSITION AND EMPLOYMENT TYPE</h2>
<p>The Employee is engaged as a <strong>Delivery Partner</strong> under the Employer of Record (EoR) arrangement with AM:365 Group AB.</p>
<p><strong>Employment Type:</strong> Variable hours (anställning med varierande arbetstid)</p>
<p><strong>Start Date:</strong> [To be confirmed upon signing]</p>

<h2>2. COMPENSATION</h2>
<p><strong>Hourly Rate:</strong> ${fmt(app.hourly_rate)} per hour (before tax)</p>
<p><strong>Delivery Bonus:</strong> ${fmt(app.delivery_bonus)} per completed delivery</p>
<p>Holiday pay (semesterlön) is paid at 12% of gross salary per Swedish law.</p>

<h2>3. EMPLOYER CONTRIBUTIONS</h2>
<p>AM:365 Group AB pays all statutory employer contributions (arbetsgivaravgifter) at 31.42% on top of gross salary, as required by Swedish law.</p>

<h2>4. BENEFITS</h2>
<ul>
  <li>Occupational pension (tjänstepension) from day one</li>
  <li>Accident insurance (TFA) via Fora</li>
  <li>Health insurance (Sjukvårdsförsäkring)</li>
  <li>Sick pay (sjuklön) per Swedish law (80% of salary from day 2–14)</li>
  <li>Parental leave (föräldraledighet) rights</li>
</ul>

<h2>5. WORKING CONDITIONS</h2>
<p>The Employee performs delivery services through Wolt Sweden and other platform partners as assigned by AM:365 Group AB. Scheduling is coordinated through the AM:365 Workforce Platform.</p>
<p>The Employee must maintain valid identification, work permits, and any required vehicle documentation throughout the engagement.</p>

<h2>6. OBLIGATIONS</h2>
<ul>
  <li>Maintain active transport equipment in safe working condition</li>
  <li>Report all hours worked accurately through the platform</li>
  <li>Comply with Wolt's partner code of conduct</li>
  <li>Notify AM:365 of any change in personal or banking details within 5 business days</li>
</ul>

<h2>7. TERMINATION</h2>
<p><strong>Notice period:</strong> 1 month for both parties (after 6 months employment — per LAS §11)</p>
<p>During probationary period (first 6 months): 2 weeks notice by either party.</p>
<p>Immediate termination may occur for gross misconduct as defined by Swedish labour law.</p>

<h2>8. GDPR & DATA PROTECTION</h2>
<p>Personal data (including personnummer and bank details) is processed in accordance with GDPR and stored in EU/EEA (Stockholm, Sweden). For full details see our Privacy Policy at <strong>am365group.se/privacy</strong>.</p>
<p>Data is retained for the duration required by law: payslips 7 years (Bokföringslagen), identity documents 24 months post-engagement.</p>

<h2>9. GOVERNING LAW & DISPUTES</h2>
<p>This contract is governed by Swedish law. Disputes shall first be referred to mediation. If unresolved, the competent court is Stockholms Tingsrätt.</p>

<hr/>

<h2>SIGNATURES</h2>
<p><strong>On behalf of AM:365 Group AB:</strong></p>
<p>Name: ___________________________ &nbsp;&nbsp; Title: ___________________________</p>
<p>Signature: _______________________ &nbsp;&nbsp; Date: ___________________________</p>
<br/>
<p><strong>Employee: ${app.first_name} ${app.last_name}</strong></p>
<p>Signature: _______________________ &nbsp;&nbsp; Date: ___________________________</p>
<br/>
<p><em>This contract is valid when signed by both parties. Electronic signatures (via Scrive) are legally binding under eIDAS regulation.</em></p>`,
  },
  {
    id: "short_term",
    name: "Short-Term / Project Agreement",
    description: "Simplified contract for short engagements under 3 months",
    generate: (app) => `<h1>SHORT-TERM EMPLOYMENT AGREEMENT</h1>
<p><strong>AM:365 GROUP AB</strong> — Employer of Record</p>
<hr/>

<h2>PARTIES</h2>
<p><strong>Employer:</strong> AM365 Group AB (Org. Nr: 559292-4798)</p>
<p><strong>Employee:</strong> ${app.first_name} ${app.last_name}, ${app.email}</p>

<h2>ENGAGEMENT</h2>
<p><strong>Role:</strong> Delivery Partner (Wolt Sweden)</p>
<p><strong>Duration:</strong> Fixed-term, max 3 months. Start: [date]. End: [date].</p>
<p><strong>Transport:</strong> ${app.transport.charAt(0).toUpperCase() + app.transport.slice(1)}</p>

<h2>COMPENSATION</h2>
<p>Hourly Rate: ${fmt(app.hourly_rate)} &nbsp;|&nbsp; Delivery Bonus: ${fmt(app.delivery_bonus)} per delivery</p>
<p>Holiday pay 12% included. All employer contributions (31.42%) paid by AM:365.</p>

<h2>CONDITIONS</h2>
<p>Employee acknowledges they have read and agree to AM:365's Code of Conduct, Privacy Policy, and Platform Rules. Swedish law applies. Wolt's partner terms also apply during active shifts.</p>

<hr/>

<p><strong>Employer signature:</strong> _______________________ Date: ________</p>
<p><strong>Employee signature (${app.first_name} ${app.last_name}):</strong> _______________________ Date: ________</p>`,
  },
  {
    id: "renewal",
    name: "Contract Renewal",
    description: "Renewal addendum for existing partners",
    generate: (app) => `<h1>CONTRACT RENEWAL ADDENDUM</h1>
<p><strong>AM:365 GROUP AB</strong> — Employment Contract Renewal</p>
<hr/>

<p>This addendum renews the employment agreement between <strong>AM365 Group AB</strong> (Org. Nr: 559292-4798) and <strong>${app.first_name} ${app.last_name}</strong> (${app.email}).</p>

<h2>UPDATED TERMS</h2>
<p><strong>Renewal effective date:</strong> [date]</p>
<p><strong>Hourly Rate:</strong> ${fmt(app.hourly_rate)}</p>
<p><strong>Delivery Bonus:</strong> ${fmt(app.delivery_bonus)} per completed delivery</p>
<p>All other terms from the original employment contract remain unchanged.</p>

<h2>REASON FOR RENEWAL</h2>
<p>[Continued engagement with Wolt Sweden / Updated rate per collective agreement review / Other: ___________]</p>

<hr/>

<p><strong>Employer:</strong> _______________________ Date: ________</p>
<p><strong>Employee (${app.first_name} ${app.last_name}):</strong> _______________________ Date: ________</p>`,
  },
];
