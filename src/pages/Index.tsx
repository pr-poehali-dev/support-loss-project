import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

interface QuizStep {
  question: string;
  options: { value: string; label: string }[];
}

const quizSteps: QuizStep[] = [
  {
    question: 'Как давно произошла утрата?',
    options: [
      { value: 'recent', label: 'Менее месяца назад' },
      { value: 'months', label: '1-6 месяцев назад' },
      { value: 'year', label: 'Более полугода назад' },
    ],
  },
  {
    question: 'Как бы вы описали свое текущее состояние?',
    options: [
      { value: 'shock', label: 'Шок, отрицание' },
      { value: 'anger', label: 'Гнев, раздражение' },
      { value: 'sadness', label: 'Глубокая печаль' },
      { value: 'acceptance', label: 'Постепенное принятие' },
    ],
  },
  {
    question: 'Что для вас сейчас наиболее важно?',
    options: [
      { value: 'understand', label: 'Понять, что со мной происходит' },
      { value: 'support', label: 'Получить профессиональную поддержку' },
      { value: 'track', label: 'Отслеживать свое состояние' },
      { value: 'community', label: 'Общаться с теми, кто понимает' },
    ],
  },
];

const API_USER_URL = 'https://functions.poehali.dev/8b5843b8-9998-4bdb-a58c-38211fb1f76a';
const API_DIARY_URL = 'https://functions.poehali.dev/59b9c88a-c125-4e12-94d5-8a84a7d15a47';

