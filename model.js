// Cargamos el modulo Sequelize.
const Sequelize = require('sequelize');
// El primer parámetro es la URL de acceso a la bases de datos.
// El segundo parámetro de opciones indica el nombre del fichero
// con la BBDD.
const sequelize = new Sequelize("sqlite:quizzes.sqlite", {logging: false});

//Definimos modelo de datos(quiz)
//No es necesario asociarlo a una variable ya que se añade al array
//models automaticamente
sequelize.define('quiz', {
  question: {
    type: Sequelize.STRING,
    unique: {msg: "Ya existe esta pregunta"},
    validate: {notEmpty: {msg: "La pregunta no puede estar vacía"}}
  },
  answer: {
    type: Sequelize.STRING,
    validate: {notEmpty: {msg: "La respuesta no puede estar vacía"}}
  }
});

//Si en la base de datos no existen las tablas necesarias, se crean con este
//comando(es una promesa)
sequelize.sync()
.then(() => sequelize.models.quiz.count())
.then(count => {
  if (!count){ //Si no habia quizzes creados genera estos por defecto
    return sequelize.models.quiz.bulkCreate([
      {question: "Capital de Italia",answer: "Roma"},
      {question: "Capital de Francia",answer: "París"},
      {question: "Capital de España",answer: "Madrid"},
      {question: "Capital de Portugal",answer: "Lisboa"}
    ]);
  }
})
.catch(error => {
  console.log(error);
});

module.exports = sequelize;
