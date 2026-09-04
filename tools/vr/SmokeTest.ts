const ws = new WebSocket('ws://127.0.0.1:43595');
let snaps = 0;

ws.addEventListener('open', () => {
    ws.send(`${JSON.stringify({ type: 'hello' })}\n`);
    setTimeout(() => {
        ws.send(`${JSON.stringify({ type: 'walk', x: 3096, z: 3106 })}\n`);
    }, 900);
});

ws.addEventListener('message', ev => {
    const data = JSON.parse(String(ev.data));
    if (data.type === 'ok') {
        console.log('intent ok');
    }
    if (data.type === 'snapshot') {
        snaps++;
        console.log(`pos ${data.player.x} ${data.player.z}`);
        if (snaps >= 8) {
            ws.close();
            process.exit(0);
        }
    }
});

setTimeout(() => {
    console.log('timeout');
    process.exit(1);
}, 12000);
