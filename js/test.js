"use strict";

const likertOptions = [
  { text: "非常不同意", value: -2 },
  { text: "比较不同意", value: -1 },
  { text: "中立 / 不确定", value: 0 },
  { text: "比较同意", value: 1 },
  { text: "非常同意", value: 2 }
];

// Answers use stable question IDs. rawValue restores the selection;
// value includes single-item direction; result scoring verifies raw selections again.
function createQuizState(questionList) {
  let currentIndex = 0;
  let answers = {};
  let completed = false;
  const hasAnswer = question => Object.hasOwn(answers, question.id);
  return {
    get currentIndex() { return currentIndex; },
    get currentQuestion() { return questionList[currentIndex]; },
    get currentAnswer() { return answers[this.currentQuestion.id]; },
    get answers() { return { ...answers }; },
    get answeredCount() { return questionList.filter(hasAnswer).length; },
    get completed() { return completed; },
    answer(rawValue) {
      if (completed) return;
      const question = this.currentQuestion;
      const choices = question.type === "likert" ? likertOptions : question.options;
      if (!choices.some(option => option.value === rawValue)) {
        throw new RangeError("当前题目的答案无效");
      }
      const value = question.type === "likert" ? rawValue * question.direction : rawValue;
      answers[question.id] = Object.freeze({
        rawValue,
        value: value === 0 ? 0 : value,
        dimension: question.dimension,
        side: value === 0 ? null : question.dimension[value > 0 ? 0 : 1]
      });
    },
    previous() {
      if (completed || currentIndex === 0) return false;
      currentIndex -= 1;
      return true;
    },
    next() {
      if (completed || !hasAnswer(this.currentQuestion)) return false;
      if (currentIndex < questionList.length - 1) {
        currentIndex += 1;
      } else {
        const missingIndex = questionList.findIndex(question => !hasAnswer(question));
        if (missingIndex !== -1) {
          currentIndex = missingIndex;
          return true;
        }
        completed = true;
      }
      return true;
    },
    review() { completed = false; },
    reset() {
      currentIndex = 0;
      answers = {};
      completed = false;
    }
  };
}

// Percentages express the normalized score, not a probability or diagnosis.
// Full ties always use the first letter (E/S/T/J), never randomness.
function calculateResult(questionList, answers) {
  const dimensions = ["EI", "SN", "TF", "JP"].map(dimension => {
    const items = questionList.filter(question => question.dimension === dimension);
    let total = 0;
    let likertTotal = 0;
    let scenarioBalance = 0;
    let maximum = 0;
    items.forEach(question => {
      const rawValue = answers[question.id]?.rawValue;
      const choices = question.type === "likert" ? likertOptions : question.options;
      const choice = choices.find(option => option.value === rawValue);
      if (!choice) throw new Error(`题目 ${question.id} 尚未作答或答案无效`);
      const value = question.type === "likert" ? rawValue * question.direction : choice.value;
      total += value;
      maximum += Math.max(...choices.map(option => Math.abs(option.value)));
      if (question.type === "likert") likertTotal += value;
      else scenarioBalance += Math.sign(value);
    });
    if (!maximum) throw new Error(`维度 ${dimension} 没有可计分题目`);
    const decision = total || likertTotal || scenarioBalance;
    const positivePercent = Math.round((total + maximum) / (2 * maximum) * 100);
    return {
      dimension, total, maximum, likertTotal, scenarioBalance,
      positivePercent, negativePercent: 100 - positivePercent,
      letter: dimension[decision < 0 ? 1 : 0],
      balanced: total === 0,
      tieBreak: total !== 0 ? "total" : likertTotal !== 0 ? "likert" : scenarioBalance !== 0 ? "scenario" : "fixed"
    };
  });
  return { type: dimensions.map(item => item.letter).join(""), dimensions };
}

