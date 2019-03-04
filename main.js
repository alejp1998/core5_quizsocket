var net = require('net');
var host = 3030;
var clients = [];

const {log, biglog, errorlog, colorize} = require("./out");
const cmds = require("./cmds");
const readline = require('readline');

var server = net.createServer(function(socket){
  console.log("Se ha conectado un cliente desde: " + socket.remoteAddress);
  // Mensaje inicial
  biglog(socket,'CORE Quiz');

  clients.push(socket);
  socket
  .on('end',()=>{
    rl.close();
    var i = clients.indexOf(socket);
    clients.splice(i,1);
  })
  .on('error',()=>{
    rl.close();
  });

  const rl = readline.createInterface({
      input: socket,
      output: socket,
      prompt: colorize("quiz > ", 'blue'),
      completer: (line) => {
          const completions = 'h help add delete edit list test p play credits q quit'.split(' ');
          const hits = completions.filter((c) => c.startsWith(line));
          // show all completions if none found
          return [hits.length ? hits : completions, line];
      }
  });

  rl.prompt();

  rl
  .on('line', (line) => {

      let args = line.split(" ");
      let cmd = args[0].toLowerCase().trim();

      switch (cmd) {
          case '':
              rl.prompt();
              break;

          case 'help':
          case 'h':
              cmds.helpCmd(socket,rl);
              break;

          case 'quit':
          case 'q':
              cmds.quitCmd(socket,rl);
              break;

          case 'add':
              cmds.addCmd(socket,rl);
              break;

          case 'list':
              cmds.listCmd(socket,rl);
              break;

          case 'show':
              cmds.showCmd(socket,rl, args[1]);
              break;

          case 'test':
              cmds.testCmd(socket,rl, args[1]);
              break;

          case 'play':
          case 'p':
              cmds.playCmd(socket,rl);
              break;

          case 'delete':
              cmds.deleteCmd(socket,rl, args[1]);
              break;

          case 'edit':
              cmds.editCmd(socket,rl, args[1]);
              break;

          case 'credits':
              cmds.creditsCmd(socket,rl);
              break;

          default:
              log(socket,`Comando desconocido: '${colorize(cmd, 'red')}'`);
              log(socket,`Use ${colorize('help', 'green')} para ver todos los comandos disponibles.`);
              rl.prompt();
              break;
      }
  })
  .on('close', () => {
      log(socket,'Adios!');
  });
})
.listen(host, function(){
    console.log('Servidor corriendo en http://localhost:'+host);
});

exports = module.exports = clients;
