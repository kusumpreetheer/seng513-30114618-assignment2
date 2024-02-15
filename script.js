document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start-btn').addEventListener('click', () => {
        const username = document.getElementById('username').value.trim() || "Guest";
        if (username) {
            // Hide the start screen immediately
            document.getElementById('start-screen').style.display = 'none';

            // Start the quiz with the username.
            startQuiz(username);
        } else {
            alert("Please enter your name to start the quiz.");
        }
    });
});


class Question {
    constructor(text, choices, answer, difficulty) { // OOP: Encapsulation
        this.text = text;
        this.choices = choices;
        this.answer = answer;
        this.difficulty = difficulty; // Added difficulty attribute
    }
}

class Quiz {
    constructor(questions, user) { // OOP: Encapsulation
        this.user = user;
        this.score = 0;
        this.questions = questions.sort((a, b) => 0.5 - Math.random()); // Shuffle questions
        this.questionsByDifficulty = {
            easy: questions.filter(q => q.difficulty === 'easy'),
            medium: questions.filter(q => q.difficulty === 'medium'),
            hard: questions.filter(q => q.difficulty === 'hard')
        };
        this.currentDifficulty = 'easy'; // Start with 'easy' difficulty
        this.currentQuestionIndex = 0;
        this.correctStreak = 0; // Track consecutive correct answers
        this.updateScoreDisplay();
        this.handleChoice = this.handleChoice.bind(this); // ensuring that 'handleChoice' maintains the 'Quiz' instance as its context
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

    updateDifficulty() {
        // Increase difficulty after every 3 consecutive correct answers, for example
        if (this.correctAnswersStreak >= 3) {
            if (this.currentDifficulty === 'easy') this.currentDifficulty = 'medium';
            else if (this.currentDifficulty === 'medium') this.currentDifficulty = 'hard';
            // Reset the streak
            this.correctAnswersStreak = 0;
        }
    }

    handleChoice(selectedChoice) {
        const choicesButtons = document.querySelectorAll('#choices button');
        choicesButtons.forEach(button => {
            button.disabled = true; // Disable all buttons
            
            if (button.innerHTML === selectedChoice) {
                // Highlight the selected choice
                button.classList.add('choice-selected');
            }
            
            // Highlight the correct answer
            const currentQuestion = this.questions[this.currentQuestionIndex];
            if (button.innerHTML === currentQuestion.answer) {
                button.classList.add('correct-answer'); // Use this class to style the correct answer
            } else {
                button.classList.add('wrong-answer'); // Optionally, style incorrect answers differently
            }
        });
    
        if (selectedChoice === this.questions[this.currentQuestionIndex].answer) {
            this.score++;
            this.correctStreak++;
        } else {
            this.correctStreak = 0; // Reset streak if the answer is wrong
        }
    
        this.updateDifficulty();

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
        // The User class encapsulates user-specific data
        this.username = username;
        // Retrieve the score history from local storage or initialize it if not present
        this.scoreHistory = JSON.parse(localStorage.getItem(this.username + '_scoreHistory')) || [];
    }

    saveScore(score) {
        // abstraction: the way how scores are saved is hidden from the users
        this.scoreHistory.push(score);
        // Save the updated score history to local storage
        localStorage.setItem(this.username + '_scoreHistory', JSON.stringify(this.scoreHistory));
    }

    getHighScore() {
        return this.scoreHistory.length > 0 ? Math.max(...this.scoreHistory) : 0;
    }
}

async function fetchQuestions() {
    // Use of async/await for asynchronous API call
    const apiUrl = 'https://opentdb.com/api.php?amount=10&type=multiple';
    try {
        const response = await fetch(apiUrl); // Asynchronous fetch call
        const data = await response.json(); // Asynchronously parsing
        return data.results.map(q => new Question(
            q.question,
            [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
            q.correct_answer,
            q.difficulty
        ));
    } catch (error) {
        console.error('Failed to fetch questions:', error); // Error handling for failed fetch operation
        return [];
    }
}

async function startQuiz(username) {
    try {
        const questions = await fetchQuestions(); // Asynchronously fetch the questions
        if (questions.length === 0) {
            throw new Error('No questions were loaded.'); // Handle case where no questions are loaded
        }

        // Initialize the Quiz with questions and user
        const quiz = new Quiz(questions, new User(username));

        // Now that everything is set up, display the quiz container and the first question
        document.getElementById('quiz-container').style.display = 'block';
        quiz.displayNextQuestion();

        // Add event listener for the "Next" button here, if it's not already globally set
        document.getElementById('next').addEventListener('click', () => quiz.nextQuestion());
    } catch (error) {
        console.error(error);
        document.getElementById('quiz-container').innerText = 'Failed to load questions. Please try again later.';
    }
}
