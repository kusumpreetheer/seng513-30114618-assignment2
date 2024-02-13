document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').addEventListener('click', () => {
        const username = document.getElementById('username').value.trim() || "Guest";
        if (username) {
            // Hide the start screen and show the quiz container
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('quiz-container').style.display = 'block';
            
            // Start the quiz with the username
            startQuiz(username);
        } else {
            alert("Please enter your name to start the quiz.");
        }
    });
});

class Question {
    constructor(text, choices, answer, difficulty) {
        this.text = text;
        this.choices = choices;
        this.answer = answer;
        this.difficulty = difficulty; // Added difficulty attribute
    }
}

class Quiz {
    constructor(questions, user) {
        this.user = user;
        this.score = 0;
        this.questions = questions.sort((a, b) => 0.5 - Math.random()); // Shuffle questions
        this.currentQuestionIndex = 0;
        this.correctStreak = 0; // Track consecutive correct answers
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        document.getElementById('score').innerText = `Score: ${this.score}`;
    }

    displayNextQuestion() {
        if (this.currentQuestionIndex < this.questions.length) {
            const currentQuestion = this.questions[this.currentQuestionIndex];
            // Use innerHTML to ensure HTML entities are parsed and displayed correctly
            document.getElementById('question').innerHTML = currentQuestion.text;
            
            const choicesContainer = document.getElementById('choices');
            choicesContainer.innerHTML = ''; // Clear previous choices
    
            currentQuestion.choices.forEach(choice => {
                const button = document.createElement('button');
                // Again, use innerHTML for choice text
                button.innerHTML = choice;
                button.classList.add('choice');
                button.addEventListener('click', () => this.handleChoice(choice));
                choicesContainer.appendChild(button);
            });
    
            // Hide the "Next Question" button until an answer is submitted
            document.getElementById('next').style.display = 'none';
        } else {
            // End of quiz
            this.endQuiz();
        }
    }    

    handleChoice(selectedChoice) {
        const choicesButtons = document.querySelectorAll('#choices button');
        choicesButtons.forEach(button => {
            button.disabled = true; // Disable all buttons
            if (button.innerHTML === selectedChoice) {
                button.classList.add('choice-selected'); // Add selected class to the clicked button
            }
        });
    
        if (selectedChoice === this.questions[this.currentQuestionIndex].answer) {
            this.score++;
            this.correctStreak++;
        } else {
            this.correctStreak = 0; // Reset streak if the answer is wrong
        }
    
        this.updateScoreDisplay(); // Update the score display after making a choice
    
        // Show the "Next Question" button
        document.getElementById('next').style.display = 'inline-block';
    }    

    nextQuestion() {
        this.currentQuestionIndex++;
        this.displayNextQuestion();
    }

    endQuiz() {
        this.user.saveScore(this.score);
        document.getElementById('quiz-container').innerHTML = `
            <h2>Quiz completed! Final score: ${this.score}</h2>
            <h3>${this.user.username}'s High Score: ${this.user.getHighScore()}</h3>
        `;
    }
}

class User {
    constructor(username) {
        this.username = username;
        // Retrieve the score history from local storage or initialize it if not present
        this.scoreHistory = JSON.parse(localStorage.getItem(this.username + '_scoreHistory')) || [];
    }

    saveScore(score) {
        this.scoreHistory.push(score);
        // Save the updated score history to local storage
        localStorage.setItem(this.username + '_scoreHistory', JSON.stringify(this.scoreHistory));
    }

    getHighScore() {
        return this.scoreHistory.length > 0 ? Math.max(...this.scoreHistory) : 0;
    }
}

async function fetchQuestions() {
    const apiUrl = 'https://opentdb.com/api.php?amount=10&type=multiple';
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data.results.map(q => new Question(
            q.question,
            [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
            q.correct_answer,
            q.difficulty
        ));
    } catch (error) {
        console.error('Failed to fetch questions:', error);
        return [];
    }
}

async function startQuiz(username) {
    const user = new User(username); // Create a new user with the entered username

    // Ensure that questions are loaded before displaying them
    try {
        const questions = await fetchQuestions();
        if (questions.length === 0) {
            throw new Error('No questions were loaded.');
        }
        const quiz = new Quiz(questions, user);
        quiz.displayNextQuestion();
        document.getElementById('next').addEventListener('click', () => quiz.nextQuestion());
    } catch (error) {
        console.error(error);
        document.getElementById('quiz-container').innerText = 'Failed to load questions. Please try again later.';
    }
}