function renderResult(result) {
  const profile = personalities[result.type];
  if (!profile) throw new Error("缺少人格资料");
  document.querySelector("#result-type").textContent = profile.type;
  document.querySelector("#complete-title").textContent = profile.nickname;
  document.querySelector("#result-symbol").textContent = profile.symbol;
  document.querySelector("#result-summary").textContent = profile.summary;
  const keywords = document.querySelector("#result-keywords");
  keywords.replaceChildren();
  profile.keywords.forEach(word => {
    const item = document.createElement("li");
    item.textContent = word;
    keywords.append(item);
  });
  const dimensions = document.querySelector("#result-dimensions");
  dimensions.replaceChildren();
  const labels = { EI: ["外向", "内向"], SN: ["实感", "直觉"], TF: ["思考", "情感"], JP: ["判断", "感知"] };
  result.dimensions.forEach(item => {
    const row = document.createElement("div");
    row.className = "dimension-row";
    const nearBalance = Math.abs(item.positivePercent - 50) <= 5;
    row.dataset.balance = nearBalance ? "balanced" : "dominant";
    const heading = document.createElement("div");
    heading.className = "dimension-labels";
    [item.positivePercent, item.negativePercent].forEach((percent, index) => {
      const label = document.createElement("span");
      label.className = "dimension-side";
      if (!nearBalance && percent > 50) label.classList.add("is-dominant");
      const letter = document.createElement("b");
      letter.textContent = item.dimension[index];
      const name = document.createElement("span");
      name.textContent = labels[item.dimension][index];
      const number = document.createElement("strong");
      number.textContent = `${percent}%`;
      label.append(letter, name, number);
      heading.append(label);
    });
    const bar = document.createElement("div");
    bar.className = "dimension-bar";
    bar.setAttribute("aria-hidden", "true");
    [item.positivePercent, item.negativePercent].forEach(percent => {
      const segment = document.createElement("span");
      segment.className = "dimension-segment";
      if (!nearBalance && percent > 50) segment.classList.add("is-dominant");
      segment.style.width = `${percent}%`;
      bar.append(segment);
    });
    row.append(heading, bar);
    if (item.balanced) {
      const note = document.createElement("p");
      note.className = "balance-note";
      const rule = { likert: "按量表题倾向", scenario: "按场景选择倾向", fixed: "按固定规则" }[item.tieBreak];
      note.textContent = `该维度接近均衡 · ${rule}取 ${item.letter}`;
      row.append(note);
    }
    dimensions.append(row);
  });
  const details = document.querySelector("#result-details");
  details.replaceChildren();
  const groups = [
    ["关系与连接", [["friendship", "友情模式"], ["love", "恋爱模式"], ["othersSeeYou", "别人眼中的你"]]],
    ["行动方式", [["studyWork", "学习 / 工作模式"], ["stress", "压力状态"]]],
    ["内在侧写", [["hiddenTrait", "隐藏属性"], ["roast", "朋友吐槽点"]]]
  ];
  groups.forEach(([title, sections], index) => {
    const group = document.createElement("section");
    group.className = "result-group";
    const groupTitle = document.createElement("h3");
    groupTitle.className = "result-group-title";
    groupTitle.id = `result-group-${index}`;
    groupTitle.textContent = `${String(index + 1).padStart(2, "0")} / ${title}`;
    group.setAttribute("aria-labelledby", groupTitle.id);
    const grid = document.createElement("div");
    grid.className = "result-group-grid";
    sections.forEach(([key, label]) => {
      const card = document.createElement("article");
      card.className = `result-detail result-detail--${key}`;
      const heading = document.createElement("h4");
      heading.textContent = label;
      if (key === "roast") {
        const star = document.createElement("span");
        star.className = "roast-star";
        star.setAttribute("aria-hidden", "true");
        star.textContent = "✧";
        heading.prepend(star);
      }
      const text = document.createElement("p");
      text.textContent = profile[key];
      card.append(heading, text);
      grid.append(card);
    });
    group.append(groupTitle, grid);
    details.append(group);
  });

  window.atlasShare.setResult(result, profile);
}

