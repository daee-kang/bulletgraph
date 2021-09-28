import React, { useEffect, useRef, useState } from 'react';
import Canvas2Svg from 'canvas2svg';
import './BulletGraph.css';

const BulletGraph = ({
        points, //OPTIONAL: our point data, every point should have a x value minumum so we can map it
        sensorRanges, //OPTIONAL(DEPENDS): ranges for our data to be displayed, rules are written in app.js with examples
        colors, //OPTIONAL: colors for the ranges, will only just cycle one by one
        barWidth = 20, //OPTIONAL: width of the big bar, default value is 20
        fixed, //OPTIONAL: sets precision to axis labels
        barPadding = 20, //OPTIONAL: sets padding on the left and right of bar, this is useful so points can be displayed if cut off, default is 20
        unit,
        background, //OPTIONAL: sets a background color, transparent if undefined
        fileDownloadName = "bulletgraph", //OPTIONAL: sets file name for download, default is "bulletgraph"
    }, props) => {
    const canvasRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    let { ranges, type } = sensorRanges;
    
    //'consts' set in useeffect since it is dependent on our size
    const GRAPH_HEIGHT = barWidth;
    let GRAPH_Y = 0; //this const is set in useEffect
    let TEXT_Y = 0; //this const is set in useEffect
    const BAR_PADDING = barPadding;
    const PADDING = 0.10; //padding is percentage of range and only used for infinite graphs
    
    let zoom = 1;
    let panX = 0;
    let netPanning = 0;
    let panning = false;
    
    let hoveredPoint = null;
    
    let width = 0;
    let height = 0;
    let startPoint = 0;
    let endPoint = 0;
    
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
        prevWidth += netPanning;

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
                    drawEndLabel(ctx, getWorldX(startPoint), getWorldX(endPoint), TEXT_Y)
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
    
    const getMinMax = () => {
        // get the min and the max value
        switch (type) {
            case 'finiteToFinite': {
                startPoint = ranges[0].x;
                endPoint = ranges[ranges.length - 1].x;
                return [startPoint, endPoint];
            }
            case 'zeroToInfinite': {
    
                startPoint = 0;
                let maxValue = 0;
                points.forEach(point => {
                    if (point.x > maxValue) maxValue = parseFloat(point.x);
                });
                //basically our biggest point + 10% padding
                endPoint  = maxValue + maxValue * PADDING;
    
                //if our biggest point is less than our ranges, don't use it, make sure all our ranges show
                if (ranges.length >= 2) {
                    let lastRange = ranges[ranges.length - 2].x; //x should be gauranteed to be here
                    //we should try to keep the graph even
                    let potentialEnd = lastRange + (lastRange * 1 / ranges.length);
                    potentialEnd = potentialEnd >= 0 ? Math.ceil(potentialEnd) : Math.floor(potentialEnd);
                    if (potentialEnd > endPoint) endPoint = potentialEnd;
                }
                return [startPoint, endPoint];
            }
            case 'zeroToFinite': {
                startPoint = 0;
                endPoint = ranges[ranges.length - 1].x;
                return [startPoint, endPoint];
            }
            case 'infiniteToInfinite': {
                return [startPoint, endPoint] = getLeftRightOfInfinites();
            }
            case 'percentage': {
                return [0, 1];
            }
            default: break;
        }
    }

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
        // getwidthofrange should really only give you the width in terms of how wide it is on the screen
        let totalWidth = width * zoom - BAR_PADDING * 2;
        let totalRange = getTotalRange();

        if (end === undefined && type === 'zeroToInfinite') {
            end = totalRange;
        }
        if (end === undefined && type === 'infiniteToInfinite') {
            end = getLeftRightOfInfinites()[1];
        }

        let d = end - start;
        startPoint = start
        endPoint = end
        let p = d / totalRange;

        return totalWidth * p;
    };

    const getWorldX = (x) => {
// getworldx does one thing:
// you pass in a value according to the graph. So our ph level is 1.0 - 14.0, and we pass a parameter 12.7
// it takes 12.7 and calculates where on the page it would draw it based on the range and input you have so basically the yes basically x coordinate.
        const totalRange = getTotalRange();
        const totalWidth = width * zoom - BAR_PADDING * 2;

        let start = 0;

        if (type === 'finiteToFinite') {
            start = ranges[0].x;
        }
        if (type === 'infiniteToInfinite') {
            start = getLeftRightOfInfinites()[0];
        }

        return ((x - start) / totalRange) * totalWidth + BAR_PADDING + netPanning;
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
        drawPolygon(point, points, borderRadius, true);
        drawPolygon(ctx, points, borderRadius);

        ctx.fill();
        ctx.stroke();

        return point;
    };

    const drawTooltip = (ctx, point) => {
        let x = getWorldX(point.value);
        let y = GRAPH_HEIGHT + GRAPH_Y + 2;

        //possible things to draw: name, value, index

        const tooltipPadding = 10;
        //find max width
        let toFindWidths = [];

        //if just comment out one of these lines if we don't want it for sure across the graph
        if (point.value !== undefined) toFindWidths.push(`value: ${point.value}`);
        if (point.name !== undefined) toFindWidths.push(point.name);
        // if (point.createdAt !== undefined) toFindWidths.push(point.createdAt);
        let maxWidth = Math.max(...toFindWidths.map(w => ctx.measureText(w).width)) + tooltipPadding * 5;

        //adjust x if going past boundaries based on max width
        if (x - maxWidth / 2 < BAR_PADDING) x = maxWidth / 2 + BAR_PADDING;
        if (x + maxWidth / 2 > width - BAR_PADDING) x = width - BAR_PADDING - maxWidth / 2;

        let height = 12; //no method to find calculated height
        let totalHeight = height * toFindWidths.length + (2 * toFindWidths.length - 1);

        ctx.fillStyle = 'black';
        ctx.globalAlpha = 0.75;
        ctx.fillRect(x - maxWidth / 2, y, maxWidth, totalHeight + tooltipPadding * 3);
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = 'white';
        ctx.font = '12px Rubik';
        ctx.textAlign = 'center';

        if (point.name !== undefined) {
            ctx.fillText(`Name: ${point.name}`, x, y + 10 + tooltipPadding);
            y += 14;
        }
        if (point.value !== undefined) {
            ctx.fillText(`Value: ${point.value}`, x, y + 10 + tooltipPadding);
            // y += 14;
        }
        // The last tooltip item cannot have an extra 14 pixels on the y axis
        // ctx.fillText(`Created At: ${point.createdAt}`, x, y + 10 + tooltipPadding);
    };

    //https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
    const drawPolygon = (ctx, pts, radius, notSvg) => {
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
        if (!notSvg) ctx.beginPath();
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
        ctx.fillText(text + ' ' + unit, x, y);

        drawEndLabel(ctx, getWorldX(getMinMax()[0]), getWorldX(getMinMax()[1]), TEXT_Y)
    };

    const drawNumber = (ctx, count, xAxis, yAxis, isHovered) => {
        // draw the number on top of the triangle data point
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = '12px Rubik';
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

        const LABEL_Y = GRAPH_HEIGHT + GRAPH_Y + 40;
        //get world coords
        const wleft = getWorldX(left);
        const wright = getWorldX(right);
        const mid = wleft + ((wright - wleft) / 2); //avoid overflow if it ever for some reason happens idk dude

        ctx.fillStyle = '#383838';
        ctx.textAlign = "center";
        ctx.font = 'bold 16px Rubik';
        ctx.fillText(label, mid, LABEL_Y);
    };

    const drawEndLabel = (ctx, startXAxis, endXAxis, y, align='center') => {
        // draws the min and max of the bullet graph
        ctx.fillStyle = 'black';
        ctx.textAlign = align;
        ctx.font = '12px Rubik';
        ctx.fillText(startPoint + ' ' + unit, startXAxis, y)
        ctx.fillText(endPoint + ' ' + unit, endXAxis, y)
    }

    const zoomIn = () => {
        zoom += 0.5;
        netPanning += netPanning / zoom;
        if (netPanning < -width * zoom + width) netPanning = -width * zoom + width;
        draw(canvasRef.current.getContext('2d'));
    };

    const zoomOut = () => {
        zoom -= 0.5;
        if (zoom < 1) {
            netPanning = 0;
            zoom = 1;
        } else {
            netPanning -= netPanning / zoom;
        }
        draw(canvasRef.current.getContext('2d'));
    };

    const handleMenu = () => {
        let menu = document.getElementById("downloadGraph")
        if (!isMenuOpen) {
            menu.style.display = "block"
        } else {
            menu.style.display = "none"
        }
        setIsMenuOpen(!isMenuOpen);
    }

    //DRAW
    const draw = (ctx, svg = false) => {
        //clear the canvas on redraw
        ctx.clearRect(0, 0, width, height);

        if (background) {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, width, height);
        }
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
                // createdAt: points[i].createdAt,
                index: i,
            });
            //draw labels eventually
            drawNumber(ctx, i + 1, getWorldX(points[i].x), GRAPH_HEIGHT + GRAPH_Y, hoveredPoint === i);
        }

        //we reverse the array so we priority is given to the later points when hovering
        drawnPoints.reverse();

        if (!svg) {
            canvasRef.current.onmousemove = function (e) {
                const rect = canvasRef.current.getBoundingClientRect();
                let dpi = window.devicePixelRatio;
                let x = (e.clientX - rect.left) * dpi;
                let y = (e.clientY - rect.top) * dpi;

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

                    if (hoveredPoint !== null) {
                        hoveredPoint = null;
                        //draw to reset drawn hovered point
                        draw(ctx);
                    }

                    if (zoom !== 1) panEventHandler(e);
                };
            };
        }
    };

    //we need to keep this event handler seperate so we can add it ontop of our mouse hover
    const panEventHandler = (e) => {
        //https://stackoverflow.com/questions/33925012/how-to-pan-the-canvas
        if (!panning) return;

        let mouseX = parseInt(e.clientX);
        let dx = mouseX - panX;
        panX = mouseX;

        netPanning += dx;
        if (netPanning > 0) {
            netPanning = 0;
        }
        if (netPanning < -width * zoom + width) netPanning = -width * zoom + width;
        draw(canvasRef.current.getContext('2d'));
    };

    useEffect(() => {
        const canvas = canvasRef.current;

        let dpi = window.devicePixelRatio || 1;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        width = canvas.offsetWidth;
        height = canvas.offsetHeight;
        canvas.width = width * dpi;
        canvas.height = height * dpi;
        const context = canvas.getContext('2d');
        context.scale(dpi, dpi);

        //set our 'consts'
        //ignore warning here, this is set on each render anyway
        GRAPH_Y = height / 2 - GRAPH_HEIGHT / 2;
        TEXT_Y = GRAPH_Y + GRAPH_HEIGHT + 20; //20 is padding

        const updateSize = (e) => {
            let dpi = window.devicePixelRatio || 1;
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = canvas.offsetWidth * dpi;
            canvas.height = canvas.offsetHeight * dpi;
            context.scale(dpi, dpi);

            //clear the canvas on redraw
            context.clearRect(0, 0, canvas.width, canvas.height);

            draw(context);
        };
        window.addEventListener('resize', updateSize);

        canvas.onmousedown = function (e) {
            panning = true;

            panX = e.clientX;
        };

        canvas.onmouseup = function (e) {
            panning = false;
        };

        canvas.onmouseout = function (e) {
            panning = false;
        };

        canvas.onmousemove = function (e) {
            panEventHandler(e);
        };

        draw(context);
        return () => window.removeEventListener('resize', updateSize);
    }, [points, props]);

    const exportSvg = () => {
        let ctx = new Canvas2Svg(width, height);
        draw(ctx, true);
        let serialized = ctx.getSerializedSvg();

        let dataURL = 'data:image/svg+xml,' + encodeURIComponent(serialized);

        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function () {
            let a = document.createElement('a');
            a.href = window.URL.createObjectURL(xhr.response);
            a.download = `${fileDownloadName}.svg`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
        };
        xhr.open('GET', dataURL); // This is to download the svg Image
        xhr.send();
    };

    const exportImage = () => {
        //insert white backdrop if no background color defined
        if (background === undefined) {
            let ctx = canvasRef.current.getContext('2d');
            let prev = background;
            background = 'white';
            draw(ctx);
            background = prev;
        }
        let canvasImage = canvasRef.current.toDataURL('image/jpeg');

        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function () {
            let a = document.createElement('a');
            a.href = window.URL.createObjectURL(xhr.response);
            a.download = `${fileDownloadName}.png`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
        };
        xhr.open('GET', canvasImage); // This is to download the canvas Image
        xhr.send();
    };

    return <div style={{ height: '200px' }}>
        <canvas
            className="bullet-graph"
            ref={canvasRef}
            {...props}
            style={{
            }}
        />
        <span
            style={{
                position: 'absolute',
                right: `${BAR_PADDING}px`,
                top: '20px'
            }}
        >
            <button onClick={exportImage}>image</button>
            <button onClick={exportSvg}>svg</button>
            <button className="zoom" onClick={zoomIn}>+</button>
            <button className="zoom" onClick={zoomOut}>-</button>
        </span>
    </div>;
};

export default BulletGraph;

