/**
 * Calculator — Jurido
 * Full-featured calculator with standard & scientific modes.
 */

(() => {
  'use strict';

  // ── State ──────────────────────────────────────────
  let currentValue = '0';
  let previousValue = '';
  let operator = null;
  let shouldResetDisplay = false;
  let historyText = '';
  let scientificMode = false;

  // ── DOM References ─────────────────────────────────
  const displayCurrent = document.getElementById('display-current');
  const displayHistory = document.getElementById('display-history');
  const modeToggle = document.getElementById('mode-toggle');
  const scientificPanel = document.getElementById('scientific-panel');
  const calculator = document.getElementById('calculator');

  // ── Helpers ────────────────────────────────────────
  function formatNumber(num) {
    if (num === 'Error' || num === 'Infinity' || num === '-Infinity') return 'Erro';
    if (num === 'NaN') return 'Erro';

    const str = String(num);
    // If it's being typed (has trailing dot or operator context), return as-is
    if (str.includes('.') && str.endsWith('.')) return str.replace('.', ',');

    const n = parseFloat(str);
    if (isNaN(n)) return 'Erro';

    // Limit display precision
    let formatted;
    if (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-10 && n !== 0)) {
      formatted = n.toExponential(6);
    } else {
      // Remove unnecessary trailing zeros
      formatted = parseFloat(n.toPrecision(12)).toString();
    }

    return formatted.replace('.', ',');
  }

  function parseDisplay(val) {
    return val.replace(/,/g, '.').replace(/\s/g, '');
  }

  function updateDisplay() {
    const formatted = formatNumber(currentValue);
    displayCurrent.textContent = formatted;
    displayHistory.textContent = historyText;

    // Trigger pulse animation
    displayCurrent.classList.remove('pulse');
    void displayCurrent.offsetWidth; // force reflow
    displayCurrent.classList.add('pulse');
  }

  function clearAll() {
    currentValue = '0';
    previousValue = '';
    operator = null;
    shouldResetDisplay = false;
    historyText = '';
    updateDisplay();
    clearActiveOperator();
  }

  function clearActiveOperator() {
    document.querySelectorAll('.btn-operator').forEach(btn => btn.classList.remove('active'));
  }

  function setActiveOperator(action) {
    clearActiveOperator();
    const map = { add: 'btn-add', subtract: 'btn-subtract', multiply: 'btn-multiply', divide: 'btn-divide' };
    if (map[action]) {
      document.getElementById(map[action])?.classList.add('active');
    }
  }

  // ── Factorial ──────────────────────────────────────
  function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  // ── Core Calculation ───────────────────────────────
  function calculate(a, b, op) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return 'Error';

    switch (op) {
      case 'add':      return numA + numB;
      case 'subtract': return numA - numB;
      case 'multiply': return numA * numB;
      case 'divide':   return numB === 0 ? 'Error' : numA / numB;
      default:         return numB;
    }
  }

  function getOperatorSymbol(op) {
    const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
    return symbols[op] || '';
  }

  // ── Input Handlers ─────────────────────────────────
  function inputNumber(num) {
    if (shouldResetDisplay) {
      currentValue = num;
      shouldResetDisplay = false;
    } else {
      currentValue = currentValue === '0' ? num : currentValue + num;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (shouldResetDisplay) {
      currentValue = '0.';
      shouldResetDisplay = false;
    } else if (!currentValue.includes('.')) {
      currentValue += '.';
    }
    updateDisplay();
  }

  function inputOperator(op) {
    const current = parseFloat(currentValue);
    if (isNaN(current)) return;

    if (operator && !shouldResetDisplay) {
      const result = calculate(previousValue, currentValue, operator);
      if (result === 'Error') {
        clearAll();
        currentValue = 'Error';
        updateDisplay();
        return;
      }
      currentValue = String(result);
      previousValue = String(result);
    } else {
      previousValue = currentValue;
    }

    operator = op;
    shouldResetDisplay = true;
    historyText = `${formatNumber(previousValue)} ${getOperatorSymbol(op)}`;
    updateDisplay();
    setActiveOperator(op);
  }

  function inputEquals() {
    if (!operator || !previousValue) return;

    const result = calculate(previousValue, currentValue, operator);
    historyText = `${formatNumber(previousValue)} ${getOperatorSymbol(operator)} ${formatNumber(currentValue)} =`;

    if (result === 'Error') {
      currentValue = 'Error';
    } else {
      currentValue = String(result);
    }

    previousValue = '';
    operator = null;
    shouldResetDisplay = true;
    updateDisplay();
    clearActiveOperator();
  }

  function inputPercent() {
    const current = parseFloat(currentValue);
    if (isNaN(current)) return;

    if (operator && previousValue) {
      // e.g., 200 + 10% → 200 + 20
      currentValue = String((parseFloat(previousValue) * current) / 100);
    } else {
      currentValue = String(current / 100);
    }
    updateDisplay();
  }

  function inputBackspace() {
    if (shouldResetDisplay || currentValue === 'Error') {
      currentValue = '0';
      shouldResetDisplay = false;
    } else if (currentValue.length === 1 || (currentValue.length === 2 && currentValue[0] === '-')) {
      currentValue = '0';
    } else {
      currentValue = currentValue.slice(0, -1);
    }
    updateDisplay();
  }

  // ── Scientific Functions ───────────────────────────
  function inputScientific(action) {
    const val = parseFloat(currentValue);
    if (isNaN(val) && action !== 'pi' && action !== 'euler') return;

    let result;
    switch (action) {
      case 'sin':       result = Math.sin(val * Math.PI / 180); break; // degrees
      case 'cos':       result = Math.cos(val * Math.PI / 180); break;
      case 'tan':       result = Math.tan(val * Math.PI / 180); break;
      case 'log':       result = Math.log10(val); break;
      case 'ln':        result = Math.log(val); break;
      case 'sqrt':      result = Math.sqrt(val); break;
      case 'pow':       result = val * val; break;
      case 'pi':        result = Math.PI; break;
      case 'euler':     result = Math.E; break;
      case 'factorial': result = factorial(Math.floor(val)); break;
      default: return;
    }

    if (isNaN(result) || !isFinite(result)) {
      currentValue = 'Error';
    } else {
      const labels = { sin: 'sin', cos: 'cos', tan: 'tan', log: 'log', ln: 'ln', sqrt: '√', pow: 'x²', pi: 'π', euler: 'e', factorial: '!' };
      if (action === 'pi' || action === 'euler') {
        historyText = labels[action];
      } else {
        historyText = `${labels[action]}(${formatNumber(currentValue)})`;
      }
      currentValue = String(result);
    }

    shouldResetDisplay = true;
    updateDisplay();
  }

  // ── Toggle Scientific Mode ─────────────────────────
  modeToggle.addEventListener('click', () => {
    scientificMode = !scientificMode;
    modeToggle.classList.toggle('active', scientificMode);
    scientificPanel.classList.toggle('open', scientificMode);
  });

  // ── Button Click Handler ───────────────────────────
  calculator.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const action = btn.dataset.action;
    if (!action) return;

    // Haptic-like visual feedback
    btn.style.transform = 'scale(0.92)';
    setTimeout(() => { btn.style.transform = ''; }, 120);

    // Route action
    if (/^[0-9]$/.test(action)) {
      inputNumber(action);
    } else {
      switch (action) {
        case 'decimal':   inputDecimal(); break;
        case 'clear':     clearAll(); break;
        case 'backspace': inputBackspace(); break;
        case 'percent':   inputPercent(); break;
        case 'add':
        case 'subtract':
        case 'multiply':
        case 'divide':    inputOperator(action); break;
        case 'equals':    inputEquals(); break;
        // Scientific
        case 'sin': case 'cos': case 'tan':
        case 'log': case 'ln': case 'sqrt':
        case 'pow': case 'pi': case 'euler':
        case 'factorial':
          inputScientific(action); break;
      }
    }
  });

  // ── Keyboard Support ───────────────────────────────
  document.addEventListener('keydown', (e) => {
    const key = e.key;

    // Prevent default for calculator keys
    if (/^[0-9.+\-*\/=%]$/.test(key) || key === 'Enter' || key === 'Backspace' || key === 'Escape' || key === 'Delete') {
      e.preventDefault();
    }

    if (/^[0-9]$/.test(key)) {
      inputNumber(key);
      highlightButton(`btn-${key}`);
    } else if (key === '.' || key === ',') {
      inputDecimal();
      highlightButton('btn-decimal');
    } else if (key === '+') {
      inputOperator('add');
      highlightButton('btn-add');
    } else if (key === '-') {
      inputOperator('subtract');
      highlightButton('btn-subtract');
    } else if (key === '*') {
      inputOperator('multiply');
      highlightButton('btn-multiply');
    } else if (key === '/') {
      inputOperator('divide');
      highlightButton('btn-divide');
    } else if (key === 'Enter' || key === '=') {
      inputEquals();
      highlightButton('btn-equals');
    } else if (key === 'Backspace') {
      inputBackspace();
      highlightButton('btn-backspace');
    } else if (key === 'Escape' || key === 'Delete') {
      clearAll();
      highlightButton('btn-clear');
    } else if (key === '%') {
      inputPercent();
      highlightButton('btn-percent');
    }
  });

  function highlightButton(id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.add('pulse');
    btn.style.transform = 'scale(0.92)';
    setTimeout(() => {
      btn.classList.remove('pulse');
      btn.style.transform = '';
    }, 150);
  }

  // ── Initial render ─────────────────────────────────
  updateDisplay();
})();
