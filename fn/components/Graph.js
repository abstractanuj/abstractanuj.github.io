import { parseFunction } from '../utils/mathHelper.js';

const d3Container = document.querySelector('#graph-container');
const state = {}; // To hold D3 elements like scales, axes, paths
const padding = { top: 20, right: 20, bottom: 20, left: 20 };

function generateData(evalFunc, xDomain, userScope) {
    if (!evalFunc) return [];
    
    const data = [];
    const [x0, x1] = xDomain;
    const points = 400; // Increased points for smoother curves
    const step = (x1 - x0) / points;

    for (let i = 0; i <= points; i++) {
        const x = x0 + i * step;
        try {
            const y = evalFunc({ ...userScope, x });
            if (isFinite(y)) {
                data.push([x, y]);
            }
        } catch (error) {
            // Ignore errors for individual points
        }
    }
    return data;
}

function onMouseEnter() {
    const { crosshair, secretCircle, resultCircle } = state;
    const { showSecret, showResult } = window.appState;
    if (crosshair) crosshair.style('display', null);
    if (secretCircle && showSecret) secretCircle.style('display', null);
    if (resultCircle && showResult) resultCircle.style('display', null);
}

function onMouseLeave() {
    const { crosshair, secretCircle, resultCircle, resultTooltip } = state;
    if (crosshair) crosshair.style('display', 'none');
    if (secretCircle) secretCircle.style('display', 'none');
    if (resultCircle) resultCircle.style('display', 'none');
    if (resultTooltip) resultTooltip.style('display', 'none');
}

function onMouseMove(event) {
    const props = window.appState;
    const { xScale, yScale, secretEval, resultEval, crosshairV, crosshairH, secretCircle, resultCircle, resultTooltip } = state;
    if (!xScale || !yScale || !secretEval || !resultEval) return;

    const [mx, my] = d3.pointer(event);
    const width = d3Container.clientWidth;
    const height = d3Container.clientHeight;

    const x = xScale.invert(mx);

    // Update crosshair position
    crosshairV.attr('d', `M ${mx} ${padding.top} V ${height - padding.bottom}`);
    crosshairH.attr('d', `M ${padding.left} ${my} H ${width - padding.right}`);

    // Update secret function circle marker
    const y_secret = secretEval({ ...props.userScope, x });
    if (props.showSecret && isFinite(y_secret)) {
        secretCircle.style('display', null).attr('cx', mx).attr('cy', yScale(y_secret));
    } else {
        secretCircle.style('display', 'none');
    }

    // Update result function circle marker and tooltip
    const y_result = resultEval({ ...props.userScope, x });
    if (props.showResult && isFinite(y_result)) {
        const cx = mx;
        const cy = yScale(y_result);
        resultCircle.style('display', null).attr('cx', cx).attr('cy', cy);

        const tooltipNode = resultTooltip.node();
        if (!tooltipNode) return;

        // Position the tooltip with boundary checks
        const tooltipWidth = tooltipNode.offsetWidth;
        const tooltipHeight = tooltipNode.offsetHeight;

        let tooltipX = cx + 15; // Default: right of cursor
        let tooltipY = cy - 15 - tooltipHeight; // Default: above cursor

        if (tooltipX + tooltipWidth > width - padding.right) {
            tooltipX = cx - 15 - tooltipWidth; // Flip to left
        }
        if (tooltipY < padding.top) {
            tooltipY = cy + 15; // Flip below
        }

        resultTooltip
            .style('display', 'block')
            .html(`(${x.toFixed(3)}, ${y_result.toFixed(6)})`)
            .style('left', `${tooltipX}px`)
            .style('top', `${tooltipY}px`);

    } else {
        resultCircle.style('display', 'none');
        if (resultTooltip) resultTooltip.style('display', 'none');
    }
}


