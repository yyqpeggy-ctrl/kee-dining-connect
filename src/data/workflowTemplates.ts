import type { WorkflowNode } from "@/components/workflow/WorkflowCanvas";

export interface WorkflowTemplate {
  id: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  category: "operations" | "supply_chain" | "hr" | "finance" | "legal" | "marketing" | "stores";
  status: "active" | "paused";
  linkedModules: LinkedModule[];
  nodes: WorkflowNode[];
  pending: number;
  completed: number;
}

export interface LinkedModule {
  nameZh: string;
  nameEn: string;
  route: string;
  color: string;
}

const MODULE = {
  procurement: { nameZh: "采购管理", nameEn: "Procurement", route: "/procurement", color: "bg-orange-500/10 text-orange-600" },
  finance: { nameZh: "财务管理", nameEn: "Finance", route: "/finance", color: "bg-emerald-500/10 text-emerald-600" },
  inventory: { nameZh: "库存管理", nameEn: "Inventory", route: "/inventory", color: "bg-blue-500/10 text-blue-600" },
  hr: { nameZh: "人事管理", nameEn: "HR", route: "/hr", color: "bg-purple-500/10 text-purple-600" },
  legal: { nameZh: "法务管理", nameEn: "Legal", route: "/legal", color: "bg-red-500/10 text-red-600" },
  stores: { nameZh: "门店管理", nameEn: "Stores", route: "/stores", color: "bg-cyan-500/10 text-cyan-600" },
  kitchen: { nameZh: "厨房管理", nameEn: "Kitchen", route: "/kitchen", color: "bg-amber-500/10 text-amber-600" },
  orders: { nameZh: "订单管理", nameEn: "Orders", route: "/orders", color: "bg-indigo-500/10 text-indigo-600" },
  menu: { nameZh: "酒水菜单", nameEn: "Menu", route: "/menu", color: "bg-pink-500/10 text-pink-600" },
  marketing: { nameZh: "市场管理", nameEn: "Marketing", route: "/marketing", color: "bg-violet-500/10 text-violet-600" },
  delivery: { nameZh: "外卖管理", nameEn: "Delivery", route: "/delivery", color: "bg-teal-500/10 text-teal-600" },
  dataCenter: { nameZh: "数据中心", nameEn: "Data Center", route: "/data-center", color: "bg-slate-500/10 text-slate-600" },
};

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ===== 1. 采购审批流程 =====
  {
    id: "wf-procurement-approval",
    nameZh: "采购审批流程",
    nameEn: "Procurement Approval",
    descZh: "从采购申请到付款的全链路审批，自动关联库存预警与财务凭证",
    descEn: "End-to-end procurement approval from request to payment with inventory & finance linkage",
    category: "supply_chain",
    status: "active",
    linkedModules: [MODULE.procurement, MODULE.finance, MODULE.inventory],
    pending: 3,
    completed: 47,
    nodes: [
      { id: "pa-1", nodeType: "auto", label: "库存预警触发", order: 0, config: { description: "当库存低于安全阈值时自动发起采购申请", assignee: "initiator" } },
      { id: "pa-2", nodeType: "approval", label: "店长审批", order: 1, config: { assignee: "store_manager", description: "审核采购品类、数量与预算" } },
      { id: "pa-3", nodeType: "condition", label: "金额判断", order: 2, config: { description: "≤5000元直接通过，>5000元需总经理审批" } },
      { id: "pa-4", nodeType: "approval", label: "总经理审批", order: 3, config: { assignee: "gm", description: "大额采购需总经理签批" } },
      { id: "pa-5", nodeType: "auto", label: "自动生成采购单", order: 4, config: { description: "审批通过后自动创建采购订单并通知供应商" } },
      { id: "pa-6", nodeType: "notification", label: "通知供应商", order: 5, config: { description: "通过微信模板消息通知供应商备货发货" } },
      { id: "pa-7", nodeType: "review", label: "收货验收", order: 6, config: { assignee: "store_manager", description: "OCR扫描收货单，三方核对（采购单+收货单+供应商账单）" } },
      { id: "pa-8", nodeType: "approval", label: "财务审核付款", order: 7, config: { assignee: "finance", description: "核对发票与合同，审批付款申请" } },
      { id: "pa-9", nodeType: "auto", label: "自动生成财务凭证", order: 8, config: { description: "付款完成后自动生成会计分录，更新应付账款" } },
    ],
  },

  // ===== 2. 费用报销流程 =====
  {
    id: "wf-expense-reimbursement",
    nameZh: "费用报销流程",
    nameEn: "Expense Reimbursement",
    descZh: "员工费用报销全流程，自动核验发票与生成会计凭证",
    descEn: "Employee expense reimbursement with auto invoice verification and accounting entries",
    category: "finance",
    status: "active",
    linkedModules: [MODULE.finance, MODULE.hr],
    pending: 5,
    completed: 89,
    nodes: [
      { id: "er-1", nodeType: "auto", label: "提交报销单", order: 0, config: { assignee: "initiator", description: "员工填写报销明细并上传发票/收据" } },
      { id: "er-2", nodeType: "auto", label: "OCR发票识别", order: 1, config: { description: "自动识别发票金额、供应商信息，验证发票真伪" } },
      { id: "er-3", nodeType: "approval", label: "直属主管审批", order: 2, config: { assignee: "manager", description: "审核报销事由与金额合理性" } },
      { id: "er-4", nodeType: "condition", label: "金额判断", order: 3, config: { description: "≤2000元财务直接处理，>2000元需总经理审批" } },
      { id: "er-5", nodeType: "approval", label: "总经理审批", order: 4, config: { assignee: "gm", description: "大额报销需总经理签批" } },
      { id: "er-6", nodeType: "approval", label: "财务复核", order: 5, config: { assignee: "finance", description: "核对票据合规性与费用分类" } },
      { id: "er-7", nodeType: "auto", label: "自动打款并生成凭证", order: 6, config: { description: "通过银行转账打款，自动生成费用凭证与会计分录" } },
      { id: "er-8", nodeType: "notification", label: "通知报销人", order: 7, config: { description: "报销完成后推送通知" } },
    ],
  },

  // ===== 3. 员工入职流程 =====
  {
    id: "wf-employee-onboarding",
    nameZh: "员工入职流程",
    nameEn: "Employee Onboarding",
    descZh: "新员工从Offer到正式上岗的标准化入职流程",
    descEn: "Standardized onboarding from offer to first day readiness",
    category: "hr",
    status: "active",
    linkedModules: [MODULE.hr, MODULE.finance, MODULE.legal],
    pending: 1,
    completed: 23,
    nodes: [
      { id: "eo-1", nodeType: "auto", label: "发放Offer", order: 0, config: { description: "HR系统自动生成Offer Letter并发送" } },
      { id: "eo-2", nodeType: "review", label: "资料审核", order: 1, config: { assignee: "hr", description: "审核身份证、健康证、学历证书等必要材料" } },
      { id: "eo-3", nodeType: "auto", label: "生成劳动合同", order: 2, config: { description: "根据岗位模板自动生成劳动合同" } },
      { id: "eo-4", nodeType: "approval", label: "合同审批", order: 3, config: { assignee: "hr", description: "HR负责人审核合同条款" } },
      { id: "eo-5", nodeType: "auto", label: "开通系统账号", order: 4, config: { description: "自动创建员工账号并分配对应角色权限" } },
      { id: "eo-6", nodeType: "auto", label: "薪资档案建立", order: 5, config: { description: "在财务系统中建立薪资档案与社保公积金信息" } },
      { id: "eo-7", nodeType: "notification", label: "通知相关部门", order: 6, config: { description: "通知门店店长/厨房主管安排培训" } },
      { id: "eo-8", nodeType: "timer", label: "试用期提醒", order: 7, config: { timeoutHours: 2160, description: "试用期到期前7天自动提醒HR进行转正评估" } },
    ],
  },

  // ===== 4. 请假审批流程 =====
  {
    id: "wf-leave-request",
    nameZh: "请假审批流程",
    nameEn: "Leave Request",
    descZh: "员工请假申请与审批，自动同步排班系统",
    descEn: "Leave request and approval with automatic schedule sync",
    category: "hr",
    status: "active",
    linkedModules: [MODULE.hr, MODULE.kitchen, MODULE.stores],
    pending: 2,
    completed: 156,
    nodes: [
      { id: "lr-1", nodeType: "auto", label: "提交请假申请", order: 0, config: { assignee: "initiator", description: "选择请假类型（年假/事假/病假/调休）与时间段" } },
      { id: "lr-2", nodeType: "permission", label: "假期余额检查", order: 1, config: { description: "自动检查剩余假期额度是否充足" } },
      { id: "lr-3", nodeType: "approval", label: "店长/主管审批", order: 2, config: { assignee: "store_manager", description: "审核人手安排是否受影响" } },
      { id: "lr-4", nodeType: "condition", label: "天数判断", order: 3, config: { description: "≤3天主管直批，>3天需HR审批" } },
      { id: "lr-5", nodeType: "approval", label: "HR审批", order: 4, config: { assignee: "hr", description: "确认假期政策合规" } },
      { id: "lr-6", nodeType: "auto", label: "同步排班系统", order: 5, config: { description: "自动更新排班表，标记缺勤并触发代班安排" } },
      { id: "lr-7", nodeType: "notification", label: "通知相关人员", order: 6, config: { description: "通知代班同事与门店店长" } },
    ],
  },

  // ===== 5. 员工离职流程 =====
  {
    id: "wf-employee-offboarding",
    nameZh: "员工离职流程",
    nameEn: "Employee Offboarding",
    descZh: "从离职申请到工资结算的标准化交接流程",
    descEn: "Standardized offboarding from resignation to final settlement",
    category: "hr",
    status: "active",
    linkedModules: [MODULE.hr, MODULE.finance, MODULE.legal],
    pending: 0,
    completed: 8,
    nodes: [
      { id: "of-1", nodeType: "auto", label: "提交离职申请", order: 0, config: { assignee: "initiator", description: "员工提交书面离职申请" } },
      { id: "of-2", nodeType: "approval", label: "主管审批", order: 1, config: { assignee: "manager", description: "直属主管确认并安排交接" } },
      { id: "of-3", nodeType: "approval", label: "HR审批", order: 2, config: { assignee: "hr", description: "确认离职日期与交接期限" } },
      { id: "of-4", nodeType: "review", label: "资产归还核查", order: 3, config: { assignee: "store_manager", description: "核查工服、钥匙、设备等物品归还情况" } },
      { id: "of-5", nodeType: "auto", label: "禁用系统账号", order: 4, config: { description: "自动禁用员工系统访问权限" } },
      { id: "of-6", nodeType: "auto", label: "工资结算", order: 5, config: { description: "自动计算剩余工资、未休年假折算与离职补偿" } },
      { id: "of-7", nodeType: "auto", label: "生成离职证明", order: 6, config: { description: "自动生成离职证明文档" } },
      { id: "of-8", nodeType: "notification", label: "档案归档通知", order: 7, config: { description: "通知HR将人事档案归档至数据中心" } },
    ],
  },

  // ===== 6. 合同审批流程 =====
  {
    id: "wf-contract-approval",
    nameZh: "合同审批流程",
    nameEn: "Contract Approval",
    descZh: "供应商合同从起草到签署的全流程审批，自动存档",
    descEn: "Full contract lifecycle from drafting to signing with auto-archival",
    category: "legal",
    status: "active",
    linkedModules: [MODULE.legal, MODULE.procurement, MODULE.finance],
    pending: 1,
    completed: 34,
    nodes: [
      { id: "ca-1", nodeType: "auto", label: "起草合同", order: 0, config: { description: "基于合同模板自动生成初始合同文本" } },
      { id: "ca-2", nodeType: "review", label: "法务审核", order: 1, config: { assignee: "department_head", description: "审核合同条款、风险与合规性" } },
      { id: "ca-3", nodeType: "approval", label: "财务审核", order: 2, config: { assignee: "finance", description: "审核付款条件、金额与发票条款" } },
      { id: "ca-4", nodeType: "condition", label: "合同金额判断", order: 3, config: { description: "≤10万直接总经理签批，>10万需董事会审批" } },
      { id: "ca-5", nodeType: "approval", label: "总经理审批", order: 4, config: { assignee: "gm", description: "最终签批" } },
      { id: "ca-6", nodeType: "auto", label: "电子签章", order: 5, config: { description: "生成电子合同并加盖电子章" } },
      { id: "ca-7", nodeType: "notification", label: "通知供应商签署", order: 6, config: { description: "发送合同至供应商进行签署确认" } },
      { id: "ca-8", nodeType: "auto", label: "归档至知识库", order: 7, config: { description: "自动将签署完成的合同归档至数据中心知识库" } },
    ],
  },

  // ===== 7. 菜单变更审批流程 =====
  {
    id: "wf-menu-change",
    nameZh: "菜单变更审批流程",
    nameEn: "Menu Change Approval",
    descZh: "新菜品上线或菜品调整的标准审批流程，联动库存与成本",
    descEn: "Menu item addition/modification approval with inventory and cost linkage",
    category: "operations",
    status: "active",
    linkedModules: [MODULE.menu, MODULE.inventory, MODULE.kitchen, MODULE.finance],
    pending: 1,
    completed: 19,
    nodes: [
      { id: "mc-1", nodeType: "auto", label: "提交菜品变更", order: 0, config: { description: "提交新菜品/调价/下架申请，包含配方与成本信息" } },
      { id: "mc-2", nodeType: "auto", label: "自动成本核算", order: 1, config: { description: "根据配方自动计算食材成本，测算毛利率" } },
      { id: "mc-3", nodeType: "approval", label: "厨师长审批", order: 2, config: { assignee: "department_head", description: "审核菜品制作工艺与出品标准" } },
      { id: "mc-4", nodeType: "approval", label: "运营总监审批", order: 3, config: { assignee: "gm", description: "审核定价策略与营销定位" } },
      { id: "mc-5", nodeType: "auto", label: "更新菜单系统", order: 4, config: { description: "自动更新POS菜单与外卖平台菜单" } },
      { id: "mc-6", nodeType: "auto", label: "同步库存配方", order: 5, config: { description: "将菜品配方关联到库存系统，设置自动扣减规则" } },
      { id: "mc-7", nodeType: "notification", label: "通知全门店", order: 6, config: { description: "向所有门店推送菜单更新通知与制作培训材料" } },
    ],
  },

  // ===== 8. 门店装修审批流程 =====
  {
    id: "wf-renovation-approval",
    nameZh: "门店装修审批流程",
    nameEn: "Store Renovation Approval",
    descZh: "门店装修/翻新项目从立项到验收的全链路管理",
    descEn: "Store renovation project lifecycle from proposal to acceptance",
    category: "stores",
    status: "active",
    linkedModules: [MODULE.stores, MODULE.finance, MODULE.legal, MODULE.procurement],
    pending: 0,
    completed: 4,
    nodes: [
      { id: "ra-1", nodeType: "auto", label: "提交装修方案", order: 0, config: { description: "提交装修设计方案、预算与施工计划" } },
      { id: "ra-2", nodeType: "approval", label: "运营总监审批", order: 1, config: { assignee: "gm", description: "审核方案合理性与预算" } },
      { id: "ra-3", nodeType: "auto", label: "自动创建装修项目", order: 2, config: { description: "在门店管理中创建装修项目记录并跟踪进度" } },
      { id: "ra-4", nodeType: "auto", label: "生成采购需求", order: 3, config: { description: "根据装修方案自动生成材料与设备采购单" } },
      { id: "ra-5", nodeType: "review", label: "施工阶段验收", order: 4, config: { assignee: "store_manager", description: "各施工阶段完成后进行现场验收" } },
      { id: "ra-6", nodeType: "approval", label: "竣工验收审批", order: 5, config: { assignee: "gm", description: "最终竣工验收与审批" } },
      { id: "ra-7", nodeType: "auto", label: "固定资产入账", order: 6, config: { description: "将装修投入自动计入固定资产并设置折旧计划" } },
      { id: "ra-8", nodeType: "auto", label: "生成财务凭证", order: 7, config: { description: "自动生成资本化支出会计分录" } },
    ],
  },

  // ===== 9. 供应商准入审批流程 =====
  {
    id: "wf-supplier-onboarding",
    nameZh: "供应商准入审批流程",
    nameEn: "Supplier Onboarding",
    descZh: "新供应商从资质审核到系统录入的标准准入流程",
    descEn: "New supplier qualification review and system registration process",
    category: "supply_chain",
    status: "active",
    linkedModules: [MODULE.procurement, MODULE.legal, MODULE.finance],
    pending: 1,
    completed: 12,
    nodes: [
      { id: "so-1", nodeType: "auto", label: "供应商信息登记", order: 0, config: { description: "供应商提交营业执照、资质证书、银行信息等基本资料" } },
      { id: "so-2", nodeType: "auto", label: "OCR资质识别", order: 1, config: { description: "自动识别营业执照、食品经营许可证等关键信息" } },
      { id: "so-3", nodeType: "review", label: "采购部审核", order: 2, config: { assignee: "department_head", description: "审核供应商资质、供货能力与价格竞争力" } },
      { id: "so-4", nodeType: "review", label: "品质部审核", order: 3, config: { assignee: "department_head", description: "评估食材品质标准与食品安全体系" } },
      { id: "so-5", nodeType: "approval", label: "财务审核", order: 4, config: { assignee: "finance", description: "审核付款条件、开票信息与银行账户" } },
      { id: "so-6", nodeType: "approval", label: "总经理审批", order: 5, config: { assignee: "gm", description: "最终审批供应商准入" } },
      { id: "so-7", nodeType: "auto", label: "自动录入系统", order: 6, config: { description: "将供应商信息自动录入采购管理系统" } },
      { id: "so-8", nodeType: "notification", label: "通知供应商", order: 7, config: { description: "通知供应商已通过准入审核，可开始合作" } },
    ],
  },

  // ===== 10. 库存报损流程 =====
  {
    id: "wf-inventory-writeoff",
    nameZh: "库存报损流程",
    nameEn: "Inventory Write-off",
    descZh: "库存损耗与报废的审批管理，自动同步财务损益",
    descEn: "Inventory spoilage and write-off approval with P&L sync",
    category: "supply_chain",
    status: "active",
    linkedModules: [MODULE.inventory, MODULE.finance, MODULE.kitchen],
    pending: 2,
    completed: 67,
    nodes: [
      { id: "iw-1", nodeType: "auto", label: "提交报损申请", order: 0, config: { description: "填写报损物品、数量、原因（过期/损坏/盘亏）" } },
      { id: "iw-2", nodeType: "review", label: "店长核实", order: 1, config: { assignee: "store_manager", description: "现场核实报损物品实际情况" } },
      { id: "iw-3", nodeType: "condition", label: "金额判断", order: 2, config: { description: "≤500元店长直批，>500元需运营总监审批" } },
      { id: "iw-4", nodeType: "approval", label: "运营总监审批", order: 3, config: { assignee: "gm", description: "审批大额报损" } },
      { id: "iw-5", nodeType: "auto", label: "自动扣减库存", order: 4, config: { description: "从库存系统中扣减报损数量，更新库存状态" } },
      { id: "iw-6", nodeType: "auto", label: "生成损益凭证", order: 5, config: { description: "自动生成营业外支出/管理费用会计分录" } },
      { id: "iw-7", nodeType: "notification", label: "异常预警", order: 6, config: { description: "报损率超标时自动预警至管理层" } },
    ],
  },

  // ===== 11. 营销活动审批流程 =====
  {
    id: "wf-marketing-campaign",
    nameZh: "营销活动审批流程",
    nameEn: "Marketing Campaign Approval",
    descZh: "营销活动从策划到执行复盘的全流程管理",
    descEn: "Marketing campaign lifecycle from planning to post-event review",
    category: "marketing",
    status: "active",
    linkedModules: [MODULE.marketing, MODULE.finance, MODULE.stores],
    pending: 1,
    completed: 15,
    nodes: [
      { id: "mk-1", nodeType: "auto", label: "提交活动方案", order: 0, config: { description: "提交活动策划方案、预算与预期效果" } },
      { id: "mk-2", nodeType: "approval", label: "市场总监审批", order: 1, config: { assignee: "department_head", description: "审核活动方案与品牌一致性" } },
      { id: "mk-3", nodeType: "approval", label: "财务预算审批", order: 2, config: { assignee: "finance", description: "审核活动预算与费用分摊" } },
      { id: "mk-4", nodeType: "approval", label: "总经理审批", order: 3, config: { assignee: "gm", description: "最终审批活动方案" } },
      { id: "mk-5", nodeType: "auto", label: "创建活动记录", order: 4, config: { description: "在营销模块自动创建活动记录与参与者管理" } },
      { id: "mk-6", nodeType: "notification", label: "全渠道发布", order: 5, config: { description: "自动同步活动信息至社交媒体、外卖平台与店内" } },
      { id: "mk-7", nodeType: "timer", label: "活动复盘提醒", order: 6, config: { timeoutHours: 72, description: "活动结束72小时后自动提醒进行效果复盘" } },
      { id: "mk-8", nodeType: "auto", label: "生成效果报表", order: 7, config: { description: "自动汇总活动ROI、客流量与销售数据至数据中心" } },
    ],
  },

  // ===== 12. 资产采购与入库流程 =====
  {
    id: "wf-asset-purchase",
    nameZh: "固定资产采购流程",
    nameEn: "Fixed Asset Purchase",
    descZh: "设备、家具等固定资产从申请到入账折旧的全生命周期管理",
    descEn: "Fixed asset lifecycle from request to depreciation tracking",
    category: "finance",
    status: "active",
    linkedModules: [MODULE.finance, MODULE.procurement, MODULE.stores],
    pending: 0,
    completed: 11,
    nodes: [
      { id: "ap-1", nodeType: "auto", label: "提交资产申请", order: 0, config: { description: "填写资产名称、规格、预算与用途说明" } },
      { id: "ap-2", nodeType: "approval", label: "部门负责人审批", order: 1, config: { assignee: "department_head", description: "确认资产需求合理性" } },
      { id: "ap-3", nodeType: "approval", label: "财务审批", order: 2, config: { assignee: "finance", description: "审核预算与资本支出计划" } },
      { id: "ap-4", nodeType: "approval", label: "总经理审批", order: 3, config: { assignee: "gm", description: "大额资产最终审批" } },
      { id: "ap-5", nodeType: "auto", label: "自动创建采购单", order: 4, config: { description: "审批通过后自动在采购管理中创建资产采购订单" } },
      { id: "ap-6", nodeType: "review", label: "到货验收", order: 5, config: { assignee: "store_manager", description: "核实资产规格与数量" } },
      { id: "ap-7", nodeType: "auto", label: "固定资产入账", order: 6, config: { description: "自动在门店管理中创建资产记录，设置折旧参数" } },
      { id: "ap-8", nodeType: "auto", label: "自动生成凭证", order: 7, config: { description: "生成固定资产购置会计分录（借：固定资产 贷：银行存款）" } },
    ],
  },

  // ===== 13. 食品安全检查流程 =====
  {
    id: "wf-food-safety",
    nameZh: "食品安全检查流程",
    nameEn: "Food Safety Inspection",
    descZh: "定期食品安全巡检与整改的标准化流程",
    descEn: "Periodic food safety inspection and corrective action workflow",
    category: "operations",
    status: "active",
    linkedModules: [MODULE.kitchen, MODULE.stores, MODULE.legal],
    pending: 1,
    completed: 42,
    nodes: [
      { id: "fs-1", nodeType: "timer", label: "定时触发检查", order: 0, config: { timeoutHours: 168, description: "每周自动触发食品安全巡检任务" } },
      { id: "fs-2", nodeType: "review", label: "现场巡检", order: 1, config: { assignee: "store_manager", description: "检查食材存储、温度控制、卫生状况等" } },
      { id: "fs-3", nodeType: "condition", label: "是否合格", order: 2, config: { description: "合格则归档，不合格则进入整改流程" } },
      { id: "fs-4", nodeType: "notification", label: "发送整改通知", order: 3, config: { description: "向相关责任人发送整改要求与截止日期" } },
      { id: "fs-5", nodeType: "timer", label: "整改期限", order: 4, config: { timeoutHours: 48, description: "48小时内完成整改" } },
      { id: "fs-6", nodeType: "review", label: "整改复查", order: 5, config: { assignee: "department_head", description: "复查整改措施是否到位" } },
      { id: "fs-7", nodeType: "auto", label: "归档检查记录", order: 6, config: { description: "将检查结果与整改记录归档至数据中心" } },
    ],
  },

  // ===== 14. 外卖投诉处理流程 =====
  {
    id: "wf-delivery-complaint",
    nameZh: "外卖投诉处理流程",
    nameEn: "Delivery Complaint Handling",
    descZh: "外卖平台客诉从受理到结案的标准化处理流程",
    descEn: "Delivery platform complaint resolution from intake to closure",
    category: "operations",
    status: "active",
    linkedModules: [MODULE.delivery, MODULE.orders, MODULE.finance, MODULE.kitchen],
    pending: 3,
    completed: 78,
    nodes: [
      { id: "dc-1", nodeType: "auto", label: "投诉自动受理", order: 0, config: { description: "外卖平台投诉自动同步至系统" } },
      { id: "dc-2", nodeType: "auto", label: "智能分类", order: 1, config: { description: "AI自动分类投诉类型：配送/品质/缺漏/异物等" } },
      { id: "dc-3", nodeType: "approval", label: "店长处理", order: 2, config: { assignee: "store_manager", description: "确认投诉事实并决定处理方案（退款/补发/优惠券）" } },
      { id: "dc-4", nodeType: "condition", label: "赔付金额判断", order: 3, config: { description: "≤100元店长直接处理，>100元需上级审批" } },
      { id: "dc-5", nodeType: "approval", label: "运营总监审批", order: 4, config: { assignee: "gm", description: "大额赔付审批" } },
      { id: "dc-6", nodeType: "auto", label: "执行赔付", order: 5, config: { description: "自动执行退款或发放优惠券" } },
      { id: "dc-7", nodeType: "auto", label: "生成财务凭证", order: 6, config: { description: "赔付金额自动生成营业外支出凭证" } },
      { id: "dc-8", nodeType: "notification", label: "回访通知", order: 7, config: { description: "投诉处理完成后自动发送满意度回访" } },
    ],
  },

  // ===== 15. 月度盘点流程 =====
  {
    id: "wf-monthly-stocktake",
    nameZh: "月度盘点流程",
    nameEn: "Monthly Stocktake",
    descZh: "每月定期库存盘点与差异处理的标准流程",
    descEn: "Monthly inventory stocktake and variance resolution workflow",
    category: "supply_chain",
    status: "active",
    linkedModules: [MODULE.inventory, MODULE.finance, MODULE.stores],
    pending: 0,
    completed: 24,
    nodes: [
      { id: "ms-1", nodeType: "timer", label: "月末自动触发", order: 0, config: { timeoutHours: 720, description: "每月最后一天自动发起盘点任务" } },
      { id: "ms-2", nodeType: "notification", label: "通知门店盘点", order: 1, config: { description: "向各门店发送盘点任务通知与盘点表" } },
      { id: "ms-3", nodeType: "review", label: "实物盘点", order: 2, config: { assignee: "store_manager", description: "各门店执行实物清点并录入系统" } },
      { id: "ms-4", nodeType: "auto", label: "自动差异计算", order: 3, config: { description: "系统自动比对账面与实盘数据，计算盈亏" } },
      { id: "ms-5", nodeType: "condition", label: "差异率判断", order: 4, config: { description: "差异率≤2%自动通过，>2%需调查审批" } },
      { id: "ms-6", nodeType: "approval", label: "差异审批", order: 5, config: { assignee: "gm", description: "审批盘点差异处理方案" } },
      { id: "ms-7", nodeType: "auto", label: "调整库存账面", order: 6, config: { description: "自动调整库存系统数据至实际盘点数" } },
      { id: "ms-8", nodeType: "auto", label: "生成盘点报表", order: 7, config: { description: "生成盘点报表并归档至数据中心，同步损益至财务" } },
    ],
  },

  // ===== 16. 采购-付款-做账-报税 全自动化主流程 (★核心流程) =====
  {
    id: "wf-procurement-to-tax-automation",
    nameZh: "★ 采购到报税全自动化主流程",
    nameEn: "★ Procurement-to-Tax Full Automation",
    descZh: "AI智能联动：采购下单→供应商发货→收货验收→月度账单核对→自动付款→银行流水回导→自动做账→报表生成→报税申报→亿企代账导出，全链路智能自动化",
    descEn: "AI-driven full automation: PO→Shipping→Receipt→Bill Reconciliation→Auto Payment→Bank Import→Auto Accounting→Reports→Tax Filing→YiQi Export",
    category: "finance",
    status: "active",
    linkedModules: [MODULE.procurement, MODULE.finance, MODULE.inventory, MODULE.dataCenter, MODULE.legal],
    pending: 5,
    completed: 312,
    nodes: [
      // Phase 1: 智能采购下单
      { id: "pta-1", nodeType: "auto", label: "AI智能采购建议", order: 0, config: { description: "AI根据库存消耗、菜单销量预测、活动排期自动生成采购建议，经理确认后自动创建采购订单" } },
      { id: "pta-2", nodeType: "auto", label: "自动发送采购订单", order: 1, config: { description: "采购单创建后自动通过微信/邮件/短信发送给供应商，包含品名、数量、交货日期与合同约定价格" } },
      { id: "pta-3", nodeType: "notification", label: "通知供应商备货", order: 2, config: { description: "自动推送微信模板消息通知供应商确认订单并安排发货" } },

      // Phase 2: 收货验收与核对
      { id: "pta-4", nodeType: "auto", label: "OCR收货单扫描", order: 3, config: { description: "供应商送货后，OCR自动识别收货单据内容（品名、数量、金额），AI验签检测" } },
      { id: "pta-5", nodeType: "auto", label: "三方自动核对", order: 4, config: { description: "系统自动执行三方核对：采购单 vs 收货单 vs 供应商月度账单，差异自动标记并预警" } },
      { id: "pta-6", nodeType: "condition", label: "核对结果判断", order: 5, config: { description: "全部匹配→自动进入付款流程；存在差异→转人工审核确认" } },
      { id: "pta-7", nodeType: "review", label: "差异人工复核", order: 6, config: { assignee: "store_manager", description: "核对差异明细（数量不符、价格偏差、缺漏项），确认或拒绝" } },

      // Phase 3: 智能付款
      { id: "pta-8", nodeType: "auto", label: "按合同账期自动排款", order: 7, config: { description: "根据合同约定账期（如月结30天、到货7天）或特别指定的付款日期，自动安排付款计划" } },
      { id: "pta-9", nodeType: "approval", label: "付款审批", order: 8, config: { assignee: "finance", description: "财务确认付款金额、供应商银行信息，审批后生成付款指令" } },
      { id: "pta-10", nodeType: "auto", label: "生成银行付款Excel", order: 9, config: { description: "按银行网银导入模板汇总生成批量付款Excel文件（含收款人、开户行、账号、金额）" } },
      { id: "pta-11", nodeType: "notification", label: "提醒导入银行系统", order: 10, config: { description: "推送通知财务人员：付款Excel已生成，请下载后导入网银系统执行批量转账" } },

      // Phase 4: 银行流水回导与自动做账
      { id: "pta-12", nodeType: "auto", label: "导入银行流水", order: 11, config: { description: "银行转账完成后，导入银行回单/流水文件，系统自动匹配已付款的采购单" } },
      { id: "pta-13", nodeType: "auto", label: "AI自动生成会计凭证", order: 12, config: { description: "根据银行流水自动生成复合会计凭证（借：原材料/固定资产 贷：银行存款），自动匹配科目编码" } },
      { id: "pta-14", nodeType: "auto", label: "自动更新账簿", order: 13, config: { description: "凭证自动过账至总账和明细账，更新科目余额表、应付账款明细" } },

      // Phase 5: 报表生成
      { id: "pta-15", nodeType: "auto", label: "自动生成三大报表", order: 14, config: { description: "月末自动生成利润表、资产负债表、现金流量表，按门店独立和合并两个维度" } },
      { id: "pta-16", nodeType: "auto", label: "生成内部管理报表", order: 15, config: { description: "按数据中心导入的报表模板，自动生成各子公司独立报表和集团合并报表" } },

      // Phase 6: 报税准备
      { id: "pta-17", nodeType: "auto", label: "AI自动计税", order: 16, config: { description: "自动计算增值税（销项-进项）、企业所得税（25%）、个人所得税、附加税费" } },
      { id: "pta-18", nodeType: "auto", label: "生成纳税申报表", order: 17, config: { description: "自动生成增值税申报表（主表+附表一二）、企业所得税预缴表(A类)、个税扣缴表" } },

      // Phase 7: 人工审核确认
      { id: "pta-19", nodeType: "review", label: "财务经理审核", order: 18, config: { assignee: "finance", description: "审核全部报表与纳税申报数据，可修改调整后确认" } },
      { id: "pta-20", nodeType: "approval", label: "总经理最终确认", order: 19, config: { assignee: "gm", description: "总经理审阅月度/季度财务报告与纳税情况，签字确认" } },

      // Phase 8: 亿企代账导出与申报
      { id: "pta-21", nodeType: "auto", label: "一键导出亿企代账包", order: 20, config: { description: "在国家规定报税期间，一键导出凭证、发票台账、科目余额表、纳税申报包等全量文件" } },
      { id: "pta-22", nodeType: "notification", label: "提醒导入亿企代账", order: 21, config: { description: "推送通知：数据包已生成，请导入亿企代账软件进行最终申报。附操作指引链接" } },
      { id: "pta-23", nodeType: "auto", label: "生成内部合并报表", order: 22, config: { description: "自动出具各子公司独立财务报表和集团合并报表，按数据中心模板格式化输出" } },
      { id: "pta-24", nodeType: "auto", label: "归档至数据中心", order: 23, config: { description: "全部文件（报表、申报表、凭证包、银行流水）自动归档至数据中心知识库，永久留存" } },
    ],
  },

  // ===== ★ 薪资自动化全流程 =====
  {
    id: "payroll-auto",
    nameZh: "★ 薪资计算到发放全自动化",
    nameEn: "★ Payroll Calculation to Payment Automation",
    descZh: "出勤导入→自动计算薪资→确认做账→银行付款→自动清账入账",
    descEn: "Attendance→Auto-calc→Confirm Journal→Bank Pay→Auto-Reconcile",
    category: "hr" as const,
    status: "active" as const,
    linkedModules: [MODULE.hr, MODULE.finance],
    pending: 0,
    completed: 0,
    nodes: [
      { id: "pay-1", nodeType: "auto", label: "导入出勤数据", order: 0, config: { description: "从考勤系统/Excel/CSV导入员工当月出勤记录（出勤天数、加班、请假、迟到）" } },
      { id: "pay-2", nodeType: "auto", label: "自动计算薪资", order: 1, config: { description: "按基本工资、加班费(1.5倍)、请假扣款、迟到扣款自动计算应发工资" } },
      { id: "pay-3", nodeType: "auto", label: "计算社保公积金", order: 2, config: { description: "自动计算个人社保(10.5%)和住房公积金(12%)代扣金额" } },
      { id: "pay-4", nodeType: "auto", label: "计算个人所得税", order: 3, config: { description: "按7级超额累进税率自动计算个税（起征点5000元）" } },
      { id: "pay-5", nodeType: "review", label: "人工审核薪资单", order: 4, config: { assignee: "hr_manager", description: "HR经理审核薪资计算结果，可修改调整" } },
      { id: "pay-6", nodeType: "approval", label: "财务确认薪资单", order: 5, config: { assignee: "finance", description: "财务确认薪资单并自动生成会计凭证" } },
      { id: "pay-7", nodeType: "auto", label: "自动生成会计凭证", order: 6, config: { description: "借:应付职工薪酬 贷:银行存款/其他应付款-社保/公积金/应交税费-个税" } },
      { id: "pay-8", nodeType: "auto", label: "导出银行付款Excel", order: 7, config: { description: "生成网银格式的薪资付款文件（员工姓名、银行、账号、实发金额）" } },
      { id: "pay-9", nodeType: "notification", label: "提醒导入网银", order: 8, config: { description: "通知出纳将付款Excel导入网银系统批量发薪" } },
      { id: "pay-10", nodeType: "auto", label: "银行付款确认", order: 9, config: { description: "确认银行已完成薪资发放" } },
      { id: "pay-11", nodeType: "auto", label: "自动清账入账", order: 10, config: { description: "银行付款确认后自动更新凭证状态，完成清账入账" } },
      { id: "pay-12", nodeType: "auto", label: "归档薪资记录", order: 11, config: { description: "薪资单、凭证、付款记录自动归档至数据中心" } },
    ],
  },
];

export const WORKFLOW_CATEGORIES = {
  operations: { labelZh: "运营管理", labelEn: "Operations" },
  supply_chain: { labelZh: "供应链", labelEn: "Supply Chain" },
  hr: { labelZh: "人事行政", labelEn: "HR & Admin" },
  finance: { labelZh: "财务管理", labelEn: "Finance" },
  legal: { labelZh: "法务合规", labelEn: "Legal" },
  marketing: { labelZh: "市场营销", labelEn: "Marketing" },
  stores: { labelZh: "门店管理", labelEn: "Store Mgmt" },
};
