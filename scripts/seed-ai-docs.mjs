// scripts/seed-ai-docs.mjs
// 批量创建 "AI 从 0 到 1 建设" 主题测试文档到运行中的 Docmost。
//
// 用法:
//   node scripts/seed-ai-docs.mjs --email <email> --password <password> [--base http://localhost:3000] [--limit 50]
//
// 说明:
//   - 通过 POST /api/auth/login 拿到 authToken cookie,后续以 Bearer 方式鉴权。
//   - 自动取账号可访问的第一个空间,所有页面建在该空间根级。
//   - 页面内容用 markdown 格式提交,服务端自动转 ProseMirror JSON / text_content(可被搜索)。
//   - 每篇正文会反复出现 AI / 模型 / 数据 / 训练 / 评测 / 部署 / 监控 等关键词,
//     便于验证 spotlight 联想词与摘要高亮。

import { URL } from "node:url";

// ---------- 参数解析 ----------
const args = parseArgs(process.argv.slice(2));
const BASE = args.base || "http://localhost:3000";
const EMAIL = args.email;
const PASSWORD = args.password;
const LIMIT = Number(args.limit || 50);

if (!EMAIL || !PASSWORD) {
  console.error("用法: node scripts/seed-ai-docs.mjs --email <email> --password <password> [--base URL] [--limit N]");
  process.exit(1);
}

// ---------- 文档内容定义(50 篇,按阶段分组) ----------
// 每项: { title, icon, body }。body 为 markdown 字符串。
const DOCS = buildDocs();

// ---------- 主流程 ----------
main().catch((err) => {
  console.error("❌ 失败:", err?.message || err);
  process.exit(1);
});

async function main() {
  console.log(`▶ 目标: ${BASE}`);
  console.log(`▶ 计划创建: ${Math.min(LIMIT, DOCS.length)} 篇`);

  // 1. 登录拿 token
  const token = await login(EMAIL, PASSWORD);
  console.log("✓ 登录成功");

  // 2. 取第一个空间;若账号没有任何空间成员关系,则新建一个专属空间(admin 有 workspace 管理权限即可)
  let spaceId = await firstSpaceId(token);
  if (spaceId) {
    console.log(`✓ 使用现有空间 ID: ${spaceId}`);
  } else {
    console.log("• 账号无可见空间,尝试新建专属空间...");
    // 用时间戳生成唯一 slug,避免命中历史遗留的孤儿空间
    const uniq = String(Date.now()).slice(-6);
    spaceId = await createSpace(token, `AI 建设文档 ${uniq}`, `aiBuildDocs${uniq}`);
    if (!spaceId) throw new Error("新建空间失败");
    console.log(`✓ 新建空间 ID: ${spaceId}`);
  }

  // 3. 批量建页
  let ok = 0;
  let fail = 0;
  const docs = DOCS.slice(0, LIMIT);
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    try {
      const page = await createPage(token, {
        spaceId,
        title: d.title,
        icon: d.icon,
        content: d.body,
        format: "markdown",
      });
      ok++;
      console.log(`  [${i + 1}/${docs.length}] ✓ ${d.title}  (id=${page.id || page.slugId})`);
    } catch (e) {
      fail++;
      console.error(`  [${i + 1}/${docs.length}] ✗ ${d.title}  -> ${e.message}`);
    }
    // 简单限速,避免压垮后端
    await sleep(80);
  }

  console.log(`\n✅ 完成: 成功 ${ok},失败 ${fail}`);
  console.log("提示: 现在可以在 spotlight(Ctrl/Cmd+K)搜索 AI/模型/数据/训练/部署 等关键词验证联想与摘要。");
}

// ---------- HTTP 辅助 ----------
async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const txt = await safeText(res);
    throw new Error(`登录失败 ${res.status}: ${txt}`);
  }
  const setCookie = res.headers.get("set-cookie") || "";
  const m = /authToken=([^;]+)/.exec(setCookie);
  if (!m) throw new Error("登录响应未包含 authToken cookie");
  return m[1];
}

// 全局响应拦截器把所有响应包成 { data, success, status },这里统一解包
async function unwrap(res) {
  const json = await res.json();
  // 兼容带 {data,success,status} 包装 与 裸对象 两种情况
  return json && typeof json === "object" && "data" in json && "success" in json
    ? json.data
    : json;
}

