
import { SecretFunction } from '../types';

// Math.js is loaded from CDN
declare const math: any;

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const choice = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

type TermGenerator = () => string;

const polynomialTerm: TermGenerator = () => {
    const coeff = randInt(1, 4) * choice([-1, 1]);
    const power = choice([1.5, 2, 2.5, 3]);
    if (coeff === 1) return `x^${power}`;
    if (coeff === -1) return `-x^${power}`;
    return `${coeff}*x^${power}`;
};

const linearTerm: TermGenerator = () => {
    const coeff = randInt(1, 10) * choice([-1, 1]);
    if (coeff === 1) return 'x';
    if (coeff === -1) return '-x';
    return `${coeff}*x`;
};

const trigTerm: TermGenerator = () => {
    const func = choice(['sin', 'cos']);
    const amp = randInt(1, 3) * choice([-1, 1]);
    const freq = parseFloat(randFloat(0.5, 2).toFixed(1));

    const ampStr = amp === 1 ? '' : (amp === -1 ? '-' : `${amp}*`);
    const freqStr = freq === 1 ? 'x' : `${freq}*x`;

    return `${ampStr}${func}(${freqStr})`;
};

const constantTerm: TermGenerator = () => {
    return `${randInt(1, 10) * choice([-1, 1])}`;
};

const functionTemplates: TermGenerator[][] = [
    [polynomialTerm, linearTerm],
    [linearTerm, trigTerm],
    [polynomialTerm, trigTerm],
    [polynomialTerm, linearTerm, constantTerm],
    [trigTerm, linearTerm, constantTerm]
];

export const generateSecretFunction = (): SecretFunction => {
    const template = choice(functionTemplates);
    const termStrings = template.map(termFn => termFn());
    
    // Build expression by joining with '+', then let math.js simplify it
    const rawExpression = termStrings.join(' + ');
    
    // Simplify the expression to get a canonical form.
    // This prevents mismatches between the displayed expression and the evaluation logic.
    // e.g., '2*x + -3*x' becomes '-x'
    const simplifiedNode = math.simplify(rawExpression);
    const compiled = simplifiedNode.compile();

    return {
        expression: simplifiedNode.toString({ implicit: 'hide' }),
        evaluate: (x: number) => compiled.evaluate({ x }),
    };
};