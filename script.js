// Variables globales
let timerInterval = null;
let timeRemaining = 600; // Valor por defecto para "Con temporizador" (10 minutos)
let isTimedQuiz = false;
let quizMode = '';  // 'timed', 'untimed' o 'simulation'

// Función para formatear el tiempo en mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Función para iniciar el temporizador
function startTimer() {
  document.getElementById('timer').style.display = 'block';
  document.getElementById('time-remaining').textContent = formatTime(timeRemaining);
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    document.getElementById('time-remaining').textContent = formatTime(timeRemaining);
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      // Auto-envía el cuestionario cuando el tiempo se acaba
      submitQuiz();
    }
  }, 1000);
}

// Funciones para mostrar/ocultar la superposición de carga
function showLoadingOverlay() {
  document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoadingOverlay() {
  document.getElementById('loading-overlay').style.display = 'none';
}

// Función para cargar las preguntas del cuestionario
function loadQuiz() {
  showLoadingOverlay();
  // Se envía el modo seleccionado como parámetro
  fetch(`https://josemiguelruizguevara.com:5000/generate_questions?mode=${quizMode}`)
    .then(response => response.json())
    .then(data => {
      hideLoadingOverlay();
      console.log(data);
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }
      if (!data.questions) {
        alert("No se encontraron preguntas.");
        return;
      }
      displayQuestions(data.questions);
      // Si es un quiz con temporizador (timed o simulation), inicia el temporizador
      if (isTimedQuiz) {
        startTimer();
      }
    })
    .catch(err => {
      hideLoadingOverlay();
      console.error(err);
      alert("Error al cargar las preguntas.");
    });
}

// Función para mostrar las preguntas y almacenar las respuestas correctas
function displayQuestions(questions) {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  // Información adicional para la simulación del examen
  if (quizMode === 'simulation') {
    const info = document.createElement('p');
    info.textContent = 'Simulación del Examen: 25 preguntas repartidas en 5 tareas. Responde correctamente al menos 15 preguntas para ser apto.';
    container.appendChild(info);
  }
  
  questions.forEach((q, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    
    const questionText = document.createElement('p');
    questionText.textContent = (index + 1) + ". " + q.question;
    questionDiv.appendChild(questionText);
    
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';
    
    q.options.forEach(option => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `question${index}`;
      input.value = option;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + option));
      optionsDiv.appendChild(label);
    });
    
    questionDiv.appendChild(optionsDiv);
    container.appendChild(questionDiv);
  });
  
  // Almacenar las respuestas correctas en un atributo data del formulario
  document.getElementById('quiz-form').dataset.answers = JSON.stringify(questions.map(q => q.correct));
  document.getElementById('quiz-form').style.display = 'block';
  // Ocultar la selección de tipo de quiz y el botón de cargar (si se muestran)
  document.getElementById('quiz-type-selection').style.display = 'none';
  document.getElementById('load-quiz').style.display = 'none';
}

// Función para evaluar y enviar el cuestionario
function submitQuiz() {
  clearInterval(timerInterval); // Para el temporizador si está activo
  const answers = JSON.parse(document.getElementById('quiz-form').dataset.answers);
  const formData = new FormData(document.getElementById('quiz-form'));
  let correctCount = 0;
  let total = answers.length;
  let incorrectDetails = [];
  
  answers.forEach((correct, index) => {
    const userAnswer = formData.get('question' + index);
    if (userAnswer === correct) {
      correctCount++;
    } else {
      incorrectDetails.push({
        question: document.querySelectorAll('.question')[index].querySelector('p').textContent,
        correctAnswer: correct,
        yourAnswer: userAnswer || "No respondido"
      });
    }
  });
  
  const score = Math.round((correctCount / total) * 100);
  let resultHtml = `<h2>Resultados</h2>`;
  resultHtml += `<p>Correctas: ${correctCount} / ${total}</p>`;
  resultHtml += `<p>Incorrectas: ${total - correctCount} / ${total}</p>`;
  resultHtml += `<p>Puntuación: ${score} / 100</p>`;
  
  if (incorrectDetails.length > 0) {
    resultHtml += `<h3>Detalles de las respuestas incorrectas:</h3>`;
    incorrectDetails.forEach((item, idx) => {
      resultHtml += `<p>${idx + 1}. ${item.question}<br>
                     Tu respuesta: ${item.yourAnswer}<br>
                     Respuesta correcta: ${item.correctAnswer}</p>`;
    });
  }
  
  // En modo simulación se muestra si el candidato es apto (mínimo 15 correctas)
  if (quizMode === 'simulation') {
    if (correctCount >= 15) {
      resultHtml += `<p><strong>Resultado: Apto</strong></p>`;
    } else {
      resultHtml += `<p><strong>Resultado: No apto</strong></p>`;
    }
  }
  
  // Agregar botón para reiniciar el cuestionario
  resultHtml += `<button id="restart-quiz">Volver a intentar</button>`;
  
  document.getElementById('results').innerHTML = resultHtml;
  // Ocultar el formulario y el temporizador
  document.getElementById('quiz-form').style.display = 'none';
  document.getElementById('timer').style.display = 'none';
  
  // Listener para reiniciar
  document.getElementById('restart-quiz').addEventListener('click', resetQuiz);
}

function resetQuiz() {
  clearInterval(timerInterval);
  
  // Reiniciar el tiempo según el modo seleccionado
  if (quizMode === 'timed') {
    timeRemaining = 600;
  } else if (quizMode === 'simulation') {
    timeRemaining = 2700;
  } else {
    timeRemaining = 0;
  }
  
  // Limpiar resultados y restablecer el formulario
  document.getElementById('results').innerHTML = "";
  document.getElementById('quiz-form').reset();
  document.getElementById('quiz-form').style.display = 'none';
  
  // Mostrar nuevamente la selección de tipo de cuestionario y ocultar el botón de cargar
  document.getElementById('quiz-type-selection').style.display = 'block';
  document.getElementById('load-quiz').style.display = 'none';
  document.getElementById('timer').style.display = 'none';
}

// Listener para el envío del formulario
document.getElementById('quiz-form').addEventListener('submit', function(e) {
  e.preventDefault();
  submitQuiz();
});

// Listener para la selección de tipo de cuestionario
document.getElementById('timed-quiz').addEventListener('click', function() {
  quizMode = 'timed';
  isTimedQuiz = true;
  timeRemaining = 600; // 10 minutos
  document.getElementById('load-quiz').style.display = 'block';
  loadQuiz();
});

document.getElementById('untimed-quiz').addEventListener('click', function() {
  quizMode = 'untimed';
  isTimedQuiz = false;
  document.getElementById('load-quiz').style.display = 'block';
  loadQuiz();
});

document.getElementById('simulation-quiz').addEventListener('click', function() {
  quizMode = 'simulation';
  isTimedQuiz = true;
  timeRemaining = 2700; // 45 minutos
  document.getElementById('load-quiz').style.display = 'block';
  loadQuiz();
});
