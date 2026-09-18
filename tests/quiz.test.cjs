const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({});
for (const file of ['js/questions.js', 'js/test.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
}
const run = code => vm.runInContext(code, context);

test('48 unique questions, balanced dimensions, types and directions', () => {
  assert.equal(run('questions.length'), 48);
  assert.equal(run('new Set(questions.map(q => q.id)).size'), 48);
  for (const dimension of ['EI', 'SN', 'TF', 'JP']) {
    for (const type of ['likert', 'scenario']) {
      assert.equal(run(`questions.filter(q => q.dimension === '${dimension}' && q.type === '${type}').length`), 6);
    }
    for (const direction of [-1, 1]) {
      assert.equal(run(`questions.filter(q => q.dimension === '${dimension}' && q.type === 'likert' && q.direction === ${direction}).length`), 3);
    }
  }
  assert.equal(run(`questions.every(q => q.text && [1, -1].includes(q.direction) && (q.type !== 'scenario' || (q.options.length === 2 && q.options.some(o => o.value === 2 && o.side === q.dimension[0]) && q.options.some(o => o.value === -2 && o.side === q.dimension[1]))))`), true);
});

test('unanswered gating, neutral answer, back navigation and overwrite', () => {
  run('globalThis.quiz = createQuizState(questions)');
  assert.equal(run('quiz.previous()'), false);
  assert.equal(run('quiz.next()'), false);
  run('quiz.answer(0)');
  assert.equal(run('quiz.answeredCount'), 1);
  assert.equal(run('quiz.next()'), true);
  assert.equal(run('quiz.currentIndex'), 1);
  run('quiz.previous()');
  assert.equal(run('quiz.currentAnswer.rawValue'), 0);
  run('quiz.answer(2)');
  assert.equal(run('quiz.currentAnswer.rawValue'), 2);
  assert.equal(run('quiz.answeredCount'), 1);
});

test('reverse scoring and both scenario sides', () => {
  run('globalThis.reverse = createQuizState(questions.filter(q => q.type === "likert" && q.direction === -1))');
  run('reverse.answer(2)');
  assert.equal(run('reverse.currentAnswer.value'), -2);
  run('reverse.answer(-1)');
  assert.equal(run('reverse.currentAnswer.value'), 1);
  run('globalThis.scenario = createQuizState(questions.filter(q => q.type === "scenario"))');
  for (const value of [-2, 2]) {
    run(`scenario.answer(${value})`);
    assert.equal(run('scenario.currentAnswer.value'), value);
    assert.equal(run('scenario.currentAnswer.side'), run(`scenario.currentQuestion.dimension[${value === 2 ? 0 : 1}]`));
  }
  assert.throws(() => run('scenario.answer(0)'));
});

test('all 48 answers required, final completion, review and reset', () => {
  run('globalThis.full = createQuizState(questions)');
  for (let i = 0; i < 48; i++) {
    assert.equal(run('full.currentIndex'), i);
    assert.equal(run('full.completed'), false);
    assert.equal(run('full.next()'), false);
    run('full.answer(2)');
    assert.equal(run('full.next()'), true);
  }
  assert.equal(run('full.completed'), true);
  assert.equal(run('full.answeredCount'), 48);
  assert.equal(run('full.currentIndex'), 47);
  assert.equal(run('full.next()'), false);
  run('full.review(); full.answer(-2)');
  assert.equal(run('full.currentAnswer.value'), -2);
  assert.equal(run('full.answeredCount'), 48);
  run('full.next()');
  assert.equal(run('full.completed'), true);
  run('full.reset()');
  assert.equal(run('full.currentIndex'), 0);
  assert.equal(run('full.answeredCount'), 0);
  assert.equal(run('full.completed'), false);
});
