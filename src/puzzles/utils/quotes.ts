export interface QuoteItem {
  text: string;
  author: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const ORIGINAL_QUOTES: QuoteItem[] = [
  {
    text: 'THE SECRET OF GETTING AHEAD IS GETTING STARTED.',
    author: 'Mark Twain',
    category: 'Inspiration',
    difficulty: 'Easy',
  },
  {
    text: 'IN THE MIDDLE OF EVERY DIFFICULTY LIES OPPORTUNITY.',
    author: 'Albert Einstein',
    category: 'Wisdom',
    difficulty: 'Medium',
  },
  {
    text: 'DO WHAT YOU CAN, WITH WHAT YOU HAVE, WHERE YOU ARE.',
    author: 'Theodore Roosevelt',
    category: 'Action',
    difficulty: 'Easy',
  },
  {
    text: 'HAPPINESS IS NOT SOMETHING READY MADE. IT COMES FROM YOUR OWN ACTIONS.',
    author: 'Dalai Lama',
    category: 'Happiness',
    difficulty: 'Medium',
  },
  {
    text: 'THE ONLY WAY TO DO GREAT WORK IS TO LOVE WHAT YOU DO.',
    author: 'Steve Jobs',
    category: 'Work',
    difficulty: 'Easy',
  },
  {
    text: 'IT ALWAYS SEEMS IMPOSSIBLE UNTIL IT IS DONE.',
    author: 'Nelson Mandela',
    category: 'Perseverance',
    difficulty: 'Easy',
  },
  {
    text: 'A JOURNEY OF A THOUSAND MILES BEGINS WITH A SINGLE STEP.',
    author: 'Lao Tzu',
    category: 'Wisdom',
    difficulty: 'Easy',
  },
  {
    text: 'NOT ALL THOSE WHO WANDER ARE LOST.',
    author: 'J.R.R. Tolkien',
    category: 'Literature',
    difficulty: 'Easy',
  },
  {
    text: 'SIMPLICITY IS THE ULTIMATE SOPHISTICATION.',
    author: 'Leonardo da Vinci',
    category: 'Art',
    difficulty: 'Medium',
  },
  {
    text: 'TURN YOUR WOUNDS INTO WISDOM AND YOUR OBSTACLES INTO STEPPING STONES.',
    author: 'Oprah Winfrey',
    category: 'Growth',
    difficulty: 'Hard',
  },
  {
    text: 'THE FUTURE BELONGS TO THOSE WHO BELIEVE IN THE BEAUTY OF THEIR DREAMS.',
    author: 'Eleanor Roosevelt',
    category: 'Hope',
    difficulty: 'Hard',
  },
  {
    text: 'PATIENCE AND PERSEVERANCE HAVE A MAGICAL EFFECT BEFORE WHICH DIFFICULTIES DISAPPEAR.',
    author: 'John Quincy Adams',
    category: 'Perseverance',
    difficulty: 'Hard',
  },
];
