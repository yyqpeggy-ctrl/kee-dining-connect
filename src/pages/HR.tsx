import { motion } from "framer-motion";
import { 
  Users, UserPlus, Calendar, Clock, Award, Phone, Mail, 
  MoreHorizontal, Search, Filter, TrendingUp 
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  store: string;
  phone: string;
  email: string;
  status: "active" | "leave" | "resigned";
  joinDate: string;
  salary: number;
  attendance: number; // percentage
  avatar: string;
}

const employees: Employee[] = [
  { id: "E001", name: "张明", role: "厨师长", department: "后厨", store: "总店", phone: "138****1234", email: "zhang@food.com", status: "active", joinDate: "2022-03-15", salary: 12000, attendance: 98, avatar: "张" },
  { id: "E002", name: "李芳", role: "前厅经理", department: "前厅", store: "总店", phone: "139****5678", email: "li@food.com", status: "active", joinDate: "2021-08-20", salary: 10000, attendance: 100, avatar: "李" },
  { id: "E003", name: "王强", role: "服务员", department: "前厅", store: "国贸分店", phone: "137****9012", email: "wang@food.com", status: "active", joinDate: "2023-01-10", salary: 5500, attendance: 95, avatar: "王" },
  { id: "E004", name: "刘洋", role: "厨师", department: "后厨", store: "三里屯分店", phone: "136****3456", email: "liu@food.com", status: "leave", joinDate: "2022-06-01", salary: 8000, attendance: 88, avatar: "刘" },
  { id: "E005", name: "陈静", role: "收银员", department: "前厅", store: "总店", phone: "135****7890", email: "chen@food.com", status: "active", joinDate: "2023-05-15", salary: 5000, attendance: 97, avatar: "陈" },
  { id: "E006", name: "赵伟", role: "采购专员", department: "采购", store: "总部", phone: "134****2345", email: "zhao@food.com", status: "active", joinDate: "2022-09-01", salary: 7500, attendance: 96, avatar: "赵" },
];

const departments = ["全部", "后厨", "前厅", "采购", "财务", "人事"];

const HR = () => {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("全部");
  const { currentStore } = useStore();

  const filtered = employees.filter((emp) => {
    const matchSearch = emp.name.includes(search) || emp.role.includes(search);
    const matchDept = selectedDept === "全部" || emp.department === selectedDept;
    return matchSearch && matchDept;
  });

  const activeCount = employees.filter((e) => e.status === "active").length;
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">人事管理</h1>
          <p className="text-sm text-muted-foreground mt-1">员工档案与考勤管理</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          添加员工
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{employees.length}</p>
              <p className="text-xs text-muted-foreground">员工总数</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">在职人数</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">96%</p>
              <p className="text-xs text-muted-foreground">平均出勤率</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">¥{(totalSalary / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground">月薪资支出</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索员工姓名或职位..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                selectedDept === dept ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">员工</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">职位</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">门店</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">联系方式</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">出勤率</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-medium text-primary">
                        {emp.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p>{emp.role}</p>
                    <p className="text-[10px] text-muted-foreground">{emp.department}</p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{emp.store}</td>
                  <td className="py-3 px-4">
                    <p className="flex items-center gap-1 text-xs">
                      <Phone className="w-3 h-3" />{emp.phone}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-semibold ${emp.attendance >= 95 ? "text-success" : emp.attendance >= 90 ? "text-warning" : "text-destructive"}`}>
                      {emp.attendance}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      emp.status === "active" ? "bg-success/10 text-success" : 
                      emp.status === "leave" ? "bg-warning/10 text-warning" : 
                      "bg-muted text-muted-foreground"
                    }`}>
                      {emp.status === "active" ? "在职" : emp.status === "leave" ? "请假" : "离职"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default HR;
