import React, { useEffect, useRef } from 'react';

const BulletGraph = (props) => {
    const canvasRef = useRef(null);

    let { points, sensorRanges, colors } = props;

    //temp data for now
    //NOTE: range input data not enough for ranges, we need a start, not just the end
    //passing in points as props for now just to test state update

    colors = [
        '#2a9d8f',
        '#e9c46a',
        '#e76f51'
    ];


    //HELPER FUNCTIONS
    const getWidthOfRange = (start, end, totalRange, totalWidth) => {
        //get the percentage of total width
        let d = end - start;
        let p = d / totalRange;

        return totalWidth * p;
    };

    const getWorldX = (x) => {
        const totalRange = sensorRanges[sensorRanges.length - 1].x;
        const totalWidth = canvasRef.current.width;

        return (x / totalRange) * totalWidth;
    };

    const drawPoint = (ctx, startx, starty) => {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 3;
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

    const drawLabel = (ctx, label, left, right) => {
        console.log(left, right);
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
        let canvas = canvasRef.current;
        //CONSTANTS (CHANGE THIS TO BE PROPS WITH DEFAULT VALUES EVENTUALLY)
        const GRAPH_HEIGHT = 20;
        const GRAPH_Y = canvas.height / 2 - GRAPH_HEIGHT / 2;
        const TEXT_Y = GRAPH_Y + GRAPH_HEIGHT + 20; //20 is padding

        //DRAW THE RANGES
        let totalWidth = canvas.width;

        //we are going to have to change the way we get ranges once we have standard data
        let totalRange = sensorRanges[sensorRanges.length - 1].x;

        let prevWidth = 0;
        for (let i = 0; i < sensorRanges.length; i++) {
            if (i === 0) {
                //begin
                //get width 
                let width = getWidthOfRange(0, sensorRanges[i].x, totalRange, totalWidth);

                ctx.fillStyle = colors[i];
                ctx.fillRect(0, GRAPH_Y, width, GRAPH_HEIGHT);

                ctx.fillStyle = 'black';
                ctx.textAlign = "start";
                ctx.font = '18px serif';
                ctx.fillText('0.0', 0, TEXT_Y);

                drawLabel(ctx, sensorRanges[i].name, 0, sensorRanges[i].x);
                prevWidth += width;
            } else {
                //end
                let width = getWidthOfRange(sensorRanges[i - 1].x, sensorRanges[i].x, totalRange, totalWidth);

                ctx.fillStyle = colors[i];
                ctx.fillRect(prevWidth, GRAPH_Y, width, GRAPH_HEIGHT);

                ctx.fillStyle = 'black';
                ctx.textAlign = "center";
                ctx.font = '18px serif';
                ctx.fillText(sensorRanges[i - 1].x, prevWidth, TEXT_Y);

                drawLabel(ctx, sensorRanges[i].name, sensorRanges[i - 1].x, sensorRanges[i].x);

                prevWidth += width;

                //last element
                if (i === sensorRanges.length - 1) {
                    ctx.fillStyle = 'black';
                    ctx.textAlign = "end";
                    ctx.font = '18px serif';
                    ctx.fillText(sensorRanges[i].x, prevWidth, TEXT_Y);
                }
            }
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

