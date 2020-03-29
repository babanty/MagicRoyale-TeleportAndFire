async function start(){
    return await Promise.resolve('testAsync');
}

start().then(console.log);