function draw(props) {
    // FIX: Ensure secretFunction is always a string before being used for parsing or concatenation.
    // The zoom handler passes the whole appState, where secretFunction is an object.
    const secretFunctionStr = typeof props.secretFunction === 'string'
        ? props.secretFunction
        : (props.secretFunction && props.secretFunction.expression) || '';

    const { gameState, userFunction, userScope, plotMode, showSecret, showResult } = props;
    const { svg, xScale, yScale, gridX, gridY, xAxis, yAxis, secretPath, resultPath } = state;
    if (!svg) return;

    const width = d3Container.clientWidth;
    const height = d3Container.clientHeight;
    
    xScale.range([padding.left, width - padding.right]);
    yScale.range([height - padding.bottom, padding.top]);

    // Update grid
    const xAxisGridGenerator = d3.axisBottom(xScale)
        .ticks(width / 80)
        .tickSize(-(height - padding.top - padding.bottom))
        .tickFormat('');

    const yAxisGridGenerator = d3.axisLeft(yScale)
        .ticks(height / 50)
        .tickSize(-(width - padding.left - padding.right))
        .tickFormat('');

    gridX.attr('transform', `translate(0, ${height - padding.bottom})`).call(xAxisGridGenerator);
    gridY.attr('transform', `translate(${padding.left}, 0)`).call(yAxisGridGenerator);
    svg.selectAll('.grid .tick line').attr('stroke', '#111111').attr('stroke-opacity', 0.2);
    svg.selectAll('.grid .domain').remove();

    // Update main axes
    const xAxisGenerator = d3.axisBottom(xScale).ticks(width / 80).tickSizeOuter(0);
    const yAxisGenerator = d3.axisLeft(yScale).ticks(height / 50).tickSizeOuter(0);

    const y0 = yScale(0);
    const x0 = xScale(0);

    const clampedY0 = Math.max(padding.top, Math.min(height - padding.bottom, y0));
    const clampedX0 = Math.max(padding.left, Math.min(width - padding.right, x0));

    xAxis.attr('transform', `translate(0, ${clampedY0})`).call(xAxisGenerator);
    yAxis.attr('transform', `translate(${clampedX0}, 0)`).call(yAxisGenerator);
    
    svg.selectAll('.axis .tick line').attr('stroke', '#111111');
    svg.selectAll('.axis .domain').attr('stroke', '#111111').attr('stroke-width', 2);
    svg.selectAll('.axis text').style('font-family', 'Roboto Mono').style('font-size', '12px').attr('fill', '#111111');

    const line = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));

    const currentXDomain = xScale.domain();
    const secretEval = parseFunction(secretFunctionStr);
    state.secretEval = secretEval; // Store for mouse handler
    const secretData = generateData(secretEval, currentXDomain, userScope);

    // Draw Secret Function
    secretPath
        .style('display', showSecret ? 'block' : 'none')
        .attr('d', line(secretData));
    
    // Determine the result function string based on plotMode
    let resultFunctionStr = '';
    const secretWrapped = `(${secretFunctionStr})`;
    const userWrapped = userFunction ? `(${userFunction})` : '(0)';

    switch(plotMode) {
        case 'subtract': resultFunctionStr = `${secretWrapped} - ${userWrapped}`; break;
        case 'add': resultFunctionStr = `${secretWrapped} + ${userWrapped}`; break;
        case 'multiply': resultFunctionStr = `${secretWrapped} * ${userWrapped}`; break;
        case 'divide': resultFunctionStr = `${secretWrapped} / ${userWrapped}`; break;
        case 'guess':
        default:
            resultFunctionStr = userFunction;
    }

    // Draw Result Function
    const resultEval = parseFunction(resultFunctionStr);
    state.resultEval = resultEval; // Store for mouse handler
    const resultData = generateData(resultEval, currentXDomain, userScope);
    
    // Handle win animation
    if (gameState === 'won_animating') {
        resultPath
            .transition().duration(800)
            .attr('d', line(secretData))
            .attr('stroke', '#34C759'); // brand-green
    } else {
        resultPath
            .interrupt() // Stop any ongoing transition
            .attr('stroke', '#FF3B30') // brand-red
            .style('display', showResult ? 'block' : 'none')
            .attr('d', line(resultData));
    }
}

export function init(props) {
    d3Container.innerHTML = '<svg class="w-full h-full"></svg>';
    const svgElement = d3Container.querySelector('svg');
    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;
    
    state.xScale = d3.scaleLinear().domain([-10, 10]).range([padding.left, width - padding.right]);
    state.yScale = d3.scaleLinear().domain([-10, 10]).range([height - padding.bottom, padding.top]);

    state.svg = d3.select(svgElement);

    // Add a tooltip for the user's function (red line)
    state.resultTooltip = d3.select(d3Container)
        .append('div')
        .attr('class', 'absolute bg-bg-main border-2 border-border-color neo-shadow px-2 py-1 font-mono text-sm pointer-events-none rounded-md')
        .style('display', 'none');
    
    const defs = state.svg.append("defs");

    defs.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", padding.left)
        .attr("y", padding.top)
        .attr("width", width - padding.left - padding.right)
        .attr("height", height - padding.top - padding.bottom);

    state.gridX = state.svg.append('g').attr('class', 'grid grid-x');
    state.gridY = state.svg.append('g').attr('class', 'grid grid-y');

    state.xAxis = state.svg.append('g').attr('class', 'axis x-axis');
    state.yAxis = state.svg.append('g').attr('class', 'axis y-axis');
    
    const g = state.svg.append("g").attr("clip-path", "url(#clip)");

    state.secretPath = g.append('path')
        .attr('fill', 'none').attr('stroke', '#0055FF') // brand-blue
        .attr('stroke-width', 3).attr('stroke-dasharray', '8,6');

    state.resultPath = g.append('path')
        .attr('fill', 'none').attr('stroke', '#FF3B30').attr('stroke-width', 3.5); // brand-red

    // --- Interactive Elements ---
    const crosshair = state.svg.append('g')
        .attr('class', 'crosshair')
        .style('display', 'none');
        
    state.crosshairV = crosshair.append('path').attr('stroke', '#111').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');
    state.crosshairH = crosshair.append('path').attr('stroke', '#111').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');
    
    state.secretCircle = state.svg.append('circle').attr('r', 5).attr('fill', '#0055FF').attr('stroke', '#fff').attr('stroke-width', 2).style('display', 'none').attr('class','pointer-events-none');
    state.resultCircle = state.svg.append('circle').attr('r', 5).attr('fill', '#FF3B30').attr('stroke', '#fff').attr('stroke-width', 2).style('display', 'none').attr('class','pointer-events-none');
    // --- End Interactive Elements ---

    const initialXScale = state.xScale.copy();
    const initialYScale = state.yScale.copy();

    const zoom = d3.zoom()
        .scaleExtent([0.05, 100])
        .on('zoom', (event) => {
            const newXScale = event.transform.rescaleX(initialXScale);
            const newYScale = event.transform.rescaleY(initialYScale);
            state.xScale.domain(newXScale.domain());
            state.yScale.domain(newYScale.domain());
            draw(window.appState); // Redraw on zoom, accessing global state
        });
    
    state.svg.call(zoom);
    
    // Add mouse event listener overlay
    state.svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseenter', onMouseEnter)
        .on('mouseleave', onMouseLeave)
        .on('mousemove', onMouseMove);

    draw(props);
}

export const update = draw;