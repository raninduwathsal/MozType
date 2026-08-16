import { Quote, QuoteLength } from '../types';

export const POPULAR_QUOTES: Quote[] = [
  {
    id: 1,
    text: "The quick brown fox jumps over the lazy dog.",
    author: "Traditional Pangram",
    length: "short"
  },
  {
    id: 2,
    text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    author: "Ralph Waldo Emerson",
    length: "medium"
  },
  {
    id: 3,
    text: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra",
    length: "short"
  },
  {
    id: 4,
    text: "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
    source: "Structure and Interpretation of Computer Programs",
    length: "medium"
  },
  {
    id: 5,
    text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler",
    length: "medium"
  },
  {
    id: 6,
    text: "Premature optimization is the root of all evil in programming.",
    author: "Donald Knuth",
    length: "short"
  },
  {
    id: 7,
    text: "Talk is cheap. Show me the code.",
    author: "Linus Torvalds",
    length: "short"
  },
  {
    id: 8,
    text: "Stay hungry, stay foolish. Never let the noise of others' opinions drown out your own inner voice.",
    author: "Steve Jobs",
    source: "Stanford Commencement Address",
    length: "medium"
  },
  {
    id: 9,
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall. The future belongs to those who believe in the beauty of their dreams.",
    author: "Nelson Mandela & Eleanor Roosevelt",
    length: "long"
  },
  {
    id: 10,
    text: "In the middle of difficulty lies opportunity. Life is not about waiting for the storm to pass, but learning how to dance in the rain.",
    author: "Albert Einstein",
    length: "medium"
  },
  {
    id: 11,
    text: "First, solve the problem. Then, write the code. Complexity is your enemy. Any fool can make something complicated. It is hard to keep things simple.",
    author: "John Johnson",
    length: "medium"
  },
  {
    id: 12,
    text: "You miss one hundred percent of the shots you do not take. Great things never came from comfort zones.",
    author: "Wayne Gretzky",
    length: "short"
  },
  {
    id: 13,
    text: "Whether you think you can or you think you cannot, you are right. Believe you can and you are halfway there.",
    author: "Henry Ford & Theodore Roosevelt",
    length: "medium"
  },
  {
    id: 14,
    text: "There are two ways of constructing a software design: One way is to make it so simple that there are obviously no deficiencies, and the other way is to make it so complicated that there are no obvious deficiencies.",
    author: "C.A.R. Hoare",
    length: "long"
  },
  {
    id: 15,
    text: "Software is a great combination between artistry and engineering. When you build something that millions of people interact with daily, every millisecond and every keystroke matters immensely.",
    author: "Bill Gates",
    length: "long"
  },
  {
    id: 16,
    text: "It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood.",
    author: "Theodore Roosevelt",
    source: "Citizenship in a Republic",
    length: "thicc"
  },
  {
    id: 17,
    text: "Two roads diverged in a yellow wood, and sorry I could not travel both and be one traveler, long I stood and looked down one as far as I could to where it bent in the undergrowth; then took the other, as just as fair, and having perhaps the better claim.",
    author: "Robert Frost",
    source: "The Road Not Taken",
    length: "thicc"
  },
  {
    id: 18,
    text: "The only limit to our realization of tomorrow will be our doubts of today. Let us move forward with strong and active faith.",
    author: "Franklin D. Roosevelt",
    length: "medium"
  },
  {
    id: 19,
    text: "Focus is a muscle. The more you train it through deliberate practice, the sharper your thoughts become.",
    author: "Cal Newport",
    source: "Deep Work",
    length: "short"
  },
  {
    id: 20,
    text: "Code is like humor. When you have to explain it, it's bad.",
    author: "Cory House",
    length: "short"
  }
];

export function getQuoteByLength(lengthFilter: QuoteLength): Quote {
  let filtered = POPULAR_QUOTES;
  if (lengthFilter !== 'all') {
    filtered = POPULAR_QUOTES.filter(q => q.length === lengthFilter);
  }
  if (filtered.length === 0) {
    filtered = POPULAR_QUOTES;
  }
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}
