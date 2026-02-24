import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Plus, Settings, UserCheck, UserX } from "lucide-react";

const Permissions = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith("zh");

  const roles = [
    {
      id: 1,
      name: isZh ? "超级管理员" : "Super Admin",
      key: "admin",
      users: 2,
      permissions: isZh ? "全部权限" : "Full Access",
      editable: false,
    },
    {
      id: 2,
      name: isZh ? "店长" : "Store Manager",
      key: "store_manager",
      users: 4,
      permissions: isZh ? "门店运营、库存、订单" : "Store Ops, Inventory, Orders",
      editable: true,
    },
    {
      id: 3,
      name: isZh ? "财务人员" : "Finance Staff",
      key: "finance",
      users: 2,
      permissions: isZh ? "财务、采购、报表" : "Finance, Procurement, Reports",
      editable: true,
    },
    {
      id: 4,
      name: isZh ? "普通员工" : "Staff",
      key: "user",
      users: 12,
      permissions: isZh ? "订单、厨房" : "Orders, Kitchen",
      editable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isZh ? "权限管理" : "Permissions"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isZh ? "管理用户角色与访问权限" : "Manage user roles and access control"}
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {isZh ? "新建角色" : "New Role"}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{roles.length}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "角色总数" : "Total Roles"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {roles.reduce((sum, r) => sum + r.users, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{isZh ? "已分配用户" : "Assigned Users"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <UserX className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "未分配用户" : "Unassigned Users"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>{isZh ? "角色列表" : "Roles"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isZh ? "角色名称" : "Role"}</TableHead>
                  <TableHead>{isZh ? "标识" : "Key"}</TableHead>
                  <TableHead>{isZh ? "用户数" : "Users"}</TableHead>
                  <TableHead>{isZh ? "权限范围" : "Permissions"}</TableHead>
                  <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.key}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        {role.users}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{role.permissions}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" disabled={!role.editable}>
                          <Settings className="w-3 h-3 mr-1" />
                          {isZh ? "配置" : "Configure"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Permissions;
