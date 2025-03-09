// Variables globales
let timerInterval = null;
let timeRemaining = 600; // 10 minutos en segundos
let isTimedQuiz = false;

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
  fetch('https://josemiguelruizguevara.com:5000/generate_questions')
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
      // Si es un quiz con tiempo, inicia el temporizador
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
      optionsDiv.appendChild(document.createElement('br'));
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
  
  document.getElementById('results').innerHTML = resultHtml;
  // Ocultar el formulario y el temporizador
  document.getElementById('quiz-form').style.display = 'none';
  document.getElementById('timer').style.display = 'none';
}

// Listener para el envío del formulario
document.getElementById('quiz-form').addEventListener('submit', function(e) {
  e.preventDefault();
  submitQuiz();
});

// Listener para la selección de tipo de cuestionario
document.getElementById('timed-quiz').addEventListener('click', function() {
  isTimedQuiz = true;
  document.getElementById('load-quiz').style.display = 'block';
  loadQuiz();
});

document.getElementById('untimed-quiz').addEventListener('click', function() {
  isTimedQuiz = false;
  document.getElementById('load-quiz').style.display = 'block';
  loadQuiz();
});
