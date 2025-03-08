document.getElementById('load-quiz').addEventListener('click', function() {
    fetch('https://josemiguelruizguevara.com:5000/generate_questions')
    .then(response => response.json())
    .then(data => {
        if(data.error){
            alert("Error: " + data.error);
            return;
        }
        displayQuestions(data.questions);
    })
    .catch(err => {
        console.error(err);
        alert("Error al cargar las preguntas.");
    });
});

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
            label.innerHTML = `<input type="radio" name="question${index}" value="${option}"> ${option}`;
            optionsDiv.appendChild(label);
            optionsDiv.appendChild(document.createElement('br'));
        });
        
        container.appendChild(questionDiv);
    });
    document.getElementById('quiz-form').style.display = 'block';

    // Guardar las respuestas correctas para la evaluación
    document.getElementById('quiz-form').dataset.answers = JSON.stringify(questions.map(q => q.correct));
}

document.getElementById('quiz-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const answers = JSON.parse(e.target.dataset.answers);
    const formData = new FormData(e.target);
    let correctCount = 0;
    let incorrectDetails = [];
    
    answers.forEach((correct, index) => {
        const userAnswer = formData.get('question' + index);
        if(userAnswer === correct) {
            correctCount++;
        } else {
            incorrectDetails.push({
                question: document.querySelectorAll('.question')[index].querySelector('p').textContent,
                correctAnswer: correct,
                yourAnswer: userAnswer || "No respondido"
            });
        }
    });
    
    const total = answers.length;
    const incorrectCount = total - correctCount;
    
    let resultHtml = `<h2>Resultados</h2>`;
    resultHtml += `<p>Correctas: ${correctCount} / ${total}</p>`;
    resultHtml += `<p>Incorrectas: ${incorrectCount} / ${total}</p>`;
    
    if(incorrectDetails.length > 0) {
        resultHtml += `<h3>Detalles de las respuestas incorrectas:</h3>`;
        incorrectDetails.forEach((item, idx) => {
            resultHtml += `<p>${idx + 1}. ${item.question}<br>
                           Tu respuesta: ${item.yourAnswer}<br>
                           Respuesta correcta: ${item.correctAnswer}</p>`;
        });
    }
    
    document.getElementById('results').innerHTML = resultHtml;
});
