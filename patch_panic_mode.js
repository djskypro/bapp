const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. ADD THE CALCULATOR HTML & CSS
const calcHTML = `
<style>
  #fake-calculator {
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: #000;
    z-index: 9999999;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  #calc-display {
    flex: 1;
    color: white;
    font-size: 80px;
    font-weight: 300;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    padding: 20px 30px;
    overflow: hidden;
    white-space: nowrap;
  }
  #calc-keys {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    padding: 20px;
    padding-bottom: 40px;
  }
  .calc-btn {
    background: #333;
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 32px;
    height: 75px;
    width: 75px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
  }
  .calc-btn:active { background: #555; }
  .calc-btn.op { background: #ff9f0a; color: white; }
  .calc-btn.op:active { background: #ffb340; }
  .calc-btn.top { background: #a5a5a5; color: black; }
  .calc-btn.top:active { background: #d4d4d2; }
  .calc-btn.zero { grid-column: span 2; width: 180px; border-radius: 40px; justify-content: flex-start; padding-left: 30px; }
</style>

<div id="fake-calculator">
  <div id="calc-display">0</div>
  <div id="calc-keys">
    <button class="calc-btn top" onclick="calcClear()">C</button>
    <button class="calc-btn top" onclick="calcNegate()">+/-</button>
    <button class="calc-btn top" onclick="calcPercent()">%</button>
    <button class="calc-btn op" onclick="calcInput('÷')">÷</button>
    
    <button class="calc-btn" onclick="calcInput('7')">7</button>
    <button class="calc-btn" onclick="calcInput('8')">8</button>
    <button class="calc-btn" onclick="calcInput('9')">9</button>
    <button class="calc-btn op" onclick="calcInput('×')">×</button>
    
    <button class="calc-btn" onclick="calcInput('4')">4</button>
    <button class="calc-btn" onclick="calcInput('5')">5</button>
    <button class="calc-btn" onclick="calcInput('6')">6</button>
    <button class="calc-btn op" onclick="calcInput('-')">−</button>
    
    <button class="calc-btn" onclick="calcInput('1')">1</button>
    <button class="calc-btn" onclick="calcInput('2')">2</button>
    <button class="calc-btn" onclick="calcInput('3')">3</button>
    <button class="calc-btn op" onclick="calcInput('+')">+</button>
    
    <button class="calc-btn zero" onclick="calcInput('0')">0</button>
    <button class="calc-btn" onclick="calcInput('.')">.</button>
    <button class="calc-btn op" onclick="calcEquals()">=</button>
  </div>
</div>
`;

// Inject right after <body>
html = html.replace('<body>', '<body>\n' + calcHTML);

// 2. ADD THE PANIC LOGIC & SHAKE DETECTOR
const panicJS = `
  // --- PANIC MODE (FAKE CALCULATOR) ---
  let calcStr = "";
  let lastShake = 0;

  // Shake detection
  window.addEventListener('devicemotion', function(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    // Calculate the force of the movement
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    const now = Date.now();
    
    // If the force is strong and we haven't shaken in the last 2 seconds
    if (force > 35 && (now - lastShake) > 2000) {
      lastShake = now;
      document.getElementById('fake-calculator').style.display = 'flex';
    }
  });

  // Calculator Logic
  function updateCalcDisplay() {
    document.getElementById('calc-display').innerText = calcStr || "0";
  }

  function calcClear() {
    calcStr = "";
    updateCalcDisplay();
  }

  function calcInput(char) {
    // Prevent multiple operators in a row for realism
    if (['+', '-', '×', '÷'].includes(char)) {
      if (calcStr === "" || ['+', '-', '×', '÷'].includes(calcStr.slice(-1))) return;
    }
    calcStr += char;
    updateCalcDisplay();
  }

  function calcEquals() {
    // SECRET EXIT CODE
    if (calcStr === "1234") {
      document.getElementById('fake-calculator').style.display = 'none';
      calcStr = "";
      updateCalcDisplay();
      return;
    }

    // Real math
    try {
      let mathStr = calcStr.replace(/×/g, '*').replace(/÷/g, '/');
      let result = eval(mathStr);
      calcStr = String(result);
      updateCalcDisplay();
    } catch(e) {
      calcStr = "Error";
      updateCalcDisplay();
      setTimeout(calcClear, 1500);
    }
  }

  function calcNegate() {
    if (calcStr && !isNaN(calcStr)) {
      calcStr = String(parseFloat(calcStr) * -1);
      updateCalcDisplay();
    }
  }

  function calcPercent() {
    if (calcStr && !isNaN(calcStr)) {
      calcStr = String(parseFloat(calcStr) / 100);
      updateCalcDisplay();
    }
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + panicJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Panic Mode (Fake Calculator) activated!');
} else {
    console.log('❌ Could not find script tag.');
}
