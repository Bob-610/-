"use strict";

// 临时娱乐题库，待人工审核，并非经过验证的心理量表。
// 正分对应 E/S/T/J，负分对应 I/N/F/P。
// likert: 原始选择(-2…2) × direction；scenario: 直接使用选项 value。
// scenario 的 direction 固定为1；side 明确标明对应侧。
// id 为稳定答案键，可调整题目顺序，不要重复或随意改动 id。
const questions = [
  // EI：3道正向 + 3道反向量表
  { id: 1, type: "likert", dimension: "EI", direction: 1, text: "和一群朋友相处一段时间后，我往往更有精神。" },
  { id: 2, type: "likert", dimension: "EI", direction: -1, text: "一整天都在和人打交道后，我更想独处一会儿。" },
  { id: 3, type: "likert", dimension: "EI", direction: 1, text: "想到一件有趣的小事，我通常想马上找人聊聊。" },
  { id: 4, type: "likert", dimension: "EI", direction: -1, text: "在热闹的聚会里，我更喜欢和少数几个人深入聊下去。" },
  { id: 5, type: "likert", dimension: "EI", direction: 1, text: "讨论一个还没想清楚的问题时，我往往在说出想法、听到回应的过程中理清思路。" },
  { id: 6, type: "likert", dimension: "EI", direction: -1, text: "空闲时间完全属于自己、不需要与人互动时，我会觉得很自在。" },
  // SN：具体信息与关联、可能性的偏好
  { id: 7, type: "likert", dimension: "SN", direction: 1, text: "了解一个新概念时，具体例子比抽象解释更容易让我理解。" },
  { id: 8, type: "likert", dimension: "SN", direction: -1, text: "听别人讲一段经历时，我常会想到这件事背后反映的某种普遍现象。" },
  { id: 9, type: "likert", dimension: "SN", direction: 1, text: "向别人介绍一个地方时，我更自然地描述看到、听到的具体事物。" },
  { id: 10, type: "likert", dimension: "SN", direction: -1, text: "接触新信息时，我常会联想到表面上不太相关的事情。" },
  { id: 11, type: "likert", dimension: "SN", direction: 1, text: "学一个新工具时，我喜欢先照着实际操作示例试一遍。" },
  { id: 12, type: "likert", dimension: "SN", direction: -1, text: "比起一件事现在的样子，我更容易被它未来可能变成什么吸引。" },
  // TF：做判断时优先考虑的依据
  { id: 13, type: "likert", dimension: "TF", direction: 1, text: "在几个方案之间选择时，我通常先比较它们是否符合一致的标准。" },
  { id: 14, type: "likert", dimension: "TF", direction: -1, text: "判断一个涉及多人的决定是否合适时，我通常先看它对各人的实际处境意味着什么。" },
  { id: 15, type: "likert", dimension: "TF", direction: 1, text: "即使我喜欢一个观点，发现它的推理有矛盾时，我也倾向于先质疑它。" },
  { id: 16, type: "likert", dimension: "TF", direction: -1, text: "在两个各有利弊的选择之间，我通常先看哪个更符合自己在意的价值。" },
  { id: 17, type: "likert", dimension: "TF", direction: 1, text: "判断一个解释是否站得住脚时，我通常先看它的结论能否从给出的理由中推出来。" },
  { id: 18, type: "likert", dimension: "TF", direction: -1, text: "在需要取舍的决定中，我通常会把它对重要关系的影响作为优先考虑的依据。" },
  // JP：安排与开放性的偏好
  { id: 19, type: "likert", dimension: "JP", direction: 1, text: "确定出行日期后，我喜欢尽早把主要安排定下来。" },
  { id: 20, type: "likert", dimension: "JP", direction: -1, text: "没有必须完成的任务时，我喜欢让一天的安排随心情变化。" },
  { id: 21, type: "likert", dimension: "JP", direction: 1, text: "手头有几件事要做时，先排好顺序会让我更安心。" },
  { id: 22, type: "likert", dimension: "JP", direction: -1, text: "只要时间允许，我倾向于先保留几个选项，不急着定下来。" },
  { id: 23, type: "likert", dimension: "JP", direction: 1, text: "面对几个都可行的方向，选定其中一个、让接下来的方向明确下来，会让我更自在。" },
  { id: 24, type: "likert", dimension: "JP", direction: -1, text: "临时出现一个有趣的机会时，我愿意调整原来的日程。" },
  // EI场景：正分选项位置交替
  { id: 25, type: "scenario", dimension: "EI", direction: 1, text: "周末终于空出半天，两种安排都很方便，你更想：", options: [
    { text: "约几位朋友见面，在聊天中放松。", value: 2, side: "E" },
    { text: "给自己留一段不被打扰的时间。", value: -2, side: "I" }
  ] },
  { id: 26, type: "scenario", dimension: "EI", direction: 1, text: "参加兴趣活动时还没认识其他人，等待开始的这段时间，你更愿意：", options: [
    { text: "先自己看看现场，等有合适契机再聊。", value: -2, side: "I" },
    { text: "和身边的人聊聊怎么接触到这个兴趣的。", value: 2, side: "E" }
  ] },
  { id: 27, type: "scenario", dimension: "EI", direction: 1, text: "朋友聚会结束了，你还没有别的安排，这时更吸引你的是：", options: [
    { text: "再和几个人找个地方坐坐。", value: 2, side: "E" },
    { text: "回到自己的空间，享受安静。", value: -2, side: "I" }
  ] },
  { id: 28, type: "scenario", dimension: "EI", direction: 1, text: "加入一个话题群后，大家正在聊你感兴趣的内容，你通常更想：", options: [
    { text: "先读大家的讨论，有特别想说的再回复。", value: -2, side: "I" },
    { text: "直接加入交流，边聊边认识大家。", value: 2, side: "E" }
  ] },
  { id: 29, type: "scenario", dimension: "EI", direction: 1, text: "忙完一段让你有些疲惫的日常事务后，两种休息方式都很方便，你更想：", options: [
    { text: "和熟悉的人轻松聊一会儿，从交流中恢复精力。", value: 2, side: "E" },
    { text: "自己安静待一会儿，在不需要回应别人的状态下恢复精力。", value: -2, side: "I" }
  ] },
  { id: 30, type: "scenario", dimension: "EI", direction: 1, text: "连续几天都自己做事后，今晚有空，你更倾向于：", options: [
    { text: "继续享受独处，有需要时再联系朋友。", value: -2, side: "I" },
    { text: "找人一起吃饭，补充一些面对面的交流。", value: 2, side: "E" }
  ] },
  // SN场景
  { id: 31, type: "scenario", dimension: "SN", direction: 1, text: "朋友推荐了一款没用过的软件，你更想先了解：", options: [
    { text: "它在一个实际任务里具体怎么用。", value: 2, side: "S" },
    { text: "它的核心思路，以及还能拓展出哪些用法。", value: -2, side: "N" }
  ] },
  { id: 32, type: "scenario", dimension: "SN", direction: 1, text: "看完一场展览，朋友问你印象最深的是什么，你更容易谈起：", options: [
    { text: "作品之间的联系，以及它们让我想到的主题。", value: -2, side: "N" },
    { text: "某件作品的材质、颜色或呈现细节。", value: 2, side: "S" }
  ] },
  { id: 33, type: "scenario", dimension: "SN", direction: 1, text: "准备学做一道新菜，两种教程都很清楚，你更喜欢：", options: [
    { text: "把用量、火候和操作步骤逐一示范的教程。", value: 2, side: "S" },
    { text: "先讲食材搭配原理，再说明如何变化的教程。", value: -2, side: "N" }
  ] },
  { id: 34, type: "scenario", dimension: "SN", direction: 1, text: "朋友说想开一家特别的小店，你更自然地追问：", options: [
    { text: "想让它代表什么概念，还可能发展成什么？", value: -2, side: "N" },
    { text: "店里会有哪些东西，顾客进来会看到什么？", value: 2, side: "S" }
  ] },
  { id: 35, type: "scenario", dimension: "SN", direction: 1, text: "两篇文章都在讲同一种生活现象，你更容易被哪篇吸引？", options: [
    { text: "从几个具体人物的经历和观察讲起。", value: 2, side: "S" },
    { text: "从现象背后的规律和可能趋势讲起。", value: -2, side: "N" }
  ] },
  { id: 36, type: "scenario", dimension: "SN", direction: 1, text: "朋友说最近社区里几家店换了经营内容，你更自然地想了解：", options: [
    { text: "这些变化之间可能有什么联系，意味着怎样的趋势。", value: -2, side: "N" },
    { text: "具体是哪几家店，分别换成了什么，实际有哪些变化。", value: 2, side: "S" }
  ] },
  // TF场景：两侧均提供合理依据
  { id: 37, type: "scenario", dimension: "TF", direction: 1, text: "朋友问你两个实习机会怎么选，报酬和通勤差不多，你会先和他聊：", options: [
    { text: "两份工作的职责和发展条件分别如何。", value: 2, side: "T" },
    { text: "哪种工作氛围和日常内容更符合他的个人期待。", value: -2, side: "F" }
  ] },
  { id: 38, type: "scenario", dimension: "TF", direction: 1, text: "朋友请你评价刚完成的作品，你更自然的切入点是：", options: [
    { text: "先了解他想表达什么，再说自己的感受。", value: -2, side: "F" },
    { text: "先对照作品的目标，分析哪些地方达到了效果。", value: 2, side: "T" }
  ] },
  { id: 39, type: "scenario", dimension: "TF", direction: 1, text: "社团的名额分配规则遇到一个特殊个案，需要讨论是否破例，你会先关注：", options: [
    { text: "破例的依据能否同样适用于其他类似情况。", value: 2, side: "T" },
    { text: "当事人的具体处境，以及不同决定对他的影响。", value: -2, side: "F" }
  ] },
  { id: 40, type: "scenario", dimension: "TF", direction: 1, text: "两位朋友对同一件事有分歧，都请你说说看法，你更想先弄清：", options: [
    { text: "双方各自最在意什么，为什么这件事对他们重要。", value: -2, side: "F" },
    { text: "双方的说法分别基于哪些事实，推断是否成立。", value: 2, side: "T" }
  ] },
  { id: 41, type: "scenario", dimension: "TF", direction: 1, text: "你和朋友对一次共同决定有不同看法，重新讨论时，你更想先从哪里入手？", options: [
    { text: "说明各自判断的理由，比较这些理由是否前后一致。", value: 2, side: "T" },
    { text: "说明各自最在意的东西，比较这个决定对彼此的意义。", value: -2, side: "F" }
  ] },
  { id: 42, type: "scenario", dimension: "TF", direction: 1, text: "你在两个投入相近、都可行的个人项目之间选择。两者各有吸引你的地方，你更倾向于先：", options: [
    { text: "想清楚哪个更贴合自己在意的价值和想要的生活。", value: -2, side: "F" },
    { text: "明确比较两者的标准，再按这些标准权衡各自的利弊。", value: 2, side: "T" }
  ] },
  // JP场景
  { id: 43, type: "scenario", dimension: "JP", direction: 1, text: "去一个交通方便的城市玩一天，景点都不需预约，你更喜欢：", options: [
    { text: "先选好几个地点，大致排好游览顺序。", value: 2, side: "J" },
    { text: "先去一个感兴趣的地方，再决定接下来去哪。", value: -2, side: "P" }
  ] },
  { id: 44, type: "scenario", dimension: "JP", direction: 1, text: "你在挑选一门短期体验课，几门都合适，也都有名额。还可以继续试听，你更喜欢：", options: [
    { text: "先保留几个选择，再根据试听中的新体验决定。", value: -2, side: "P" },
    { text: "根据目前的了解选定一门，让这件事有个明确安排。", value: 2, side: "J" }
  ] },
  { id: 45, type: "scenario", dimension: "JP", direction: 1, text: "聚餐还有一周，几家餐厅都能随时订到，你更倾向于：", options: [
    { text: "现在就选定一家，结束这件待定的事。", value: 2, side: "J" },
    { text: "先留着几个备选，临近时再看想吃什么。", value: -2, side: "P" }
  ] },
  { id: 46, type: "scenario", dimension: "JP", direction: 1, text: "你有一个月完成个人小作品，时间比较充裕，你更喜欢：", options: [
    { text: "边做边尝试，让作品的走向逐渐成形。", value: -2, side: "P" },
    { text: "先确定大致成品和阶段安排，再逐步完成。", value: 2, side: "J" }
  ] },
  { id: 47, type: "scenario", dimension: "JP", direction: 1, text: "空闲时间原本安排了看电影，又发现附近有个有趣的活动，你更倾向于：", options: [
    { text: "按原来的安排看电影，活动留给下次。", value: 2, side: "J" },
    { text: "顺着此刻的兴趣，改去参加活动。", value: -2, side: "P" }
  ] },
  { id: 48, type: "scenario", dimension: "JP", direction: 1, text: "朋友一起筹备一次轻松的周末见面，两种方式都能顺利进行，你更喜欢：", options: [
    { text: "只约好碰面的时间地点，之后的活动现场再选。", value: -2, side: "P" },
    { text: "把见面后的主要活动也提前商量好。", value: 2, side: "J" }
  ] }
];