export default function Index() {
  const [showQuiz, setShowQuiz] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('diary');
  const [loading, setLoading] = useState(false);
  
  const [diaryEntries, setDiaryEntries] = useState<Array<{ id?: number; date: string; mood: number; text: string }>>([]);
  
  const [currentMood, setCurrentMood] = useState(5);
  const [currentEntry, setCurrentEntry] = useState('');
  const [progressData, setProgressData] = useState({
    daysStreak: 0,
    entriesTotal: 0,
    moodAverage: 0,
  });

  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingCount, setBreathingCount] = useState(4);

  useEffect(() => {
    if (!breathingActive) return;

    const timer = setInterval(() => {
      setBreathingCount((prev) => {
        if (prev === 1) {
          setBreathingPhase((currentPhase) => {
            if (currentPhase === 'inhale') return 'hold';
            if (currentPhase === 'hold') return 'exhale';
            return 'inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathingActive, breathingPhase]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    
    if (storedUserId && storedUserName) {
      setUserId(parseInt(storedUserId));
      setUserName(storedUserName);
      setShowQuiz(false);
      loadDiaryData(parseInt(storedUserId));
    }
  }, []);

  const startBreathing = () => {
    setBreathingActive(true);
    setBreathingPhase('inhale');
    setBreathingCount(4);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    setBreathingPhase('inhale');
    setBreathingCount(4);
  };

  const handleQuizAnswer = (value: string) => {
    setQuizAnswers({ ...quizAnswers, [currentStep]: value });
  };

  const nextQuizStep = () => {
    if (!quizAnswers[currentStep]) {
      toast.error('Пожалуйста, выберите вариант ответа');
      return;
    }
    
    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeQuiz();
    }
  };

  const loadDiaryData = async (uid: number) => {
    if (!uid) return;
    
    try {
      const [entriesRes, statsRes] = await Promise.all([
        fetch(API_DIARY_URL, {
          headers: { 'X-User-Id': uid.toString() },
        }),
        fetch(`${API_DIARY_URL}?action=stats`, {
          headers: { 'X-User-Id': uid.toString() },
        }),
      ]);
      
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setDiaryEntries(entriesData.entries || []);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setProgressData(statsData);
      }
    } catch (error) {
      console.error('Failed to load diary data:', error);
    }
  };

  const completeQuiz = async () => {
    if (!userName.trim()) {
      toast.error('Пожалуйста, представьтесь');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(API_USER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, quizAnswers }),
      });
      
      if (!response.ok) throw new Error('Failed to create user');
      
      const data = await response.json();
      setUserId(data.id);
      localStorage.setItem('userId', data.id.toString());
      localStorage.setItem('userName', userName);
      
      setShowQuiz(false);
      toast.success(`Добро пожаловать, ${userName}! Мы здесь, чтобы поддержать вас.`);
      
      loadDiaryData(data.id);
    } catch (error) {
      toast.error('Ошибка при создании профиля');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveDiaryEntry = async () => {
    if (!currentEntry.trim()) {
      toast.error('Напишите что-нибудь о своем дне');
      return;
    }
    
    if (!userId) {
      toast.error('Ошибка: пользователь не найден');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_DIARY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({
          mood: currentMood,
          text: currentEntry,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save entry');
      
      const newEntry = await response.json();
      setDiaryEntries([newEntry, ...diaryEntries]);
      setCurrentEntry('');
      setCurrentMood(5);
      toast.success('Запись сохранена');
      
      loadDiaryData(userId);
    } catch (error) {
      toast.error('Ошибка при сохранении записи');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (showQuiz) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 animate-glow opacity-60">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <Card className="w-full max-w-2xl card-floating animate-scale-in relative glass-effect border-0">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Icon name="Heart" size={36} className="text-white" />
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Точка опоры</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Давайте познакомимся и поймем, как мы можем вам помочь
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-4 animate-slide-up">
                <Label htmlFor="name" className="text-base font-medium">Как вас зовут?</Label>
                <Input
                  id="name"
                  placeholder="Ваше имя"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="text-base h-12 rounded-xl border-2 focus:ring-2 focus:ring-purple-400 transition-all"
                />
              </div>
            )}

            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-medium">
                  {quizSteps[currentStep].question}
                </Label>
                <Badge variant="secondary">{currentStep + 1} / {quizSteps.length}</Badge>
              </div>

              <RadioGroup
                value={quizAnswers[currentStep]}
                onValueChange={handleQuizAnswer}
                className="space-y-3"
              >
                {quizSteps[currentStep].options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 border-2 border-gray-200 rounded-xl p-4 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer bg-white"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Progress value={((currentStep + 1) / quizSteps.length) * 100} className="mt-6" />

            <div className="flex gap-3 justify-between pt-4">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="w-32"
                >
                  <Icon name="ChevronLeft" size={16} className="mr-1" />
                  Назад
                </Button>
              )}
              <Button
                onClick={nextQuizStep}
                className="ml-auto w-32"
                disabled={!quizAnswers[currentStep] || (currentStep === 0 && !userName.trim()) || loading}
              >
                {currentStep === quizSteps.length - 1 ? 'Начать' : 'Далее'}
                <Icon name="ChevronRight" size={16} className="ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh relative">
      <div className="absolute inset-0 animate-glow opacity-40">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '3s' }} />
      </div>
      <header className="border-b border-white/20 glass-effect sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-md">
              <Icon name="Heart" size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Точка опоры</h1>
              <p className="text-sm text-muted-foreground">Здравствуйте, {userName}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl border-2 hover:shadow-md transition-all">
            <Icon name="Settings" size={16} className="mr-2" />
            Настройки
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid glass-effect border-2 border-white/30 p-1.5 rounded-2xl shadow-lg">
              <TabsTrigger value="diary" className="gap-2 rounded-xl data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                <Icon name="BookOpen" size={16} />
                <span className="hidden sm:inline">Дневник</span>
              </TabsTrigger>
              <TabsTrigger value="meditation" className="gap-2 rounded-xl data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                <Icon name="Wind" size={16} />
                <span className="hidden sm:inline">Практики</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2 rounded-xl data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                <Icon name="TrendingUp" size={16} />
                <span className="hidden sm:inline">Прогресс</span>
              </TabsTrigger>
              <TabsTrigger value="education" className="gap-2 rounded-xl data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                <Icon name="GraduationCap" size={16} />
                <span className="hidden sm:inline">Обучение</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="meditation" className="space-y-6">
              <Card className="card-elevated border-0 glass-effect rounded-2xl animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-10 h-10 gradient-secondary rounded-lg flex items-center justify-center">
                      <Icon name="Wind" size={20} className="text-white" />
                    </div>
                    Дыхательная практика 4-4-4
                  </CardTitle>
                  <CardDescription className="text-base">
                    Техника осознанного дыхания помогает успокоиться и вернуться в настоящий момент
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div 
                      className={`w-48 h-48 rounded-full gradient-primary flex items-center justify-center transition-all duration-1000 ${
                        breathingActive 
                          ? breathingPhase === 'inhale' 
                            ? 'scale-110 shadow-2xl' 
                            : breathingPhase === 'hold' 
                              ? 'scale-110 shadow-2xl' 
                              : 'scale-90 shadow-md'
                          : 'scale-100 shadow-lg'
                      }`}
                    >
                      <div className="text-center text-white">
                        <div className="text-6xl font-bold">{breathingCount}</div>
                        <div className="text-xl mt-2 font-medium">
                          {breathingPhase === 'inhale' && 'Вдох'}
                          {breathingPhase === 'hold' && 'Задержка'}
                          {breathingPhase === 'exhale' && 'Выдох'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 space-y-3 w-full max-w-sm">
                      {!breathingActive ? (
                        <Button 
                          onClick={startBreathing} 
                          className="w-full gradient-primary hover:shadow-lg transition-all rounded-xl h-12 text-base font-semibold"
                        >
                          <Icon name="Play" size={16} className="mr-2" />
                          Начать практику
                        </Button>
                      ) : (
                        <Button 
                          onClick={stopBreathing}
                          variant="outline"
                          className="w-full rounded-xl h-12 text-base font-semibold border-2 hover:bg-gray-100"
                        >
                          <Icon name="Square" size={16} className="mr-2" />
                          Остановить
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Как выполнять:</h3>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                        <span>Сядьте удобно, выпрямите спину</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                        <span>Вдыхайте носом на 4 счета</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                        <span>Задержите дыхание на 4 счета</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                        <span>Выдыхайте через рот на 4 счета</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full gradient-primary text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">5</span>
                        <span>Повторяйте цикл 5-10 минут</span>
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated border-0 glass-effect rounded-2xl animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-10 h-10 gradient-secondary rounded-lg flex items-center justify-center">
                      <Icon name="Sparkles" size={20} className="text-white" />
                    </div>
                    Управляемые медитации
                  </CardTitle>
                  <CardDescription className="text-base">
                    Аудио-практики для работы с эмоциями
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      title: 'Принятие и отпускание',
                      duration: '15 минут',
                      description: 'Медитация помогает бережно принять свои чувства и начать процесс отпускания боли',
                      icon: 'Heart',
                      color: 'from-pink-50 to-rose-50',
                    },
                    {
                      title: 'Возвращение в настоящее',
                      duration: '10 минут',
                      description: 'Практика осознанности для заземления и концентрации на текущем моменте',
                      icon: 'Anchor',
                      color: 'from-blue-50 to-cyan-50',
                    },
                    {
                      title: 'Благодарность памяти',
                      duration: '12 минут',
                      description: 'Мягкая практика для работы с воспоминаниями через призму благодарности',
                      icon: 'Star',
                      color: 'from-amber-50 to-yellow-50',
                    },
                    {
                      title: 'Восстановление энергии',
                      duration: '20 минут',
                      description: 'Глубокая релаксация для восстановления эмоциональных и физических сил',
                      icon: 'Zap',
                      color: 'from-green-50 to-emerald-50',
                    },
                  ].map((meditation, index) => (
                    <div 
                      key={index} 
                      className={`border-2 border-gray-200 rounded-xl p-5 space-y-3 hover:shadow-lg hover:border-purple-300 transition-all bg-gradient-to-br ${meditation.color}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <Icon name={meditation.icon as any} size={24} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-base">{meditation.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{meditation.description}</p>
                          </div>
                        </div>
                        <Badge className="gradient-secondary text-white border-0 rounded-lg px-3 flex-shrink-0">
                          {meditation.duration}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full rounded-xl border-2 hover:bg-white hover:shadow-md transition-all"
                      >
                        <Icon name="Play" size={14} className="mr-2" />
                        Начать медитацию
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="card-elevated border-0 glass-effect rounded-2xl animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-10 h-10 gradient-secondary rounded-lg flex items-center justify-center">
                      <Icon name="Music" size={20} className="text-white" />
                    </div>
                    Успокаивающие звуки
                  </CardTitle>
                  <CardDescription className="text-base">
                    Фоновые звуки природы для релаксации
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { name: 'Дождь', icon: 'CloudRain' },
                      { name: 'Океан', icon: 'Waves' },
                      { name: 'Лес', icon: 'Trees' },
                      { name: 'Костер', icon: 'Flame' },
                      { name: 'Ветер', icon: 'Wind' },
                      { name: 'Ручей', icon: 'Droplets' },
                    ].map((sound, index) => (
                      <button
                        key={index}
                        className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all bg-white"
                      >
                        <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                          <Icon name={sound.icon as any} size={20} className="text-white" />
                        </div>
                        <span className="text-sm font-medium">{sound.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="diary" className="space-y-6">
              <Card className="card-elevated border-0 glass-effect rounded-2xl overflow-hidden animate-scale-in">
                <div className="h-2 gradient-primary animate-glow" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-10 h-10 gradient-secondary rounded-lg flex items-center justify-center">
                      <Icon name="Pencil" size={20} className="text-white" />
                    </div>
                    Новая запись
                  </CardTitle>
                  <CardDescription className="text-base">
                    Опишите ваш день и эмоции. Это помогает отслеживать динамику состояния.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Настроение сегодня: {currentMood}/10</Label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentMood}
                      onChange={(e) => setCurrentMood(parseInt(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Тяжело</span>
                      <span>Нейтрально</span>
                      <span>Хорошо</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entry">Запись в дневник</Label>
                    <Textarea
                      id="entry"
                      placeholder="Что происходило сегодня? Какие мысли и чувства вы испытывали?"
                      value={currentEntry}
                      onChange={(e) => setCurrentEntry(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  <Button onClick={saveDiaryEntry} disabled={loading} className="w-full gradient-primary hover:shadow-lg transition-all rounded-xl h-12 text-base font-semibold">
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить запись
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-elevated border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl">История записей</CardTitle>
                  <CardDescription className="text-base">
                    Ваши предыдущие записи. Страйк: <span className="font-bold text-orange-500">{progressData.daysStreak} дней подряд 🔥</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diaryEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="BookOpen" size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Пока нет записей в дневнике</p>
                      <p className="text-sm">Начните делать записи, чтобы отслеживать свой прогресс</p>
                    </div>
                  ) : (
                    diaryEntries.map((entry, index) => (
                      <div key={index} className="border-2 border-gray-200 rounded-xl p-5 space-y-2 hover:shadow-lg hover:border-purple-300 transition-all bg-gradient-to-br from-white to-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          <Badge className="gradient-secondary text-white border-0 rounded-lg px-3">Настроение: {entry.mood}/10</Badge>
                        </div>
                        <p className="text-sm text-gray-700">{entry.text}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="card-elevated border-0 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl overflow-hidden animate-scale-in">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold">Страйк</CardTitle>
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Icon name="Flame" className="text-orange-600" size={22} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{progressData.daysStreak} дней</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Ежедневных записей подряд</p>
                  </CardContent>
                </Card>

                <Card className="card-elevated border-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl overflow-hidden animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold">Всего записей</CardTitle>
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Icon name="BookOpen" className="text-blue-600" size={22} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{progressData.entriesTotal}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">За все время</p>
                  </CardContent>
                </Card>

                <Card className="card-elevated border-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl overflow-hidden animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold">Среднее настроение</CardTitle>
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Icon name="Smile" className="text-green-600" size={22} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{progressData.moodAverage}/10</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">За последние 7 дней</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="card-elevated border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Динамика вашего состояния</CardTitle>
                  <CardDescription className="text-base">График показывает изменение настроения со временем</CardDescription>
                </CardHeader>
                <CardContent>
                  {diaryEntries.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Icon name="TrendingUp" size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Недостаточно данных для графика</p>
                        <p className="text-sm">Делайте записи, чтобы увидеть динамику</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-end justify-between gap-3 p-4 bg-gradient-to-b from-purple-50/50 to-blue-50/50 rounded-xl">
                      {diaryEntries.slice(0, 10).reverse().map((entry, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full gradient-primary rounded-t-lg transition-all hover:opacity-80 shadow-md"
                            style={{ height: `${(entry.mood / 10) * 100}%` }}
                          />
                          <span className="text-xs text-muted-foreground font-medium">
                            {new Date(entry.date).getDate()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-elevated border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-10 h-10 gradient-secondary rounded-lg flex items-center justify-center">
                      <Icon name="Award" size={20} className="text-white" />
                    </div>
                    Ваши достижения
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-4 p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 hover:shadow-md transition-all">
                      <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                        <Icon name="Check" className="text-white" size={28} />
                      </div>
                      <div>
                        <p className="font-semibold text-base">Первая запись</p>
                        <p className="text-sm text-muted-foreground">Вы начали свой путь</p>
                      </div>
                    </div>
                    {progressData.daysStreak >= 7 && (
                      <div className="flex items-center gap-4 p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 hover:shadow-md transition-all">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                          <Icon name="Flame" className="text-white" size={28} />
                        </div>
                        <div>
                          <p className="font-semibold text-base">Страйк 7 дней</p>
                          <p className="text-sm text-muted-foreground">Отличная регулярность</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education" className="space-y-6">
              <Card className="card-elevated border-0 glass-effect rounded-2xl animate-scale-in">
                <CardHeader>
                  <CardTitle className="text-2xl">Стадии переживания утраты</CardTitle>
                  <CardDescription className="text-base">
                    Понимание процесса помогает чувствовать себя увереннее
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      title: 'Отрицание и шок',
                      description: 'Защитная реакция психики. Это нормально — не сразу принимать реальность.',
                      icon: 'ShieldAlert',
                    },
                    {
                      title: 'Гнев',
                      description: 'Раздражение и злость — естественная реакция на несправедливость ситуации.',
                      icon: 'Flame',
                    },
                    {
                      title: 'Торг',
                      description: 'Попытки вернуть прошлое, мысли "а что если...". Это часть процесса принятия.',
                      icon: 'MessageCircle',
                    },
                    {
                      title: 'Депрессия',
                      description: 'Глубокая печаль — это не слабость, а важный этап проживания боли.',
                      icon: 'CloudRain',
                    },
                    {
                      title: 'Принятие',
                      description: 'Постепенное возвращение к жизни с памятью, но без острой боли.',
                      icon: 'Heart',
                    },
                  ].map((stage, index) => (
                    <div key={index} className="flex gap-4 p-5 border-2 border-gray-200 rounded-xl hover:shadow-lg hover:border-purple-300 transition-all bg-gradient-to-r from-white to-gray-50">
                      <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Icon name={stage.icon as any} className="text-white" size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-base">{stage.title}</h3>
                        <p className="text-sm text-gray-700">{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="card-elevated border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-10 h-10 gradient-secondary rounded-lg flex items-center justify-center">
                      <Icon name="Users" size={20} className="text-white" />
                    </div>
                    Профессиональная помощь
                  </CardTitle>
                  <CardDescription className="text-base">
                    Проверенные психологи и центры поддержки
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="border-2 border-gray-200 rounded-xl p-5 space-y-2 hover:shadow-lg hover:border-purple-300 transition-all bg-white">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base">«Это важно»</h3>
                        <Badge className="gradient-accent text-white border-0">Партнер</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Сервис Елены Мицкевич с проверенными психологами и строгим отбором специалистов
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Icon name="ExternalLink" size={14} className="mr-2" />
                        Записаться на консультацию
                      </Button>
                    </div>

                    <div className="border-2 border-gray-200 rounded-xl p-5 space-y-2 hover:shadow-lg hover:border-purple-300 transition-all bg-white">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base">Центр «Focus»</h3>
                        <Badge className="gradient-accent text-white border-0">Партнер</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Психологи топ-10 Москвы, специализирующиеся на работе с утратой
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Icon name="ExternalLink" size={14} className="mr-2" />
                        Узнать подробнее
                      </Button>
                    </div>

                    <div className="border-2 border-gray-200 rounded-xl p-5 space-y-2 hover:shadow-lg hover:border-purple-300 transition-all bg-white">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base">«Synaps»</h3>
                        <Badge className="gradient-accent text-white border-0">Партнер</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Главный психолог — Мария Максимова, к.м.н., член РОП
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Icon name="ExternalLink" size={14} className="mr-2" />
                        Связаться
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="gradient-primary rounded-2xl p-6 space-y-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Icon name="Sparkles" className="text-white" size={24} />
                      <h4 className="font-bold text-white text-lg">Премиум подписка</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-white/95">
                      <li className="flex items-center gap-2">
                        <Icon name="Check" size={16} className="text-white" />
                        Скидка на первые 3 консультации
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon name="Check" size={16} className="text-white" />
                        Интерактивные списки мест в вашем городе
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon name="Check" size={16} className="text-white" />
                        Возможность делиться записями с близкими
                      </li>
                    </ul>
                    <Button className="w-full mt-3 bg-white text-purple-600 hover:bg-gray-100 shadow-md rounded-xl h-12 font-bold text-base">
                      Оформить за 1800₽
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="w-10 h-10 gradient-secondary rounded-lg flex items-center justify-center">
                      <Icon name="Package" size={20} className="text-white" />
                    </div>
                    Физические наборы с карточками
                  </CardTitle>
                  <CardDescription className="text-base">
                    Инструменты для работы с эмоциями в офлайне
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    Набор включает карточки с картинками и вопросами, браслет-якорь для возвращения в настоящий момент,
                    ручку с исчезающими чернилами и блокнот для символического отпускания боли.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Icon name="ShoppingCart" size={16} className="mr-2" />
                    Заказать набор
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t border-white/20 mt-16 glass-effect relative">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p className="font-medium">© 2024 Точка опоры. Все права защищены.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-purple-600 transition-all font-medium hover:underline">Пользовательское соглашение</a>
              <a href="#" className="hover:text-purple-600 transition-all font-medium hover:underline">Конфиденциальность</a>
              <a href="#" className="hover:text-purple-600 transition-all font-medium hover:underline">Контакты</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
