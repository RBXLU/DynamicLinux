// Тесты «чистых» модулей (без GNOME Shell). Запуск: gjs -m tests/pure.test.js
// (или node tests/pure.test.js — модули не зависят от gi).

import {bases, evaluate, formatResult, looksLikeMath} from '../dynamic-island@dynamiclinux/lib/pure/calc.js';
import {TRANSFORMS, applyTransform, fixLayout, markdownToPango, textStats} from '../dynamic-island@dynamiclinux/lib/pure/textTools.js';
import {formatBytes, formatDuration, parseColor, plural, weatherInfo} from '../dynamic-island@dynamiclinux/lib/pure/format.js';

const out = typeof print === 'function' ? print : console.log;
let failed = 0, passed = 0;

function eq(actual, expected, what) {
    if (actual === expected) {
        passed++;
    } else {
        failed++;
        out(`✗ ${what}: получили ${JSON.stringify(actual)}, ожидали ${JSON.stringify(expected)}`);
    }
}

function throws(fn, what) {
    try {
        fn();
        failed++;
        out(`✗ ${what}: ожидалось исключение`);
    } catch {
        passed++;
    }
}

// ---------------- калькулятор
const calc = [
    ['2+2*2', '6'], ['(2+2)*2', '8'], ['2^3^2', '512'], ['-2^2', '-4'], ['5!', '120'],
    ['10%', '0.1'], ['7%3', '1'], ['sqrt(16)+2^10', '1028'], ['max(1,2,3)', '3'],
    ['1,5*2', '3'], ['0x1F', '31'], ['0b101', '5'], ['1 000 000/1000', '1000'],
    ['3(4+5)', '27'], ['2×3÷4', '1.5'], ['ln(e)', '1'], ['2**10', '1024'], ['0.1+0.2', '0.3'],
];
for (const [expr, res] of calc)
    eq(formatResult(evaluate(expr)), res, `calc ${expr}`);
eq(formatResult(evaluate('sin(90)', {degrees: true})), '1', 'calc sin(90°)');
eq(formatResult(evaluate('ans*2', {ans: 21})), '42', 'calc ans');
throws(() => evaluate('1/0'), 'деление на ноль');
throws(() => evaluate('2+'), 'незаконченное выражение');
throws(() => evaluate('abc'), 'неизвестное имя');
eq(looksLikeMath('2+2'), true, 'looksLikeMath 2+2');
eq(looksLikeMath('firefox'), false, 'looksLikeMath firefox');
eq(bases(255).hex, '0xFF', 'bases hex');

// ---------------- текст
for (const [id] of TRANSFORMS) {
    const input = id.startsWith('json') ? '{"a":[1,2]}' : id === 'b64d' ? '0J/RgNC40LLQtdGC' : id === 'urld' ? '%D0%BF' : 'Привет, мир! hello';
    try {
        applyTransform(id, input);
        passed++;
    } catch (e) {
        failed++;
        out(`✗ transform ${id}: ${e.message}`);
    }
}
eq(applyTransform('b64d', applyTransform('b64e', 'Привет 🌍')), 'Привет 🌍', 'base64 туда-обратно');
eq(fixLayout('ghbdtn vbh'), 'привет мир', 'раскладка EN→RU');
eq(fixLayout('руддщ'), 'hello', 'раскладка RU→EN');
eq(fixLayout('ghbdtn! это тест'), 'привет! это тест', 'раскладка в смешанном тексте');
eq(applyTransform('typograph', '"Да" - сказал он...'), '«Да» — сказал он…', 'типограф');
eq(applyTransform('snake', 'Hello World'), 'hello_world', 'snake_case');
eq(textStats('один два три').words, 3, 'подсчёт слов');
eq(markdownToPango('**a** <b>'), '<b>a</b> &lt;b&gt;', 'markdown → pango');

// ---------------- форматирование
eq(formatBytes(1536), '1.5 КБ', 'formatBytes');
eq(formatDuration(3725), '1:02:05', 'formatDuration');
eq(plural(21, ['файл', 'файла', 'файлов']), 'файл', 'plural 21');
eq(plural(12, ['файл', 'файла', 'файлов']), 'файлов', 'plural 12');
eq(parseColor('#0a84ff').b, 255, 'parseColor hex');
eq(parseColor('rgba(1,2,3,0.5)').a, 0.5, 'parseColor rgba');
eq(weatherInfo(0, false).emoji, '🌙', 'weatherInfo ночь');

out(`${failed ? '✗' : '✓'} пройдено: ${passed}, ошибок: ${failed}`);
if (failed)
    throw new Error(`Тесты не прошли: ${failed}`);
