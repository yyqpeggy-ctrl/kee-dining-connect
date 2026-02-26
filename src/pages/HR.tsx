import { motion } from "framer-motion";
import { Users, UserPlus, Clock, Award, Phone, MoreHorizontal, Search, TrendingUp, Zap, Stamp, AlertTriangle, CalendarDays, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import StoreIndicator from "@/components/StoreIndicator";
import { useStore } from "@/contexts/StoreContext";
import { useState } from "react";
import PayrollAutomation from "@/components/hr/PayrollAutomation";
import WorkPermitArchive from "@/components/hr/WorkPermitArchive";

interface Employee {
  id: string;
  nameZh: string;
  nameEn: string;
  roleZh: string;
  roleEn: string;
  departmentKey: string;
  storeZh: string;
  storeEn: string;
  phone: string;
  status: "active" | "leave" | "resigned";
  salary: number;
  attendance: number;
  avatar: string;
  nationality: string;
  visa?: {
    type: string;
    number: string;
    issueDate: string;
    expiryDate: string;
    status: "valid" | "expiring" | "expired" | "pending";
    notes?: string;
  };
}

const employees: Employee[] = [
  { id: "E001", nameZh: "张明", nameEn: "Zhang Ming", roleZh: "厨师长", roleEn: "Head Chef", departmentKey: "kitchen", storeZh: "总店", storeEn: "Main", phone: "138****1234", status: "active", salary: 12000, attendance: 98, avatar: "张", nationality: "中国" },
  { id: "E002", nameZh: "李芳", nameEn: "Li Fang", roleZh: "前厅经理", roleEn: "FOH Manager", departmentKey: "frontOfHouse", storeZh: "总店", storeEn: "Main", phone: "139****5678", status: "active", salary: 10000, attendance: 100, avatar: "李", nationality: "中国" },
  { id: "E003", nameZh: "王强", nameEn: "Wang Qiang", roleZh: "服务员", roleEn: "Server", departmentKey: "frontOfHouse", storeZh: "国贸分店", storeEn: "Guomao", phone: "137****9012", status: "active", salary: 5500, attendance: 95, avatar: "王", nationality: "菲律宾",
    visa: { type: "工作签证Z", number: "V2024-00312", issueDate: "2024-06-15", expiryDate: "2026-06-14", status: "valid" } },
  { id: "E004", nameZh: "刘洋", nameEn: "Liu Yang", roleZh: "厨师", roleEn: "Chef", departmentKey: "kitchen", storeZh: "三里屯分店", storeEn: "Sanlitun", phone: "136****3456", status: "leave", salary: 8000, attendance: 88, avatar: "刘", nationality: "日本",
    visa: { type: "工作签证Z", number: "V2024-00188", issueDate: "2024-03-01", expiryDate: "2026-04-15", status: "expiring", notes: "即将到期，需续签" } },
  { id: "E005", nameZh: "陈静", nameEn: "Chen Jing", roleZh: "收银员", roleEn: "Cashier", departmentKey: "frontOfHouse", storeZh: "总店", storeEn: "Main", phone: "135****7890", status: "active", salary: 5000, attendance: 97, avatar: "陈", nationality: "中国" },
  { id: "E006", nameZh: "赵伟", nameEn: "Zhao Wei", roleZh: "采购专员", roleEn: "Procurement Specialist", departmentKey: "procurement", storeZh: "总部", storeEn: "HQ", phone: "134****2345", status: "active", salary: 7500, attendance: 96, avatar: "赵", nationality: "韩国",
    visa: { type: "工作签证Z", number: "V2023-00521", issueDate: "2023-09-01", expiryDate: "2025-08-31", status: "expired", notes: "已过期！紧急处理" } },
  { id: "E007", nameZh: "Miguel Santos", nameEn: "Miguel Santos", roleZh: "调酒师", roleEn: "Bartender", departmentKey: "frontOfHouse", storeZh: "三里屯分店", storeEn: "Sanlitun", phone: "133****6789", status: "active", salary: 9000, attendance: 94, avatar: "M", nationality: "西班牙",
    visa: { type: "工作签证Z", number: "V2025-00045", issueDate: "2025-01-10", expiryDate: "2027-01-09", status: "valid" } },
  { id: "E008", nameZh: "田中花子", nameEn: "Tanaka Hanako", roleZh: "甜点师", roleEn: "Pastry Chef", departmentKey: "kitchen", storeZh: "总店", storeEn: "Main", phone: "132****1122", status: "active", salary: 11000, attendance: 99, avatar: "田", nationality: "日本",
    visa: { type: "居留许可", number: "R2024-00789", issueDate: "2024-08-01", expiryDate: "2026-07-31", status: "valid" } },
];

const deptKeys = ["all", "kitchen", "frontOfHouse", "procurement", "finance", "hr"];

const HR = () => {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const { storeName } = useStore();

  const filtered = employees.filter((emp) => {
    const name = isZh ? emp.nameZh : emp.nameEn;
    const role = isZh ? emp.roleZh : emp.roleEn;
    const matchSearch = name.includes(search) || role.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === "all" || emp.departmentKey === selectedDept;
    return matchSearch && matchDept;
  });

  const activeCount = employees.filter((e) => e.status === "active").length;
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);

  const statusLabel = (s: string) => s === "active" ? t("hrMgmt.active") : s === "leave" ? t("hrMgmt.onLeave") : t("hrMgmt.resigned");

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("hrMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{storeName(isZh)} · {t("hrMgmt.subtitle")}</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"><UserPlus className="w-4 h-4" />{t("hrMgmt.addEmployee")}</button>
      </div>

      <StoreIndicator />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div><div><p className="text-2xl font-bold">{employees.length}</p><p className="text-xs text-muted-foreground">{t("hrMgmt.totalEmployees")}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><Award className="w-4 h-4 text-success" /></div><div><p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">{t("hrMgmt.activeCount")}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center"><Clock className="w-4 h-4 text-info" /></div><div><p className="text-2xl font-bold">96%</p><p className="text-xs text-muted-foreground">{t("hrMgmt.avgAttendance")}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-warning" /></div><div><p className="text-2xl font-bold">¥{(totalSalary / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">{t("hrMgmt.monthlySalary")}</p></div></div>
        </motion.div>
      </div>

      <Tabs defaultValue="payroll" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
          <TabsTrigger value="payroll" className="gap-1.5 data-[state=active]:bg-primary/20 text-xs">
            <Zap className="w-3.5 h-3.5" />{isZh ? "★薪资自动化" : "★Payroll Auto"}
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-1.5 data-[state=active]:bg-primary/20 text-xs">
            <Users className="w-3.5 h-3.5" />{isZh ? "员工管理" : "Employees"}
          </TabsTrigger>
          <TabsTrigger value="visa" className="gap-1.5 data-[state=active]:bg-primary/20 text-xs">
            <Stamp className="w-3.5 h-3.5" />{isZh ? "签证管理" : "Visa Mgmt"}
            {employees.filter(e => e.visa && (e.visa.status === "expired" || e.visa.status === "expiring")).length > 0 && (
              <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 ml-1">
                {employees.filter(e => e.visa && (e.visa.status === "expired" || e.visa.status === "expiring")).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <PayrollAutomation />
        </TabsContent>

        <TabsContent value="employees">
          <div className="flex items-center gap-4 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder={t("hrMgmt.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
              {deptKeys.map((key) => (
                <button key={key} onClick={() => setSelectedDept(key)} className={`px-3 py-1.5 text-xs rounded-md transition-all ${selectedDept === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {t(`hrMgmt.departments.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("hrMgmt.employee")}</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("hrMgmt.role")}</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("hrMgmt.store")}</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("hrMgmt.contactInfo")}</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("hrMgmt.attendance")}</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("common.status")}</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp, i) => (
                    <motion.tr key={emp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-medium text-primary">{emp.avatar}</div>
                          <div><p className="font-medium">{isZh ? emp.nameZh : emp.nameEn}</p><p className="text-[10px] text-muted-foreground">{emp.id}</p></div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><p>{isZh ? emp.roleZh : emp.roleEn}</p><p className="text-[10px] text-muted-foreground">{t(`hrMgmt.departments.${emp.departmentKey}`)}</p></td>
                      <td className="py-3 px-4 text-muted-foreground">{isZh ? emp.storeZh : emp.storeEn}</td>
                      <td className="py-3 px-4"><p className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3" />{emp.phone}</p></td>
                      <td className="py-3 px-4 text-center"><span className={`font-semibold ${emp.attendance >= 95 ? "text-success" : emp.attendance >= 90 ? "text-warning" : "text-destructive"}`}>{emp.attendance}%</span></td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${emp.status === "active" ? "bg-success/10 text-success" : emp.status === "leave" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>{statusLabel(emp.status)}</span>
                      </td>
                      <td className="py-3 px-4 text-center"><button className="p-1.5 rounded-md hover:bg-muted transition-colors"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </TabsContent>

        {/* Visa Management Tab */}
        <TabsContent value="visa">
          <VisaManagementTab employees={employees} isZh={isZh} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

// ===== Visa Management Component =====
const VisaManagementTab = ({ employees, isZh }: { employees: Employee[]; isZh: boolean }) => {
  const [visaFilter, setVisaFilter] = useState<"all" | "valid" | "expiring" | "expired" | "pending">("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const employeesWithVisa = employees.filter(e => e.visa);
  const employeesWithoutVisa = employees.filter(e => !e.visa);

  const filteredVisa = visaFilter === "all"
    ? employeesWithVisa
    : employeesWithVisa.filter(e => e.visa?.status === visaFilter);

  const expiredCount = employeesWithVisa.filter(e => e.visa?.status === "expired").length;
  const expiringCount = employeesWithVisa.filter(e => e.visa?.status === "expiring").length;
  const validCount = employeesWithVisa.filter(e => e.visa?.status === "valid").length;

  const getVisaStatusBadge = (status: string) => {
    switch (status) {
      case "valid": return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">{isZh ? "有效" : "Valid"}</Badge>;
      case "expiring": return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">{isZh ? "即将到期" : "Expiring"}</Badge>;
      case "expired": return <Badge variant="destructive" className="text-[10px]">{isZh ? "已过期" : "Expired"}</Badge>;
      case "pending": return <Badge variant="secondary" className="text-[10px]">{isZh ? "办理中" : "Pending"}</Badge>;
      default: return null;
    }
  };

  const daysUntilExpiry = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5">
      {/* Visa Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Stamp className="w-4 h-4 text-primary" /></div>
            <div><p className="text-2xl font-bold">{employeesWithVisa.length}</p><p className="text-xs text-muted-foreground">{isZh ? "外籍员工" : "Foreign Staff"}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><Award className="w-4 h-4 text-success" /></div>
            <div><p className="text-2xl font-bold">{validCount}</p><p className="text-xs text-muted-foreground">{isZh ? "签证有效" : "Valid Visas"}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-4 h-4 text-warning" /></div>
            <div><p className="text-2xl font-bold">{expiringCount}</p><p className="text-xs text-muted-foreground">{isZh ? "即将到期" : "Expiring Soon"}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-destructive" /></div>
            <div><p className="text-2xl font-bold">{expiredCount}</p><p className="text-xs text-muted-foreground">{isZh ? "已过期⚠️" : "Expired⚠️"}</p></div>
          </div>
        </motion.div>
      </div>

      {/* Urgent Alerts */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              {employeesWithVisa.filter(e => e.visa?.status === "expired").map(emp => (
                <p key={emp.id} className="text-destructive font-medium">
                  🚨 {isZh ? emp.nameZh : emp.nameEn} — {isZh ? "签证已过期！请立即处理续签" : "Visa EXPIRED! Renew immediately"}
                  {emp.visa && <span className="text-muted-foreground ml-1">({emp.visa.expiryDate})</span>}
                </p>
              ))}
              {employeesWithVisa.filter(e => e.visa?.status === "expiring").map(emp => (
                <p key={emp.id} className="text-warning font-medium">
                  ⏰ {isZh ? emp.nameZh : emp.nameEn} — {isZh ? `签证将在 ${daysUntilExpiry(emp.visa!.expiryDate)} 天后到期` : `Visa expires in ${daysUntilExpiry(emp.visa!.expiryDate)} days`}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {(["all", "valid", "expiring", "expired", "pending"] as const).map(f => (
          <button key={f} onClick={() => setVisaFilter(f)} className={`px-3 py-1.5 text-xs rounded-md transition-all ${visaFilter === f ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground bg-muted/30"}`}>
            {f === "all" ? (isZh ? "全部" : "All") :
             f === "valid" ? (isZh ? "有效" : "Valid") :
             f === "expiring" ? (isZh ? "即将到期" : "Expiring") :
             f === "expired" ? (isZh ? "已过期" : "Expired") :
             (isZh ? "办理中" : "Pending")}
          </button>
        ))}
      </div>

      {/* Visa Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stamp className="w-4 h-4 text-primary" />
              {isZh ? "签证记录" : "Visa Records"}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => toast.info(isZh ? "导出功能开发中" : "Export coming soon")}>
              {isZh ? "导出签证报表" : "Export Report"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{isZh ? "员工" : "Employee"}</TableHead>
                  <TableHead className="text-xs">{isZh ? "国籍" : "Nationality"}</TableHead>
                  <TableHead className="text-xs">{isZh ? "签证类型" : "Visa Type"}</TableHead>
                  <TableHead className="text-xs">{isZh ? "签证号" : "Visa No."}</TableHead>
                  <TableHead className="text-xs text-center">{isZh ? "签发日" : "Issued"}</TableHead>
                  <TableHead className="text-xs text-center">{isZh ? "到期日" : "Expiry"}</TableHead>
                  <TableHead className="text-xs text-center">{isZh ? "剩余天数" : "Days Left"}</TableHead>
                  <TableHead className="text-xs text-center">{isZh ? "状态" : "Status"}</TableHead>
                  <TableHead className="text-xs text-center">{isZh ? "操作" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisa.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      {isZh ? "无匹配记录" : "No matching records"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisa.map((emp, i) => {
                    const days = daysUntilExpiry(emp.visa!.expiryDate);
                    return (
                      <motion.tr key={emp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${emp.visa?.status === "expired" ? "bg-destructive/5" : ""}`}>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-medium text-primary">{emp.avatar}</div>
                            <div>
                              <p className="font-medium">{isZh ? emp.nameZh : emp.nameEn}</p>
                              <p className="text-[10px] text-muted-foreground">{isZh ? emp.roleZh : emp.roleEn}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{emp.nationality}</TableCell>
                        <TableCell className="text-xs font-medium">{emp.visa!.type}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{emp.visa!.number}</TableCell>
                        <TableCell className="text-xs text-center">{emp.visa!.issueDate}</TableCell>
                        <TableCell className="text-xs text-center font-medium">{emp.visa!.expiryDate}</TableCell>
                        <TableCell className="text-xs text-center">
                          <span className={`font-bold ${days <= 0 ? "text-destructive" : days <= 90 ? "text-warning" : "text-success"}`}>
                            {days <= 0 ? (isZh ? "已过期" : "Expired") : `${days}${isZh ? "天" : "d"}`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{getVisaStatusBadge(emp.visa!.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedEmployee(emp)}>
                                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{isZh ? "签证与工作许可档案" : "Visa & Work Permit Archive"} — {isZh ? emp.nameZh : emp.nameEn}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div><Label className="text-[10px] text-muted-foreground">{isZh ? "国籍" : "Nationality"}</Label><p className="text-sm font-medium">{emp.nationality}</p></div>
                                    <div><Label className="text-[10px] text-muted-foreground">{isZh ? "签证类型" : "Visa Type"}</Label><p className="text-sm font-medium">{emp.visa!.type}</p></div>
                                    <div><Label className="text-[10px] text-muted-foreground">{isZh ? "签证号码" : "Visa Number"}</Label><p className="text-sm font-mono">{emp.visa!.number}</p></div>
                                    <div><Label className="text-[10px] text-muted-foreground">{isZh ? "状态" : "Status"}</Label><div className="mt-1">{getVisaStatusBadge(emp.visa!.status)}</div></div>
                                    <div><Label className="text-[10px] text-muted-foreground">{isZh ? "签发日期" : "Issue Date"}</Label><p className="text-sm">{emp.visa!.issueDate}</p></div>
                                    <div><Label className="text-[10px] text-muted-foreground">{isZh ? "到期日期" : "Expiry Date"}</Label><p className="text-sm font-medium">{emp.visa!.expiryDate}</p></div>
                                  </div>
                                  {emp.visa?.notes && (
                                    <div className="bg-muted/30 rounded-md p-3">
                                      <Label className="text-[10px] text-muted-foreground">{isZh ? "备注" : "Notes"}</Label>
                                      <p className="text-sm mt-1">{emp.visa.notes}</p>
                                    </div>
                                  )}

                                  {/* Work Permit Archive */}
                                  <div className="border-t pt-4">
                                    <WorkPermitArchive
                                      employee={{ id: emp.id, nameZh: emp.nameZh, nameEn: emp.nameEn, nationality: emp.nationality }}
                                      isZh={isZh}
                                    />
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {emp.visa?.status === "expired" || emp.visa?.status === "expiring" ? (
                              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => toast.info(isZh ? "续签流程启动中..." : "Renewal starting...")}>
                                {isZh ? "续签" : "Renew"}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Employees without visa (local staff) */}
          {employeesWithoutVisa.length > 0 && (
            <div className="mt-4 p-3 bg-muted/20 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">{isZh ? "本地员工（无需签证管理）" : "Local Staff (no visa required)"}</p>
              <div className="flex flex-wrap gap-2">
                {employeesWithoutVisa.map(emp => (
                  <Badge key={emp.id} variant="outline" className="text-[10px]">
                    {isZh ? emp.nameZh : emp.nameEn} · {emp.nationality}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HR;