function initializeQuiz() {
  const quiz = createQuizState(questions);
  const homePage = document.querySelector("#home-page");
  const testPage = document.querySelector("#test-page");
  const completePage = document.querySelector("#complete-page");
  const questionTitle = document.querySelector("#question-title");
  const optionsContainer = document.querySelector(".options");
  const progress = document.querySelector(".test-progress");
  const previousButton = document.querySelector("#previous-question");
  const nextButton = document.querySelector("#next-question");
  const progressNote = document.querySelector("#progress-note");

  function updateAnswerDisplay() {
    const selectedValue = quiz.currentAnswer?.rawValue;
    optionsContainer.querySelectorAll(".option-button").forEach(button => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.value) === selectedValue));
    });
    nextButton.disabled = !quiz.currentAnswer;
    progress.value = quiz.answeredCount;
    progress.textContent = `${quiz.answeredCount} / ${questions.length}`;
    progress.setAttribute("aria-label", `已完成 ${quiz.answeredCount} 题，共 ${questions.length} 题`);
    progressNote.textContent = `已答 ${quiz.answeredCount} / ${questions.length} 题 · 可返回修改答案`;
  }

  function renderQuestion() {
    const question = quiz.currentQuestion;
    const isLikert = question.type === "likert";
    const number = quiz.currentIndex + 1;
    document.querySelector("#current-number").textContent = number;
    document.querySelector("#question-number").textContent = `QUESTION ${String(number).padStart(2, "0")}`;
    document.querySelector("#question-type").textContent = isLikert ? "五级量表 ✧" : "情境选择 ✧";
    questionTitle.textContent = question.text;
    document.querySelector(".question-hint").textContent = isLikert
      ? "没有标准答案，选择更接近你的感受。"
      : "两种选择都可以，选更接近你通常做法的一项。";
    document.querySelector(".scale-labels").hidden = !isLikert;
    optionsContainer.classList.toggle("scenario-options", !isLikert);
    optionsContainer.replaceChildren();
    const choices = isLikert ? likertOptions : question.options;
    choices.forEach(choice => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";
      button.dataset.value = choice.value;
      const label = document.createElement("span");
      label.textContent = choice.text;
      const mark = document.createElement("span");
      mark.className = "option-mark";
      mark.setAttribute("aria-hidden", "true");
      button.append(label, mark);
      button.addEventListener("click", () => {
        quiz.answer(choice.value);
        updateAnswerDisplay();
      });
      optionsContainer.append(button);
    });
    previousButton.disabled = quiz.currentIndex === 0;
    document.querySelector("#next-label").textContent = number === questions.length ? "完成测试" : "下一题";
    updateAnswerDisplay();
    questionTitle.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function showTest() {
    window.atlasShare.clear();
    ["#result-type", "#complete-title", "#result-symbol", "#result-summary", "#result-keywords", "#result-dimensions", "#result-details"].forEach(selector => {
      document.querySelector(selector).replaceChildren();
    });
    homePage.hidden = true;
    completePage.hidden = true;
    testPage.hidden = false;
    renderQuestion();
  }

  document.querySelector("#start-test").addEventListener("click", () => {
    quiz.reset();
    showTest();
  });
  previousButton.addEventListener("click", () => {
    if (quiz.previous()) renderQuestion();
  });
  nextButton.addEventListener("click", () => {
    if (!quiz.next()) return;
    if (quiz.completed) {
      renderResult(calculateResult(questions, quiz.answers));
      testPage.hidden = true;
      completePage.hidden = false;
      document.querySelector("#complete-title").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      renderQuestion();
    }
  });
  document.querySelector("#review-answers").addEventListener("click", () => {
    quiz.review();
    showTest();
  });
  document.querySelector("#restart-test").addEventListener("click", () => {
    quiz.reset();
    showTest();
  });
}

if (typeof document !== "undefined") initializeQuiz();
