import React, { useEffect, useRef } from 'react';

const BulletGraph = (props) => {
    const canvasRef = useRef(null);

    //'consts' set in useeffect since it is dependent on our size
    let GRAPH_HEIGHT = 0;
    let GRAPH_Y = 0;
    let TEXT_Y = 0;

    let { points, sensorRanges, colors } = props;
    const { ranges, type } = sensorRanges;

    /*
    ranges can be of different types
        zeroToInfinite = [{name: string, x: number}] //if last element, x should be nothing
        zeroToFinite = [{name: string, x: number}] //if last element, x should have value
        finiteToFinite =[{name: string, x: number}] //first element should just be {x: number}, no name
        infiniteToInfinite = null //no ranges here, labels will just be 'negative' and 'positive'
        percentage = [{name: string, x: float}] //x should be 0.0 through 1.0, but total sum should equal 1.0
    */

    //temp data for now
    //NOTE: range input data not enough for ranges, we need a start, not just the end
    //passing in points as props for now just to test state update

    colors = [
        '#2a9d8f',
        '#e9c46a',
        '#e76f51',
        '#2a9d8f',
        '#e9c46a',
        '#e76f51',
        '#2a9d8f',
        '#e9c46a',
        '#e76f51',
    ];


    //HELPER FUNCTIONS
    const drawRanges = (ctx) => {
        let start = 0;

        if (type === 'finiteToFinite') {
            start = ranges[0].x;
        }

        let prevWidth = 0;
        for (let i = 0; i < ranges.length; i++) {
            if (i === 0 && type === 'finiteToFinite') continue;

            if ((i === 1 && type === 'finiteToFinite') || i === 0) {
                //begin
                //get width 
                let width = getWidthOfRange(start, ranges[i].x);

                ctx.fillStyle = colors[i];
                ctx.fillRect(0, GRAPH_Y, width, GRAPH_HEIGHT);

                ctx.fillStyle = 'black';
                ctx.textAlign = "start";
                ctx.font = '18px serif';
                ctx.fillText(start, 0, TEXT_Y);

                drawLabel(ctx, ranges[i].name, 0, ranges[i].x);
                prevWidth += width;
            } else {
                //end
                let width = getWidthOfRange(ranges[i - 1].x, ranges[i].x);

                ctx.fillStyle = colors[i];
                ctx.fillRect(prevWidth, GRAPH_Y, width, GRAPH_HEIGHT);

                ctx.fillStyle = 'black';
                ctx.textAlign = "center";
                ctx.font = '18px serif';
                ctx.fillText(ranges[i - 1].x, prevWidth, TEXT_Y);

                drawLabel(ctx, ranges[i].name, ranges[i - 1].x, ranges[i].x);

                prevWidth += width;

                //last element
                if (i === ranges.length - 1) {
                    ctx.fillStyle = 'black';
                    ctx.textAlign = "end";
                    ctx.font = '18px serif';
                    ctx.fillText(ranges[i].x, prevWidth, TEXT_Y);
                }
            }
        }

    };

    const getTotalRange = () => {
        if (type === 'finiteToFinite') {
            let start = ranges[0].x;
            let end = ranges[ranges.length - 1].x;
            return end - start;
        }
    };

    const getWidthOfRange = (start, end) => {
        let canvas = canvasRef.current;

        let totalWidth = canvas.width;
        let totalRange = getTotalRange();

        console.log(totalRange);

        let d = end - start;
        let p = d / totalRange;

        return totalWidth * p;
    };

    const getWorldX = (x) => {
        const totalRange = getTotalRange();
        const totalWidth = canvasRef.current.width;

        let start = 0;

        if (type === 'finiteToFinite') {
            start = ranges[0].x;
        }

        return ((x - start) / totalRange) * totalWidth;
    };

    const drawPoint = (ctx, startx, starty) => {
        ctx.fillStyle = "#0495b8";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(startx, starty);
        ctx.lineTo(startx + 15, starty - 20);
        ctx.lineTo(startx - 15, starty - 20);
        ctx.lineTo(startx, starty);
        ctx.fill();
        ctx.stroke();

        //reset
        ctx.lineWidth = 1;
    };

    const drawNumber = (ctx, index) => {
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = 'serif'
        ctx.fillText(index)
    }

    const drawLabel = (ctx, label, left, right) => {
        const LABEL_Y = 130;
        //get world coords
        const wleft = getWorldX(left);
        const wright = getWorldX(right);
        const mid = wleft + ((wright - wleft) / 2); //avoid overflow if it ever for some reason happens idk dude

        ctx.fillStyle = 'black';
        ctx.textAlign = "center";
        ctx.font = '24px serif';
        ctx.fillText(label, mid, LABEL_Y);
    };

    //DRAW
    const draw = ctx => {
        //DRAW THE RANGES or RANGE
        if (ranges) {
            drawRanges(ctx);
        } else {
            //just draw default range
            drawRanges(ctx);
        }

        //DRAW THE POINTS
        for (let i = 0; i < points.length; i++) {
            drawPoint(ctx, getWorldX(points[i].x), GRAPH_HEIGHT + GRAPH_Y);
            //draw labels eventually
        }


    };

    useEffect(() => {
        const canvas = canvasRef.current;

        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        //set our 'consts'
        //ignore warning here, this is set on each render anyway
        GRAPH_HEIGHT = 20;
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

        //clear the canvas on redraw
        context.clearRect(0, 0, canvas.width, canvas.height);

        draw(context);
        return () => window.removeEventListener('resize', updateSize);
    }, [points]);

    return <canvas
        ref={canvasRef}
        {...props}
    />;
};

export default BulletGraph;

