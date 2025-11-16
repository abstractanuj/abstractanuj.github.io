
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Point } from '../types';

interface GraphProps {
    data: Point[];
    xDomain: [number, number];
    yDomain: [string | number, string | number];
    handlePan: (offset: number) => void;
    handleZoom: (factor: number) => void;
}

/**
 * Generates an array of "nice" tick values for a given domain.
 * @param domain The [min, max] of the axis.
 * @param desiredTickCount The approximate number of ticks to generate.
 * @returns An array of numbers to use as ticks.
 */
const generateTicks = (domain: [number, number], desiredTickCount: number = 5): number[] => {
    const [min, max] = domain;
    const range = max - min;

    if (range <= 0 || !isFinite(range)) {
        return [min];
    }
    
    // If the range is small enough, try to show all integers
    if (range > 1 && range < (desiredTickCount * 1.5)) {
        const ticks: number[] = [];
        const start = Math.ceil(min);
        const end = Math.floor(max);
        if (end - start >= 0 && end - start < desiredTickCount * 2) {
             for (let i = start; i <= end; i++) {
                ticks.push(i);
            }
            if (ticks.length > 1) return ticks;
        }
    }

    const tempStep = range / desiredTickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(tempStep)));
    const residual = tempStep / magnitude;

    let niceStep;
    if (residual > 5) {
        niceStep = 10 * magnitude;
    } else if (residual > 2) {
        niceStep = 5 * magnitude;
    } else if (residual > 1) {
        niceStep = 2 * magnitude;
    } else {
        niceStep = magnitude;
    }

    niceStep = parseFloat(niceStep.toPrecision(15));

    const firstTick = Math.ceil(min / niceStep) * niceStep;
    const lastTick = Math.floor(max / niceStep) * niceStep;

    const ticks: number[] = [];
    if (firstTick > lastTick) {
         return [(min + max) / 2];
    }
    
    for (let t = firstTick; t <= lastTick; t += niceStep) {
        ticks.push(parseFloat(t.toPrecision(15)));
    }

    if (ticks.length < 2 && max > min) {
        return [min, max];
    }

    return ticks;
};

/**
 * Creates a formatting function for ticks based on the step between them.
 * @param ticks An array of tick values.
 * @returns A function that takes a tick value and returns a formatted string.
 */
const getTickFormatter = (ticks: number[] | undefined) => (tickValue: number) => {
    if (ticks === undefined || ticks.length < 2) {
        return tickValue.toPrecision(3);
    }

    const step = Math.abs(ticks[1] - ticks[0]);
    if (step === 0) return tickValue.toPrecision(3);

    // Calculate precision. Add a small epsilon to handle floating point issues with log10.
    const precision = Math.max(0, Math.ceil(-Math.log10(step) + 1e-9));

    if (step >= 1 && tickValue % 1 === 0) {
        return tickValue.toFixed(0);
    }

    return tickValue.toFixed(Math.min(precision, 5));
};


const Graph: React.FC<GraphProps> = ({ data, xDomain, yDomain, handlePan, handleZoom }) => {
    const graphWrapperRef = useRef<HTMLDivElement>(null);
    const isPanningRef = useRef(false);
    const lastMouseXRef = useRef(0);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        isPanningRef.current = true;
        lastMouseXRef.current = e.clientX;
        if (graphWrapperRef.current) {
            graphWrapperRef.current.style.cursor = 'grabbing';
        }
    }, []);
    
    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanningRef.current || !graphWrapperRef.current) return;

        const chartWidth = graphWrapperRef.current.clientWidth;
        if (chartWidth === 0) return;

        const deltaX = e.clientX - lastMouseXRef.current;
        lastMouseXRef.current = e.clientX;

        const domainWidth = xDomain[1] - xDomain[0];
        const panAmount = (deltaX / chartWidth) * domainWidth;
        handlePan(-panAmount);
    }, [xDomain, handlePan]);

    const onMouseUpOrLeave = useCallback(() => {
        isPanningRef.current = false;
        if (graphWrapperRef.current) {
            graphWrapperRef.current.style.cursor = 'grab';
        }
    }, []);

    const onWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 0.85 : 1.15;
        handleZoom(factor);
    }, [handleZoom]);

    useEffect(() => {
        const wrapper = graphWrapperRef.current;
        if (wrapper) {
            wrapper.addEventListener('wheel', onWheel as any, { passive: false });
            return () => {
                wrapper.removeEventListener('wheel', onWheel as any);
            };
        }
    }, [onWheel]);
    
    const xTicks = useMemo(() => {
        if (typeof xDomain[0] !== 'number' || typeof xDomain[1] !== 'number') return undefined;
        return generateTicks(xDomain, 10);
    }, [xDomain]);

    const yTicks = useMemo(() => {
        const [min, max] = yDomain;
        if (typeof min !== 'number' || typeof max !== 'number' || !isFinite(min) || !isFinite(max)) return undefined;
        return generateTicks([min, max], 8);
    }, [yDomain]);
    
    const xTickFormatter = useMemo(() => getTickFormatter(xTicks), [xTicks]);
    const yTickFormatter = useMemo(() => getTickFormatter(yTicks), [yTicks]);

    return (
        <div 
            ref={graphWrapperRef}
            className="flex-grow bg-[#E9F0EA]/30 rounded-lg shadow-inner cursor-grab"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUpOrLeave}
            onMouseLeave={onMouseUpOrLeave}
        >
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#C5D1C6" />
                    <XAxis 
                        dataKey="x" 
                        type="number"
                        stroke="#264028"
                        domain={xDomain}
                        ticks={xTicks}
                        tickFormatter={xTickFormatter}
                        allowDataOverflow={true}
                    />
                    <YAxis 
                        stroke="#264028"
                        domain={yDomain}
                        ticks={yTicks}
                        tickFormatter={yTickFormatter}
                        allowDataOverflow={true}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#E9F0EA', border: '1px solid #C5D1C6' }}
                        labelStyle={{ color: '#264028' }}
                        formatter={(value: number, name: string) => [value.toFixed(3), name]}
                    />
                    <Legend wrapperStyle={{color: '#264028'}}/>
                    <Line 
                        type="monotone" 
                        dataKey="secretY" 
                        stroke="#264028" 
                        strokeWidth={3}
                        dot={false} 
                        name="Secret Function"
                        strokeDasharray="5 5"
                        connectNulls
                    />
                    <Line 
                        type="monotone" 
                        dataKey="userY" 
                        stroke="#627C9D" 
                        strokeWidth={2}
                        dot={false} 
                        name="Your Guess"
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Graph;
