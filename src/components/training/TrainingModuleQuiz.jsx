import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RotateCcw, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TrainingModuleQuiz({ 
  questions, 
  onQuizPassed, 
  moduleName = 'Training Module',
  passPercentage = 80,
  quizId = 'default-quiz'
}) {
  // Persist quiz state in localStorage to survive page refresh
  const storageKey = `quiz-state-${quizId}`;
  
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).currentQuestion : 0;
  });
  
  const [selectedAnswers, setSelectedAnswers] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).selectedAnswers : {};
  });
  
  const [showResults, setShowResults] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).showResults : false;
  });
  
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).score : 0;
  });
  
  const [quizStarted, setQuizStarted] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).quizStarted : false;
  });
  
  const [quizPassed, setQuizPassed] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).quizPassed : false;
  });

  const saveState = (newState) => {
    localStorage.setItem(storageKey, JSON.stringify(newState));
  };

  const handleSelectAnswer = (questionIndex, answerIndex) => {
    if (showResults) return;
    const newAnswers = {
      ...selectedAnswers,
      [questionIndex]: answerIndex
    };
    setSelectedAnswers(newAnswers);
    saveState({
      currentQuestion,
      selectedAnswers: newAnswers,
      showResults,
      score,
      quizStarted,
      quizPassed
    });
  };

  const getQuestionOptions = (question) => {
    if (question.type === 'true-false') {
      return ['True', 'False'];
    }
    return question.options || [];
  };

  const handleSubmit = () => {
    if (!quizStarted) {
      setQuizStarted(true);
      saveState({
        currentQuestion,
        selectedAnswers,
        showResults,
        score,
        quizStarted: true,
        quizPassed
      });
      return;
    }

    // Calculate score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setScore(calculatedScore);
    setShowResults(true);

    const newState = {
      currentQuestion,
      selectedAnswers,
      showResults: true,
      score: calculatedScore,
      quizStarted,
      quizPassed: calculatedScore >= passPercentage
    };
    
    saveState(newState);

    if (calculatedScore >= passPercentage) {
      setQuizPassed(true);
      onQuizPassed(true, calculatedScore);
    } else {
      // Fail-safe: Do NOT unlock if score < 80%
      onQuizPassed(false, calculatedScore);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setCurrentQuestion(0);
    setScore(0);
  };

  if (!quizStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12"
      >
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Module Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700 mb-4">
              You've reached the end of {moduleName}. Test your knowledge with a quick quiz to unlock certification.
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-slate-600">
                <strong>✓ {questions.length} questions</strong>
              </p>
              <p className="text-sm text-slate-600">
                <strong>✓ Pass score: {passPercentage}%</strong>
              </p>
              <p className="text-sm text-slate-600">
                <strong>✓ Unlimited attempts</strong>
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (showResults) {
    const passed = score >= passPercentage;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-12"
      >
        <Card className={`border-2 ${passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader className={`bg-gradient-to-r ${passed ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white rounded-t-lg`}>
            <CardTitle className="flex items-center gap-2">
              {passed ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Quiz Passed!
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Quiz Not Passed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold mb-2">
                {score}%
              </div>
              <p className="text-slate-600">
                {Object.keys(selectedAnswers).length} out of {questions.length} correct
              </p>
            </div>

            {passed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-emerald-100 border border-emerald-300 rounded-lg mb-6"
              >
                <p className="text-emerald-800 font-semibold">
                  🎉 Excellent! You've mastered this module. You can now proceed to certification.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-100 border border-red-300 rounded-lg mb-6"
              >
                <p className="text-red-800 font-semibold">
                  You need {passPercentage}% to pass. Review the material and try again!
                </p>
              </motion.div>
            )}

            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {passed ? 'Review & Retake' : 'Try Again'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = selectedAnswers[currentQuestion] !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12"
    >
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle>
              Question {currentQuestion + 1} of {questions.length}
            </CardTitle>
            <Badge variant="secondary" className="bg-white text-blue-600">
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-6 text-slate-900">
            {question.question}
          </h3>

          <div className="space-y-3 mb-8">
            {getQuestionOptions(question).map((option, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleSelectAnswer(currentQuestion, idx)}
                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                  ${selectedAnswers[currentQuestion] === idx
                    ? 'border-blue-500 bg-blue-100'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="font-semibold text-slate-700">{String.fromCharCode(65 + idx)}.</span>
                <span className="ml-3 text-slate-700">{option}</span>
              </motion.button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              className="h-full bg-blue-500 rounded-full"
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex gap-3">
            {currentQuestion > 0 && (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                variant="outline"
                className="flex-1"
              >
                Previous
              </Button>
            )}
            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                disabled={!isAnswered}
                className={`flex-1 ${!isAnswered ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isAnswered}
                className={`flex-1 bg-emerald-600 hover:bg-emerald-700 ${!isAnswered ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Submit Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}