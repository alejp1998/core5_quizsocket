
const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');

//Promesa que comprueba que el id introducido es valido
const validateId = id => {
  return new Sequelize.Promise((resolve,reject) => {
    if (typeof id === "undefined"){
      reject(new Error(`Falta el parámetro <id>.`));
    } else {
      id = parseInt(id);
      if (Number.isNaN(id)){
        reject(new Error(`El valor del parámetro <id> no es un número.`));
      } else {
        resolve(id);
      }
    }
  });
};

//Colorea en rojo el texto de la pregunta, elimina espacios
const makeQuestion = (rl, text) => {
  return new Sequelize.Promise((resolve,reject)=> {
    rl.question(colorize(text,'red')+" ",answer => {
      resolve(answer.trim());
    });
  });
};

/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = (socket,rl) => {
    log(socket,"Commandos:");
    log(socket,"  h|help - Muestra esta ayuda.");
    log(socket,"  list - Listar los quizzes existentes.");
    log(socket,"  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log(socket,"  add - Añadir un nuevo quiz interactivamente.");
    log(socket,"  delete <id> - Borrar el quiz indicado.");
    log(socket,"  edit <id> - Editar el quiz indicado.");
    log(socket,"  test <id> - Probar el quiz indicado.");
    log(socket,"  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket,"  credits - Créditos.");
    log(socket,"  q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = (socket,rl) => {
    //Promesa que devuelve todos los quizzes existentes(array)
    models.quiz.findAll()
    .each(quiz => {
        log(socket,`[${colorize(quiz.id, 'blue')}]: ${quiz.question}`);
    })
    .catch(error => {
      errorlog(socket,error.message);
    })
    .then(()=>{
      rl.prompt();
    });
    //No sacamos el prompt hasta no terminar con las promesas
};


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (socket,rl,id) => {
    validateId(id)
    .then(id => models.quiz.findByPk(id))
    .then(quiz => {
      if(!quiz){
        throw new Error(`No existe un quiz asociado al id=${id}.`)
      }
      log(socket,` [${colorize(quiz.id, 'blue')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
      errorlogsocket,(error.message);
    })
    .then(()=>{
      rl.prompt();
    });
};


/**
 * Añade un nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = (socket,rl) => {
  makeQuestion(rl,'Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion(rl,'Introduzca la respuesta: ')
    .then(a => {
      return {question: q, answer: a};
    });
  })
  .then(quiz => {
    return models.quiz.create(quiz);
    log(socket,` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket,'El quiz es erroneo: ');
    error.errors.forEach(({message}) => errorlog(socket,message));
  })
  .catch(error => {
    errorlog(socket,error,message);
  })
  .then(()=> {
    rl.prompt();
  });
};


/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (socket,rl,id) => {
    validateId(id)
    .then((id)=>{
      models.quiz.destroy({where: {id}});
      log(socket,'Eliminada la pregunta '+ id,'red');
    })
    .catch(error => {
      errorlog(socket,error.message);
    })
    .then(()=>{
      rl.prompt();
    });
};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (socket,rl,id) => {
  validateId(id)
  .then(id => models.quiz.findByPk(id))
  .then(quiz => {
    if(!quiz){
      throw new Error(`No existe un quiz asociado al id `+id);
    }
    socket.isTTY && setTimeout(() => {socket.write(quiz.question)},0);
    return makeQuestion(rl,'Introduzca una pregunta: ')
    .then(q => {
      socket.isTTY && setTimeout(() => {socket.write(quiz.answer)},0);
      return makeQuestion(rl,'Introduzca la respuesta: ')
      .then(a => {
        return {question: q, answer: a};
      });
    })
    .then(quiz => {
      models.quiz.update(quiz, {where: {id}});
      log(socket,` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
      return;
    });
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket,'El quiz es erroneo: ');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(socket,error.message);
  })
  .then(() => {
    rl.prompt();
  });
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (socket,rl,id) => {
  validateId(id)
  .then(id => models.quiz.findByPk(id))
  .then(quiz => {
    if(!quiz){
      throw new Error(`No existe un quiz asociado al id `+id);
    }
    return makeQuestion(rl,quiz.question)
    .then(a => {
      if(a == quiz.answer){
        biglog(socket,'Correcta','green');
      }else{
        biglog(socket,'Incorrecta','red');
      }
    });
  })
  .catch(error => {
    errorlog(socket,error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = (socket,rl) => {
    log(socket,'Jugar.', 'red');
    let score = 0;
    let i = 0;
    let id = 0;
    let ids = new Array();
    const newQuestion = () => {
      id = Math.floor(Math.random()*(ids.length));
      models.quiz.findByPk(ids[id])
      .then(quiz => {
        makeQuestion(rl,quiz.question)
        .then(a => {
          if(a == quiz.answer){
            score++;
            log(socket,'Correcta. Aciertos: ' + score);
            ids.splice(id, 1);
            if(ids.length < 1){
              biglog(socket,'WINNER','magenta');
              rl.prompt();
            }else{
              newQuestion();
            }
          }else{
            log(socket,'Incorrecta.','magenta');
            biglog(socket,'FIN','red');
            log(socket,'Has conseguido: '+ score + ' puntos.','magenta');
            rl.prompt();
          }
        });
      });
    }

    models.quiz.findAll()
    .each(quiz => {
      ids[i] = quiz.id;
      i++;
    })
    .then(()=>{
      newQuestion();
    });
}
/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = (socket,rl) => {
    log(socket,'Autores de la práctica:');
    log(socket,'Alejandro Jarabo Peñas', 'green');
    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = (socket,rl) => {
    rl.close();
    socket.end();
};


/*.catch(Sequelize.ValidationError, function(error){
  log("Errores de validación:", error);
  for(var i in error.errors){
    log('Error en el campo:',error.errors[i].value);
  };
})
.catch(function(error){
  log("Error: ",error);
});*/
