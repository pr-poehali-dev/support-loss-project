import { useState } from 'react';
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

export default function Index() {
  const [showQuiz, setShowQuiz] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('diary');
  
  const [diaryEntries, setDiaryEntries] = useState<Array<{ date: string; mood: number; text: string }>>([
    { date: '2024-11-05', mood: 6, text: 'Сегодня было немного легче. Смогла выйти на прогулку.' },
    { date: '2024-11-04', mood: 4, text: 'Тяжелый день. Много воспоминаний.' },
  ]);
  
  const [currentMood, setCurrentMood] = useState(5);
  const [currentEntry, setCurrentEntry] = useState('');
  const [progressData] = useState({
    daysStreak: 7,
    entriesTotal: 12,
    moodAverage: 5.2,
  });

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

  const completeQuiz = () => {
    if (!userName.trim()) {
      toast.error('Пожалуйста, представьтесь');
      return;
    }
    setShowQuiz(false);
    toast.success(`Добро пожаловать, ${userName}! Мы здесь, чтобы поддержать вас.`);
  };

  const saveDiaryEntry = () => {
    if (!currentEntry.trim()) {
      toast.error('Напишите что-нибудь о своем дне');
      return;
    }

    const newEntry = {
      date: new Date().toISOString().split('T')[0],
      mood: currentMood,
      text: currentEntry,
    };

    setDiaryEntries([newEntry, ...diaryEntries]);
    setCurrentEntry('');
    setCurrentMood(5);
    toast.success('Запись сохранена');
  };

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Icon name="Heart" size={32} className="text-primary" />
            </div>
            <CardTitle className="text-3xl font-semibold">Точка опоры</CardTitle>
            <CardDescription className="text-base">
              Давайте познакомимся и поймем, как мы можем вам помочь
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
              <div className="space-y-4 animate-slide-up">
                <Label htmlFor="name" className="text-base">Как вас зовут?</Label>
                <Input
                  id="name"
                  placeholder="Ваше имя"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="text-base"
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
                    className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">
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
                disabled={!quizAnswers[currentStep] || (currentStep === 0 && !userName.trim())}
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
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="Heart" size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Точка опоры</h1>
              <p className="text-sm text-muted-foreground">Здравствуйте, {userName}</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Icon name="Settings" size={16} className="mr-2" />
            Настройки
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="diary" className="gap-2">
                <Icon name="BookOpen" size={16} />
                Дневник
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2">
                <Icon name="TrendingUp" size={16} />
                Прогресс
              </TabsTrigger>
              <TabsTrigger value="education" className="gap-2">
                <Icon name="GraduationCap" size={16} />
                Обучение
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diary" className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Pencil" size={20} />
                    Новая запись
                  </CardTitle>
                  <CardDescription>
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

                  <Button onClick={saveDiaryEntry} className="w-full">
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить запись
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>История записей</CardTitle>
                  <CardDescription>
                    Ваши предыдущие записи. Страйк: {progressData.daysStreak} дней подряд 🔥
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diaryEntries.map((entry, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <Badge variant="outline">Настроение: {entry.mood}/10</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6 animate-fade-in">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Страйк</CardTitle>
                    <Icon name="Flame" className="text-orange-500" size={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{progressData.daysStreak} дней</div>
                    <p className="text-xs text-muted-foreground mt-1">Ежедневных записей подряд</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
                    <Icon name="BookOpen" className="text-primary" size={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{progressData.entriesTotal}</div>
                    <p className="text-xs text-muted-foreground mt-1">За все время</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Среднее настроение</CardTitle>
                    <Icon name="Smile" className="text-green-500" size={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{progressData.moodAverage}/10</div>
                    <p className="text-xs text-muted-foreground mt-1">За последние 7 дней</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Динамика вашего состояния</CardTitle>
                  <CardDescription>График показывает изменение настроения со временем</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {diaryEntries.reverse().map((entry, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                          style={{ height: `${(entry.mood / 10) * 100}%` }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.date).getDate()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Award" size={20} />
                    Ваши достижения
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name="Check" className="text-primary" size={24} />
                      </div>
                      <div>
                        <p className="font-medium">Первая запись</p>
                        <p className="text-sm text-muted-foreground">Вы начали свой путь</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name="Flame" className="text-orange-500" size={24} />
                      </div>
                      <div>
                        <p className="font-medium">Страйк 7 дней</p>
                        <p className="text-sm text-muted-foreground">Отличная регулярность</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education" className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Стадии переживания утраты</CardTitle>
                  <CardDescription>
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
                    <div key={index} className="flex gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name={stage.icon as any} className="text-primary" size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold">{stage.title}</h3>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Users" size={20} />
                    Профессиональная помощь
                  </CardTitle>
                  <CardDescription>
                    Проверенные психологи и центры поддержки
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">«Это важно»</h3>
                        <Badge>Партнер</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Сервис Елены Мицкевич с проверенными психологами и строгим отбором специалистов
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Icon name="ExternalLink" size={14} className="mr-2" />
                        Записаться на консультацию
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Центр «Focus»</h3>
                        <Badge>Партнер</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Психологи топ-10 Москвы, специализирующиеся на работе с утратой
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Icon name="ExternalLink" size={14} className="mr-2" />
                        Узнать подробнее
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">«Synaps»</h3>
                        <Badge>Партнер</Badge>
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

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon name="Sparkles" className="text-primary" size={20} />
                      <h4 className="font-semibold">Премиум подписка</h4>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Icon name="Check" size={14} className="text-primary" />
                        Скидка на первые 3 консультации
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon name="Check" size={14} className="text-primary" />
                        Интерактивные списки мест в вашем городе
                      </li>
                      <li className="flex items-center gap-2">
                        <Icon name="Check" size={14} className="text-primary" />
                        Возможность делиться записями с близкими
                      </li>
                    </ul>
                    <Button className="w-full mt-3">
                      Оформить за 1800₽
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Package" size={20} />
                    Физические наборы с карточками
                  </CardTitle>
                  <CardDescription>
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

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 Точка опоры. Все права защищены.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Пользовательское соглашение</a>
              <a href="#" className="hover:text-foreground transition-colors">Конфиденциальность</a>
              <a href="#" className="hover:text-foreground transition-colors">Контакты</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
