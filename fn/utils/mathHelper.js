// A simple seeded pseudo-random number generator (PRNG).
function mulberry32(seed) {
    return function() {
        var t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Simple string hash to create a numeric seed.
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1^h2^h3^h4)>>>0;
}


// Gets a seed based on the current date in IST (resets at 7 AM).
function getDailySeed(difficulty) {
    const now = new Date();
    // IST is UTC+5:30. 7 AM IST is 1:30 AM UTC.
    const resetHourUTC = 1;
    const resetMinuteUTC = 30;

    const resetTimeTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), resetHourUTC, resetMinuteUTC, 0));
    
    let dateForSeed = new Date(now);
    // If current time is before today's reset time, use yesterday's date for the seed.
    if (now.getTime() < resetTimeTodayUTC.getTime()) {
        dateForSeed.setUTCDate(dateForSeed.getUTCDate() - 1);
    }

    const dateString = dateForSeed.toISOString().slice(0, 10); // YYYY-MM-DD
    const seedString = `${dateString}-${difficulty}`;
    return cyrb128(seedString);
}


// --- Function Generation Helpers ---
const terms = {
    easy: ['_a_*x', '_a_*sin(x)', '_a_*cos(x)', '_a_*x^2'],
    medium: ['_a_*x', '_a_*sin(_b_*x)', '_a_*cos(_b_*x)', '_a_*x^2', '_a_*x^3', '_a_*tanh(_b_*x)'],
    hard: ['_a_*sin(_b_*x)', '_a_*cos(_b_*x)', '_a_*x^2', '_a_*x^3', '_a_*log(abs(_b_*x)+1)', '_a_*exp(-(_b_*x)^2)', '_a_*sqrt(abs(_b_*x))']
};

export const generateDailySecretFunction = (difficulty = 'medium') => {
    const seed = getDailySeed(difficulty);
    const random = mulberry32(seed);

    const getRandomElement = (arr) => arr[Math.floor(random() * arr.length)];
    const getRandomInt = (min, max) => Math.floor(random() * (max - min + 1)) + Math.floor(min);
    const getRandomFloat = (min, max, decimals = 1) => parseFloat((random() * (max - min) + min).toFixed(decimals));
    const formatNumber = (num) => Number.isInteger(num) ? num.toString() : num.toFixed(1).replace(/\.0$/, '');

    let termCount, coefficientType, bValueRange, constantOffset;

    switch (difficulty) {
        case 'easy':
            termCount = 1;
            coefficientType = 'int';
            bValueRange = [1, 1];
            constantOffset = getRandomInt(-4, 4);
            break;
        case 'hard':
            termCount = 3;
            coefficientType = 'float';
            bValueRange = [0.5, 2.5];
            constantOffset = getRandomFloat(-3, 3);
            break;
        case 'medium':
        default:
            termCount = 2;
            coefficientType = 'mix';
            bValueRange = [1, 2];
            constantOffset = getRandomInt(-5, 5);
            break;
    }
    
    const availableTerms = [...terms[difficulty]];
    const expressionTerms = [];
    const hintTerms = [];

    for (let i = 0; i < termCount; i++) {
        if (availableTerms.length === 0) break;
        
        const termIndex = Math.floor(random() * availableTerms.length);
        let template = availableTerms.splice(termIndex, 1)[0];

        let a;
        if (coefficientType === 'int') {
            do { a = getRandomInt(-4, 4); } while (a === 0);
        } else if (coefficientType === 'float') {
            do { a = getRandomFloat(-2.5, 2.5); } while (a === 0);
        } else { // mix
            do { a = random() > 0.5 ? getRandomInt(-3, 3) : getRandomFloat(-2.0, 2.0); } while (a === 0);
        }

        let b = 1;
        if (template.includes('_b_')) {
            do {
                b = random() > 0.5 ? getRandomInt(bValueRange[0], bValueRange[1]) : getRandomFloat(bValueRange[0], bValueRange[1]);
            } while (b === 0);
        }
        
        // Build the term string for the expression
        let termStr = template
            .replace('_a_', formatNumber(a))
            .replace('_b_', formatNumber(b));
        
        if (termStr.startsWith('1*')) termStr = termStr.substring(2);
        if (termStr.startsWith('-1*')) termStr = `-${termStr.substring(3)}`;

        expressionTerms.push(termStr);
        
        // Build a cleaned-up version for the hints (always positive)
        let hintStr = template
            .replace('_a_', formatNumber(Math.abs(a)))
            .replace('_b_', formatNumber(b));

        if (hintStr.startsWith('1*')) hintStr = hintStr.substring(2);
        hintTerms.push(hintStr);
    }
    
    if (constantOffset !== 0) {
        expressionTerms.push(formatNumber(constantOffset));
        hintTerms.push(formatNumber(Math.abs(constantOffset)));
    }
    
    // Join terms carefully to build the final expression string
    let finalFunction = expressionTerms.reduce((acc, term, index) => {
        if (index === 0) return term;
        const sign = term.startsWith('-') ? '-' : '+';
        const absTerm = term.startsWith('-') ? term.substring(1) : term;
        return `${acc} ${sign} ${absTerm}`;
    }, '');

    if (!finalFunction.trim()) {
        finalFunction = difficulty === 'hard' ? 'x^2 + sin(x) + 1' : 'x^2 + 1';
        hintTerms.push('x^2', 'sin(x)', '1');
    }

    return { expression: finalFunction, terms: hintTerms };
};

export const getLocalHint = (secret, hintStep) => {
    const { terms } = secret;
    if (hintStep === 0) {
        if (terms.length === 1) return `This function has just 1 main part.`;
        return `This function is a combination of ${terms.length} parts.`;
    }
    const termIndex = hintStep - 1;
    if (termIndex < terms.length) {
        return `One of the parts involves: ${terms[termIndex]}`;
    }
    return "You've seen all the parts! Now, how do they fit together?";
};

export const parseFunction = (funcStr) => {
    if (!funcStr.trim()) return null;
    try {
        const node = window.math.parse(funcStr);
        const code = node.compile();
        return (scope) => code.evaluate(scope);
    } catch (e) {
        return null;
    }
};

export const extractVariables = (funcStr) => {
    if (!funcStr.trim()) return [];
    try {
        const node = window.math.parse(funcStr);
        const variables = new Set();
        node.traverse((node) => {
            if (node.isSymbolNode && node.name !== 'x' && !window.math[node.name]) {
                variables.add(node.name);
            }
        });
        return Array.from(variables);
    } catch (e) {
        return [];
    }
};

export const areFunctionsEquivalent = (
    funcStr1,
    funcStr2,
    scope,
    domain = [-10, 10],
    points = 100
) => {
    const eval1 = parseFunction(funcStr1);
    const eval2 = parseFunction(funcStr2);

    if (!eval1 || !eval2) return false;

    let sumOfSquares = 0;
    const step = (domain[1] - domain[0]) / points;

    for (let i = 0; i <= points; i++) {
        const x = domain[0] + i * step;
        const currentScope = { ...scope, x };
        try {
            const y1 = eval1(currentScope);
            const y2 = eval2(currentScope);

            if (!isFinite(y1) || !isFinite(y2)) {
                if (y1 === y2) continue;
                if (isFinite(y1) !== isFinite(y2)) return false;
                continue;
            }

            const diff = y1 - y2;
            sumOfSquares += diff * diff;
        } catch (error) {
            return false;
        }
    }

    const meanSquareError = sumOfSquares / points;
    return meanSquareError < 1e-6;
};