async function firstSpaceId(token) {
  const res = await fetch(`${BASE}/api/spaces`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ limit: 100 }),
  });
  if (!res.ok) throw new Error(`获取空间失败 ${res.status}: ${await safeText(res)}`);
  const data = await unwrap(res);
  const items = data.items || [];
  return items.length > 0 ? items[0].id : null;
}

async function createSpace(token, name, slug) {
  const res = await fetch(`${BASE}/api/spaces/create`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ name, slug }),
  });
  const txt = await safeText(res);
  if (!res.ok) {
    // slug 已存在视为成功(之前跑过),后续 firstSpaceId 会复用已有空间
    if (res.status === 400 && /slug/i.test(txt)) {
      console.log("• 空间已存在,复用");
      return null;
    }
    throw new Error(`创建空间失败 ${res.status}: ${txt}`);
  }
  const data = await unwrap(res);
  return data.id;
}

async function createPage(token, payload) {
  const res = await fetch(`${BASE}/api/pages/create`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`创建页面失败 ${res.status}: ${await safeText(res)}`);
  return unwrap(res);
}

function jsonHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function safeText(res) {
  try { return await res.text(); } catch { return ""; }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      out[key] = argv[i + 1];
      i++;
    }
  }
  return out;
}

// ---------- 50 篇文档内容 ----------
function buildDocs() {
  // 通用段落模板,反复使用高频关键词,制造搜索/联想信号
  const para = (topic, extra = "") =>
    `本篇聚焦 AI 项目中的${topic}环节。在从 0 到 1 建设 AI 系统的过程中,` +
    `${topic}直接决定了模型最终的可用性与数据质量。团队需要在数据、模型、训练、评测、部署、监控之间反复权衡,` +
    `才能让 AI 真正落地。${extra}`;

  const closing =
    "\n\n## 小结\n\nAI 建设不是一次性工程,数据、模型、训练、评测、部署、监控构成闭环。每个阶段都应留下可复用的资产与文档,便于下一轮迭代。";

  // 每个阶段若干篇,共 50 篇
  const stages = [
    // 1. 规划与立项 (7)
    ["📋", "AI 项目立项与可行性评估", "规划",
      "立项阶段需明确 AI 项目的业务目标、成功指标与 ROI。可行性评估要回答:该问题是否适合用 AI 解决?是否有足够数据?模型精度门槛是多少?建议产出立项文档与里程碑计划。"],
    ["🎯", "AI 项目目标定义与北极星指标", "规划",
      "目标定义要区分业务指标(如转化率、人工替代率)与模型指标(如 F1、AUC)。北极星指标应单一、可量化、与业务价值强相关,避免只追求模型精度而忽视实际收益。"],
    ["👥", "AI 团队角色与职责划分", "规划",
      "典型 AI 团队包含数据工程师、算法工程师、评测工程师、平台工程师与产品经理。小团队可一人多岗,但数据与评测两个角色不可省略,它们是模型质量的护栏。"],
    ["📅", "AI 项目里程碑与迭代节奏", "规划",
      "建议采用 2-4 周一个迭代,每个迭代交付一个可演示的模型版本。里程碑应包含数据就绪、模型基线、内部评测、灰度上线、全量发布等节点。"],
    ["💰", "AI 项目成本与资源估算", "规划",
      "成本包括数据采购/标注、算力(GPU 训练与推理)、人力、存储与监控。从 0 到 1 阶段建议预留 30% 缓冲,模型迭代往往会消耗超出预期的算力。"],
    ["⚠️", "AI 项目风险登记表", "规划",
      "风险涵盖数据合规、模型偏见、性能不达标、线上漂移、依赖供应商等。每项风险需有负责人、触发条件与应对预案,定期复盘更新。"],
    ["📐", "AI 系统总体架构设计", "规划",
      "总体架构应划分数据层、特征层、模型层、服务层与应用层。从 0 到 1 时优先保证链路打通,再逐步拆分微服务与特征平台。"],

    // 2. 数据准备 (8)
    ["🗄️", "数据采集策略与来源", "数据",
      "数据采集要兼顾覆盖度与代表性。来源包括业务日志、公开数据集、爬虫、第三方采购与人工采集。每条数据需记录来源与授权,便于后续合规审计。"],
    ["🏷️", "数据标注规范设计", "数据",
      "标注规范是模型质量的基石。需定义标签体系、边界情况、标注示例与多人一致性要求。建议先小规模试标,再固化规范,避免大规模返工。"],
    ["✅", "标注质量控制与一致性", "数据",
      "通过双盲标注、一致性系数(如 Cohen's Kappa)、抽检复核控制质量。低一致性样本需讨论修订规范,而非简单剔除。"],
    ["🧹", "数据清洗与去重", "数据",
      "清洗包括去除乱码、去重、过滤低质量样本、统一编码与格式。去重对训练至关重要,重复数据会让模型过拟合并虚高评测分数。"],
    ["⚖️", "数据集划分:训练/验证/测试", "数据",
      "划分应避免数据泄漏,时间序列需按时间切分。测试集必须独立、不参与任何调参,否则模型线上表现会显著低于离线评测。"],
    ["🔒", "数据合规与隐私保护", "数据",
      "涉及个人信息的数据需脱敏、去标识化,符合当地法规(如个人信息保护法)。敏感数据应分级存储、访问留痕,训练前完成合规评审。"],
    ["📊", "数据分布与偏差分析", "数据",
      "统计各子群体样本量与标签分布,识别长尾与偏差。偏差会直接导致模型对某些群体表现差,需在数据或训练阶段补偿。"],
    ["🗂️", "数据资产目录与版本管理", "数据",
      "建立数据资产目录,记录每个数据集的版本、来源、规模、用途与负责人。版本化便于复现实验与回滚模型。"],

    // 3. 特征工程 (5)
    ["🔢", "特征设计原则", "特征",
      "特征应具备区分度、稳定性和可解释性。从 0 到 1 阶段优先用领域知识构造强特征,再补充自动特征,避免一上来就堆砌高维稀疏特征。"],
    ["🏭", "特征平台与离线在线一致性", "特征",
      "特征平台要保证离线训练与在线推理特征一致。常见坑:离线用全量统计,在线只能用历史窗口,导致训练/服务偏差。"],
    ["📈", "特征统计与监控", "特征",
      "上线后监控特征分布、缺失率、零方差特征。分布漂移会拖累模型,需触发再训练或特征下线。"],
    ["🔍", "特征选择与降维", "特征",
      "用相关性、重要性、方差等手段筛选特征。降维(PCA/嵌入)可缓解维度灾难,但牺牲可解释性,需权衡。"],
    ["📚", "特征文档与复用", "特征",
      "每个特征应文档化:定义、计算逻辑、取值范围、更新频率。便于跨团队复用,避免重复造轮子。"],

    // 4. 模型训练 (8)
    ["🧠", "模型选型:从规则到深度学习", "训练",
      "选型应从简单到复杂:规则 → 机器学习 → 深度学习。从 0 到 1 时先用强基线(如逻辑回归、梯度提升树)跑通链路,再考虑深度模型。"],
    ["⚙️", "训练流程与超参数", "训练",
      "训练流程包括数据加载、特征构造、模型训练、评估、保存。超参数(学习率、batch size、正则)用验证集调优,避免在测试集上调参。"],
    ["🔁", "实验管理与可复现", "训练",
      "每次实验记录代码版本、数据版本、超参数与结果。可复现是 AI 工程化的前提,不可复现的实验等于没做。"],
    ["⚖️", "过拟合与欠拟合诊断", "训练",
      "训练误差远低于验证误差为过拟合,需加正则、增数据、减模型复杂度;两者都高为欠拟合,需加特征或换更强模型。"],
    ["🚀", "分布式训练与加速", "训练",
      "大数据集或大模型需分布式训练。注意数据并行与模型并行的通信开销,batch size 放大需同步调整学习率。"],
    ["🎯", "损失函数与指标选择", "训练",
      "损失函数要与业务目标对齐。类别不平衡时勿用准确率,改用 F1/AUC/PR-AUC,并在损失上加权或采样。"],
    ["🧪", "基线模型与快速迭代", "训练",
      "先建立强基线,所有新模型必须超越基线才能上线。基线让迭代有参照,避免被复杂模型的不显著提升误导。"],
    ["📦", "模型产物与版本", "训练",
      "训练产物含模型权重、配置、特征清单与依赖。版本化存储,推理时按版本加载,便于回滚与 A/B。"],

    // 5. 模型微调与优化 (5)
["🔧", "微调策略:全量与参数高效", "微调",
  "微调分全量微调与参数高效(LoRA/Adapter)。从 0 到 1 时数据有限,参数高效微调更稳,且便于多任务切换。"],
["💡", "提示工程与上下文设计", "微调",
  "大模型场景下,提示工程是低成本提升手段。结构化提示、少样本示例、思维链能显著改善效果,应先于微调尝试。"],
["📉", "学习率调度与预热", "微调",
  "微调大模型建议用小学习率 + warmup + 余弦衰减。学习率过大易灾难性遗忘,过小则收敛慢。"],
["🧱", "灾难性遗忘应对", "微调",
  "微调新任务可能遗忘旧能力。应对:混合旧数据、低学习率、参数高效微调、定期回测旧任务。"],
["📊", "微调效果评测与回退", "微调",
  "微调后必须在旧任务 + 新任务上同时评测。若旧任务显著下降且无法接受,应回退到上一版本。"],

    // 6. 评测 (6)
["📏", "离线评测体系设计", "评测",
  "评测体系应包含自动指标 + 人工评估。自动指标快但粗,人工评估准但贵。两者结合才能全面反映模型质量。"],
["🎯", "评测集构建与防泄漏", "评测",
  "评测集要覆盖业务场景与边界情况,严格与训练集隔离。时间相关数据按时间切分,避免未来信息泄漏。"],
["👤", "人工评估与标注一致性", "评测",
  "人工评估需统一 rubric,多人标注计算一致性。争议样本用于迭代规范,提升评估信度。"],
["📉", "bad case 分析", "评测",
  "bad case 是模型改进的金矿。按错误类型聚类,定位是数据、特征还是模型问题,针对性修复。"],
["🔬", "A/B 测试设计", "评测",
  "线上 A/B 是最终裁判。需定义主指标、分流策略、实验周期与显著性阈值,避免提前停止或假阳性。"],
["📋", "模型评测报告模板", "评测",
  "评测报告应含:数据集说明、指标结果、子群体表现、bad case、与基线对比、上线建议。标准化便于决策。"],

    // 7. 部署与服务 (6)
["🚀", "模型部署架构", "部署",
  "部署架构分在线推理服务与离线批量推理。在线追求低延迟,需模型压缩与并发优化;离线追求吞吐,可用更大模型。"],
["⚡", "推理性能优化", "部署",
  "优化手段:量化(INT8/FP16)、蒸馏、算子融合、批处理、缓存。从 0 到 1 先保证正确,再优化延迟与成本。"],
["📦", "模型服务化与 API 设计", "部署",
  "模型封装为服务,API 设计要稳定、可版本化。输入校验、限流、超时、降级必不可少,避免模型拖垮整体系统。"],
["🔄", "灰度发布与回滚", "部署",
  "新模型先灰度小流量,观察指标再全量。回滚机制必须自动化,发现异常立即切回旧版本,缩短故障时间。"],
["🌐", "多环境管理(dev/staging/prod)", "部署",
  "多环境隔离数据与模型,prod 禁止直接调试。环境一致性靠容器与配置管理,避免环境差异导致的线上问题。"],
["🏷️", "模型版本路由与多模型共存", "部署",
  "支持多版本模型共存,按流量或请求特征路由。便于 A/B、灰度与回滚,也支持不同客户用不同模型。"],

    // 8. 监控与运维 (5)
["📡", "线上监控体系", "监控",
  "监控覆盖输入分布、特征分布、预测分布、业务指标与系统指标。分布漂移与指标下降需告警,触发排查或再训练。"],
["🌀", "数据漂移与概念漂移检测", "监控",
  "数据漂移是输入分布变化,概念漂移是输入-输出关系变化。定期统计分布距离(如 PSI、KL),超阈值告警。"],
["🛠️", "故障排查与应急", "监控",
  "建立故障排查手册:常见症状、定位步骤、临时措施。模型故障往往表现为指标缓降,需结合监控与日志定位。"],
["🔁", "持续训练与再训练策略", "监控",
  "漂移显著时需再训练。策略分定时再训练与触发式再训练,均需自动化流水线,保证数据-训练-评测-部署闭环。"],
["📝", "AI 运维知识库", "监控",
  "沉淀故障案例、排查经验、调参心得。知识库让团队运维能力可传承,减少对个别成员的依赖。"],
  ];

  return stages.map(([icon, title, topic, body]) => ({
    icon,
    title,
    body: `# ${title}\n\n${para(topic, body)}${closing}`,
  }));
}
