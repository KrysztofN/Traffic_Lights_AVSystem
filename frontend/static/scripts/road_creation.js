let NUM_OF_LANES = 1;

window.addEventListener('DOMContentLoaded', function() {
    loadconfig();
});

async function loadconfig() {
    const config = await fetch('../static/config/main.json')
    const configData = await config.json();
    NUM_OF_LANES = configData.lanes.count;
    createRoad();
}

function createRoad() {
    const canvas = document.getElementById('road');
    const ctx = canvas.getContext('2d');
    resizeCanvas(canvas, ctx);
    window.addEventListener('resize', () => resizeCanvas(canvas, ctx));
}

function resizeCanvas(canvas, ctx) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCrossroad(canvas, ctx);
}

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawCrossroad(canvas, ctx) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const laneWidth = 40;
    const roadWidth = NUM_OF_LANES === 1 ? 80 : NUM_OF_LANES * laneWidth * 2;
    const stopLineDistance = NUM_OF_LANES === 1 ? 110 : roadWidth / 2 + 80;
    const zebraWidth = 8;
    const zebraGap = 8;
    const zebraLength = NUM_OF_LANES === 1 ? roadWidth - 24 : 60;
    const zebraCount = Math.floor((roadWidth - 8) / (zebraWidth + zebraGap));

    const totalZebraHeight = zebraCount * zebraWidth + (zebraCount - 1) * zebraGap;
    const zebraOffset = (roadWidth - totalZebraHeight) / 2;

    // Trawa
    ctx.fillStyle = '#2e6509';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Droga
    ctx.fillStyle = '#444040';
    ctx.fillRect(0, centerY - roadWidth / 2, canvas.width, roadWidth);
    ctx.fillRect(centerX - roadWidth / 2, 0, roadWidth, canvas.height);

    // Lnie rozdzielające
    if (NUM_OF_LANES === 1) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);

        // Pozioma
        drawLine(ctx, 0, centerY, centerX - stopLineDistance - 20, centerY);
        drawLine(ctx, centerX + stopLineDistance + 20, centerY, canvas.width, centerY);

        // Pionowa
        drawLine(ctx, centerX, 0, centerX, centerY - stopLineDistance - 20);
        drawLine(ctx, centerX, centerY + stopLineDistance + 20, centerX, canvas.height);

        ctx.setLineDash([]);
    } else {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        const doubleLineGap = 6;

        // Podwójna ciągła pozioma
        drawLine(ctx, 0, centerY - doubleLineGap / 2, centerX - stopLineDistance - 10, centerY - doubleLineGap / 2);
        drawLine(ctx, centerX + stopLineDistance + 10, centerY - doubleLineGap / 2, canvas.width, centerY - doubleLineGap / 2);
        drawLine(ctx, 0, centerY + doubleLineGap / 2, centerX - stopLineDistance - 10, centerY + doubleLineGap / 2);
        drawLine(ctx, centerX + stopLineDistance + 10, centerY + doubleLineGap / 2, canvas.width, centerY + doubleLineGap / 2);

        // Podwójna ciągła pionowa
        drawLine(ctx, centerX - doubleLineGap / 2, 0, centerX - doubleLineGap / 2, centerY - stopLineDistance - 10);
        drawLine(ctx, centerX - doubleLineGap / 2, centerY + stopLineDistance + 10, centerX - doubleLineGap / 2, canvas.height);
        drawLine(ctx, centerX + doubleLineGap / 2, 0, centerX + doubleLineGap / 2, centerY - stopLineDistance - 10);
        drawLine(ctx, centerX + doubleLineGap / 2, centerY + stopLineDistance + 10, centerX + doubleLineGap / 2, canvas.height);

        // Linie rozdzielające
        if (NUM_OF_LANES > 1) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 15]);

            for (let i = 1; i < NUM_OF_LANES; i++) {
                // Poziome
                const yTop = centerY - roadWidth / 2 + (i * laneWidth);
                const yBottom = centerY + roadWidth / 2 - (i * laneWidth);

                drawLine(ctx, 0, yTop, centerX - stopLineDistance - 10, yTop);
                drawLine(ctx, centerX + stopLineDistance + 10, yTop, canvas.width, yTop);
                drawLine(ctx, 0, yBottom, centerX - stopLineDistance - 10, yBottom);
                drawLine(ctx, centerX + stopLineDistance + 10, yBottom, canvas.width, yBottom);

                // Pionowe
                const xLeft = centerX - roadWidth / 2 + (i * laneWidth);
                const xRight = centerX + roadWidth / 2 - (i * laneWidth);

                drawLine(ctx, xLeft, 0, xLeft, centerY - stopLineDistance - 10);
                drawLine(ctx, xLeft, centerY + stopLineDistance + 10, xLeft, canvas.height);
                drawLine(ctx, xRight, 0, xRight, centerY - stopLineDistance - 10);
                drawLine(ctx, xRight, centerY + stopLineDistance + 10, xRight, canvas.height);
            }
        }

        ctx.setLineDash([]);
    }

    // Linie stopu
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;

    if (NUM_OF_LANES === 1) {
        drawLine(ctx, centerX - stopLineDistance, centerY, centerX - stopLineDistance, centerY + roadWidth / 2);
        drawLine(ctx, centerX + stopLineDistance, centerY, centerX + stopLineDistance, centerY - roadWidth / 2);
        drawLine(ctx, centerX, centerY - stopLineDistance, centerX - roadWidth / 2, centerY - stopLineDistance);
        drawLine(ctx, centerX, centerY + stopLineDistance, centerX + roadWidth / 2, centerY + stopLineDistance);
    } else {
        drawLine(ctx, centerX - stopLineDistance, centerY - roadWidth / 2, centerX - stopLineDistance, centerY + roadWidth / 2);
        drawLine(ctx, centerX + stopLineDistance, centerY - roadWidth / 2, centerX + stopLineDistance, centerY + roadWidth / 2);
        drawLine(ctx, centerX - roadWidth / 2, centerY - stopLineDistance, centerX + roadWidth / 2, centerY - stopLineDistance);
        drawLine(ctx, centerX - roadWidth / 2, centerY + stopLineDistance, centerX + roadWidth / 2, centerY + stopLineDistance);
    }

    // Przejście dla pieszych
    ctx.fillStyle = 'white';
    const zebraMargin = 15;

    for (let i = 0; i < zebraCount; i++) {
        const y = centerY - roadWidth / 2 + zebraOffset + (i * (zebraWidth + zebraGap));
        const x = centerX - roadWidth / 2 + zebraOffset + (i * (zebraWidth + zebraGap));
        ctx.fillRect(centerX - stopLineDistance + zebraMargin, y, zebraLength, zebraWidth);
        ctx.fillRect(centerX + stopLineDistance - zebraLength - zebraMargin, y, zebraLength, zebraWidth);
        ctx.fillRect(x, centerY - stopLineDistance + zebraMargin, zebraWidth, zebraLength);
        ctx.fillRect(x, centerY + stopLineDistance - zebraLength - zebraMargin, zebraWidth, zebraLength);
    }
}