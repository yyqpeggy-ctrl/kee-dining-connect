import { motion } from "framer-motion";
import { Users, UserPlus, Clock, Award, Phone, MoreHorizontal, Search, TrendingUp, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import StoreIndicator from "@/components/StoreIndicator";
import { useStore } from "@/contexts/StoreContext";
import { useState } from "react";
import PayrollAutomation from "@/components/hr/PayrollAutomation";

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
}

const employees: Employee[] = [
  { id: "E001", nameZh: "张明", nameEn: "Zhang Ming", roleZh: "厨师长", roleEn: "Head Chef", departmentKey: "kitchen", storeZh: "总店", storeEn: "Main", phone: "138****1234", status: "active", salary: 12000, attendance: 98, avatar: "张" },
  { id: "E002", nameZh: "李芳", nameEn: "Li Fang", roleZh: "前厅经理", roleEn: "FOH Manager", departmentKey: "frontOfHouse", storeZh: "总店", storeEn: "Main", phone: "139****5678", status: "active", salary: 10000, attendance: 100, avatar: "李" },
  { id: "E003", nameZh: "王强", nameEn: "Wang Qiang", roleZh: "服务员", roleEn: "Server", departmentKey: "frontOfHouse", storeZh: "国贸分店", storeEn: "Guomao", phone: "137****9012", status: "active", salary: 5500, attendance: 95, avatar: "王" },
  { id: "E004", nameZh: "刘洋", nameEn: "Liu Yang", roleZh: "厨师", roleEn: "Chef", departmentKey: "kitchen", storeZh: "三里屯分店", storeEn: "Sanlitun", phone: "136****3456", status: "leave", salary: 8000, attendance: 88, avatar: "刘" },
  { id: "E005", nameZh: "陈静", nameEn: "Chen Jing", roleZh: "收银员", roleEn: "Cashier", departmentKey: "frontOfHouse", storeZh: "总店", storeEn: "Main", phone: "135****7890", status: "active", salary: 5000, attendance: 97, avatar: "陈" },
  { id: "E006", nameZh: "赵伟", nameEn: "Zhao Wei", roleZh: "采购专员", roleEn: "Procurement Specialist", departmentKey: "procurement", storeZh: "总部", storeEn: "HQ", phone: "134****2345", status: "active", salary: 7500, attendance: 96, avatar: "赵" },
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
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
          <TabsTrigger value="payroll" className="gap-1.5 data-[state=active]:bg-primary/20 text-xs">
            <Zap className="w-3.5 h-3.5" />{isZh ? "★薪资自动化" : "★Payroll Auto"}
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-1.5 data-[state=active]:bg-primary/20 text-xs">
            <Users className="w-3.5 h-3.5" />{isZh ? "员工管理" : "Employees"}
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
      </Tabs>
    </AppLayout>
  );
};

export default HR;
