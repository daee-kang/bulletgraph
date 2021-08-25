import React, { useEffect, useRef, useState } from 'react';
import './BulletGraph.css';

const BulletGraph = (props) => {
    const canvasRef = useRef(null);

    //props
    let {
        points, //OPTIONAL: our point data, every point should have a x value minumum so we can map it
        sensorRanges, //OPTIONAL(DEPENDS): ranges for our data to be displayed, rules are written in app.js with examples
        colors, //OPTIONAL: colors for the ranges, will only just cycle one by one
        barWidth = 20, //OPTIONAL: width of the big bar, default value is 20
        fixed, //OPTIONAL: sets precision to axis labels
        barPadding = 20, //OPTIONAL: sets padding on the left and right of bar, this is useful so points can be displayed if cut off, default is 20
    } = props;

    let { ranges, type } = sensorRanges;

    //'consts' set in useeffect since it is dependent on our size
    const GRAPH_HEIGHT = barWidth;
    let GRAPH_Y = 0; //this const is set in useEffect
    let TEXT_Y = 0; //this const is set in useEffect
    const BAR_PADDING = barPadding;
    const PADDING = 0.10; //padding is percentage of range and only used for infinite graphs

    let hoveredPoint = null;

    /*
    ranges can be of different types
        zeroToInfinite = [{name: string, x: number}] //if last element, x should be nothing
        zeroToFinite = [{name: string, x: number}] //if last element, x should have value
        finiteToFinite =[{name: string, x: number}] //first element should just be {x: number}, no name
        infiniteToInfinite = null //no ranges here, labels will just be 'negative' and 'positive'
        percentage = [{name: string, x: float}] //x should be 0.0 through 1.0, but total sum should equal 1.0
    */

    //default colors if colors prop not passed
    //colors basically just cycle through one by one
    if (colors === undefined) {
        colors = [
            '#3494b4',
            '#ee5876',
            '#eec832',
            '#2a9d8f',
        ];
    }

    //HELPER FUNCTIONS
    //this func is for drawing when no ranges are included, we'll just create based on the type
    const drawRange = (ctx) => {
        if (type === 'infiniteToInfinite') {
            //we can just add our own ranges, positive and negative
            ranges = [
                { name: 'negative', x: 0 },
                { name: 'positive' }
            ];

        } else if (type === 'percentage') {
            ranges = [
                { name: '', x: 1 } //yeah its hacky buttttttttttttt 
            ];

            //just draw the last label since our for loop in drawranges won't hit this last part
            drawAxisLabel(ctx, '100%', getWidthOfRange(0, 1), TEXT_Y);
        }

        drawRanges(ctx);
    };

    const drawRanges = (ctx) => {
        let colorIdx = 0;

        const getColorIdx = () => { //small helper, this loop doesn't necessaraily go i = 0 -> n
            return (colorIdx++ % colors.length);
        };

        let start = 0;

        if (type === 'finiteToFinite') {
            start = ranges[0].x;
        }
        if (type === 'infiniteToInfinite') {
            start = getLeftRightOfInfinites()[0];
        }

        let prevWidth = BAR_PADDING;
        for (let i = 0; i < ranges.length; i++) {
            if (i === 0 && type === 'finiteToFinite') continue;

            if ((i === 1 && type === 'finiteToFinite') || i === 0) {
                //begin
                //get width 
                let width = getWidthOfRange(start, ranges[i].x);

                ctx.fillStyle = colors[getColorIdx()];
                ctx.fillRect(prevWidth, GRAPH_Y, width, GRAPH_HEIGHT);

                if (type !== 'infiniteToInfinite') {
                    let text = start;
                    if (type === 'percentage') text = "0%";
                    drawAxisLabel(ctx, text, BAR_PADDING, TEXT_Y, 'start');
                }

                drawLabel(ctx, ranges[i].name, start, ranges[i].x);
                prevWidth += width;
            } else {
                //end
                let width = getWidthOfRange(ranges[i - 1].x, ranges[i].x);

                ctx.fillStyle = colors[getColorIdx()];
                ctx.fillRect(prevWidth, GRAPH_Y, width, GRAPH_HEIGHT);

                let text = ranges[i - 1].x;
                if (type === 'percentage') text = `${ranges[i - 1].x * 100}%`;
                drawAxisLabel(ctx, text, prevWidth, TEXT_Y);
                drawLabel(ctx, ranges[i].name, ranges[i - 1].x, ranges[i].x);

                prevWidth += width;

                if (
                    type === 'zeroToInfinite' ||
                    type === 'infiniteToInfinite'
                ) { continue; } //don't draw lastindicator
                //last element
                if (i === ranges.length - 1) {
                    let label = ranges[i].x;
                    if (label === undefined) label = getTotalRange();
                    if (type === 'percentage') label = '100%';
                    drawAxisLabel(ctx, label, prevWidth, TEXT_Y, 'end');
                }
            }
        }

    };

    const getTotalRange = () => {
        switch (type) {
            case 'finiteToFinite': {
                let start = ranges[0].x;
                let end = ranges[ranges.length - 1].x;
                return end - start;
            }
            case 'zeroToInfinite': {
                let start = 0;

                let maxValue = 0;
                points.forEach(point => {
                    if (point.x > maxValue) maxValue = parseFloat(point.x);
                });
                //basically our biggest point + 10% padding
                let end = maxValue + maxValue * PADDING;

                //if our biggest point is less than our ranges, don't use it, make sure all our ranges show
                if (ranges.length >= 2) {
                    let lastRange = ranges[ranges.length - 2].x; //x should be gauranteed to be here
                    //we should try to keep the graph even
                    let potentialEnd = lastRange + (lastRange * 1 / ranges.length);
                    potentialEnd = potentialEnd >= 0 ? Math.ceil(potentialEnd) : Math.floor(potentialEnd);
                    if (potentialEnd > end) end = potentialEnd;
                }
                return end - start;
            }
            case 'zeroToFinite': {
                let start = 0;
                let end = ranges[ranges.length - 1].x;
                return end - start;
            }
            case 'infiniteToInfinite': {
                const [start, end] = getLeftRightOfInfinites();
                return end - start;
            }
            case 'percentage': {
                return 1;
            }
            default: break;
        }

        return 0;
    };

    //used only for 'infiniteToInfinite'
    const getLeftRightOfInfinites = () => {

        //get everything in between
        let start = null;
        let end = null;
        ranges.forEach(range => {
            if (range.x) {
                if (start === null) start = range.x;
                end = range.x;
            }
        });

        if (start === end) {
            start = start - 1;
            end = end + 1;
        }

        //get smallest and biggest point
        let smallest = null;
        let biggest = null;

        points.forEach(point => {
            if (smallest === null || point.x < smallest) {
                smallest = point.x;
            }

            if (biggest === null || point.x > biggest) {
                biggest = point.x;
            }
        });

        //this would create an even graph
        let potentialLeft = start - (end - start) / 2;
        let potentialRight = end + (end - start) / 2;

        //now check to see if any points go past these
        start = smallest < potentialLeft ?
            smallest :
            potentialLeft;

        end = biggest > potentialRight ?
            biggest :
            potentialRight;


        //we are just going to add padding no matter what to both sides
        let rangeBeforePadding = end - start;
        start = start - rangeBeforePadding * PADDING;
        end = end + rangeBeforePadding * PADDING;

        //round values to integers
        start = start >= 0 ? Math.ceil(start) : Math.floor(start);
        end = end >= 0 ? Math.ceil(end) : Math.floor(end);

        return [start, end];
    };

    const getWidthOfRange = (start, end) => {
        let canvas = canvasRef.current;

        let totalWidth = canvas.width - BAR_PADDING * 2;
        let totalRange = getTotalRange();

        if (end === undefined && type === 'zeroToInfinite') {
            end = totalRange;
        }
        if (end === undefined && type === 'infiniteToInfinite') {
            end = getLeftRightOfInfinites()[1];
        }

        let d = end - start;
        let p = d / totalRange;

        return totalWidth * p;
    };

    const getWorldX = (x) => {
        const totalRange = getTotalRange();
        const totalWidth = canvasRef.current.width - BAR_PADDING * 2;

        let start = 0;

        if (type === 'finiteToFinite') {
            start = ranges[0].x;
        }
        if (type === 'infiniteToInfinite') {
            start = getLeftRightOfInfinites()[0];
        }

        return ((x - start) / totalRange) * totalWidth + BAR_PADDING;
    };

    const drawPoint = (ctx, startx, starty, isHover) => {
        ctx.fillStyle = "white";
        ctx.strokeStyle = isHover ? "black" : "grey";
        ctx.lineWidth = 1.5;
        const borderRadius = 10;
        const scale = isHover ? 1.1 : 1;
        let points = [
            [startx, starty + 4],
            [startx + GRAPH_HEIGHT * 0.75 * scale, starty - GRAPH_HEIGHT * scale],
            [startx - GRAPH_HEIGHT * 0.75 * scale, starty - GRAPH_HEIGHT * scale]
        ];
        let point = new Path2D();
        drawPolygon(point, points, borderRadius);

        ctx.fill(point);
        ctx.stroke(point);

        return point;
    };

    const drawTooltip = (ctx, point) => {
        let x = getWorldX(point.value);
        let y = GRAPH_HEIGHT + GRAPH_Y;


    };

    //https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
    const drawPolygon = (ctx, pts, radius) => {
        const getRoundedPoints = (pts, radius) => {
            var i1, i2, i3, p1, p2, p3, prevPt, nextPt,
                len = pts.length,
                res = new Array(len);
            for (i2 = 0; i2 < len; i2++) {
                i1 = i2 - 1;
                i3 = i2 + 1;
                if (i1 < 0) {
                    i1 = len - 1;
                }
                if (i3 == len) {
                    i3 = 0;
                }
                p1 = pts[i1];
                p2 = pts[i2];
                p3 = pts[i3];
                prevPt = getRoundedPoint(p1[0], p1[1], p2[0], p2[1], radius, false);
                nextPt = getRoundedPoint(p2[0], p2[1], p3[0], p3[1], radius, true);
                res[i2] = [prevPt[0], prevPt[1], p2[0], p2[1], nextPt[0], nextPt[1]];
            }
            return res;
        };

        const getRoundedPoint = (x1, y1, x2, y2, radius, first) => {
            var total = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                idx = first ? radius / total : (total - radius) / total;
            return [x1 + (idx * (x2 - x1)), y1 + (idx * (y2 - y1))];
        };

        if (radius > 0) {
            pts = getRoundedPoints(pts, radius);
        }
        var i, pt, len = pts.length;
        //ctx.beginPath();
        for (i = 0; i < len; i++) {
            pt = pts[i];
            if (i === 0) {
                ctx.moveTo(pt[0], pt[1]);
            } else {
                ctx.lineTo(pt[0], pt[1]);
            }
            if (radius > 0) {
                ctx.quadraticCurveTo(pt[2], pt[3], pt[4], pt[5]);
            }
        }
        ctx.closePath();
    };

    const drawAxisLabel = (ctx, text, x, y, align = "center") => {
        if (type !== 'percentage') {
            if (fixed) {
                let num = parseFloat(text);
                if (num !== 0) {
                    text = parseFloat(text).toFixed(fixed);
                }
            }
        }
        ctx.fillStyle = 'black';
        ctx.textAlign = align;
        ctx.font = '12px Rubik';
        ctx.fillText(text, x, y);
    };

    const drawNumber = (ctx, count, xAxis, yAxis, isHovered) => {
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = 'serif';
        const padding = isHovered ? 15 : 10;
        ctx.fillText(count, xAxis, yAxis - GRAPH_HEIGHT - padding);
    };

    const drawLabel = (ctx, label, left, right) => {
        if (right === undefined) {
            if (type === 'infiniteToInfinite') {
                right = getLeftRightOfInfinites()[1];
            } else {
                right = getTotalRange();
            }
        }

        const LABEL_Y = 130;
        //get world coords
        const wleft = getWorldX(left);
        const wright = getWorldX(right);
        const mid = wleft + ((wright - wleft) / 2); //avoid overflow if it ever for some reason happens idk dude

        ctx.fillStyle = '#383838';
        ctx.textAlign = "center";
        ctx.font = 'bold 16px Rubik';
        ctx.fillText(label, mid, LABEL_Y);
    };

    //DRAW
    const draw = ctx => {
        console.log('drawing');
        //clear the canvas on redraw
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.onmousemove = null;

        //DRAW THE RANGES or RANGE
        if (ranges === undefined || ranges.length <= 1) { //should we even customize ranges if theres only one
            drawRange(ctx);
        } else {
            drawRanges(ctx);
        }

        let drawnPoints = [];

        //DRAW THE POINTS
        for (let i = 0; i < points.length; i++) {
            let point = drawPoint(ctx, getWorldX(points[i].x), GRAPH_HEIGHT + GRAPH_Y);
            drawnPoints.push({
                path: point,
                name: points[i].name,
                value: points[i].x,
                index: i
            });
            //draw labels eventually
            drawNumber(ctx, i + 1, getWorldX(points[i].x), GRAPH_HEIGHT + GRAPH_Y, hoveredPoint === i);
        }

        //we reverse the array so we priority is given to the later points when hovering
        drawnPoints.reverse();

        canvasRef.current.onmousemove = function (e) {
            let x = e.clientX;
            let y = e.clientY;

            for (let point of drawnPoints) {
                if (ctx.isPointInPath(point.path, x, y)) {
                    if (hoveredPoint !== point.index) {
                        hoveredPoint = point.index;
                        //draw to remove previous hovered point in case there was one
                        draw(ctx);
                        //draw our hovered point, this is a cheap trick, just draw on top of all the other points
                        drawPoint(ctx, getWorldX(point.value), GRAPH_HEIGHT + GRAPH_Y, true);

                        drawTooltip(ctx, point);
                    }
                    return;
                }
            }

            if (hoveredPoint !== null) {
                hoveredPoint = null;
                //draw to reset drawn hovered point
                draw(ctx);
            }
        };


    };

    useEffect(() => {
        const canvas = canvasRef.current;

        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        //set our 'consts'
        //ignore warning here, this is set on each render anyway
        GRAPH_Y = canvas.height / 2 - GRAPH_HEIGHT / 2;
        TEXT_Y = GRAPH_Y + GRAPH_HEIGHT + 20; //20 is padding

        const context = canvas.getContext('2d');
        const updateSize = (e) => {
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            //clear the canvas on redraw
            context.clearRect(0, 0, canvas.width, canvas.height);

            draw(context);
        };
        window.addEventListener('resize', updateSize);

        draw(context);
        return () => window.removeEventListener('resize', updateSize);
    }, [points, props]);

    return <canvas
        className="bullet-graph"
        ref={canvasRef}
        {...props}
    />;
};

export default BulletGraph;

